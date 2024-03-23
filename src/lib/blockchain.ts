import ECPairFactory, { ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import Block from "./block";
import Validation from "./validation";
import BlockInfo from "./blockInfo";
import Transaction from "./transaction";
import TransactionType from "./transactionType";
import TransactionSearch from "./transactionSearch";
import TransactionInput from "./transactionInput";

const ECPair = ECPairFactory(ecc);

export default class Blockchain {
  static readonly DIFFICULT_FACTOR: number = 5;
  static readonly MAX_DIFFICULTY: number = 62;
  static readonly TX_PER_BLOCK: number = 2;

  blocks: Block[];
  memPool: Transaction[];
  nextIndex: number = 0;

  constructor() {
    const keyPair = ECPair.makeRandom();
    const privateKey = keyPair.privateKey!.toString("hex");
    const publicKey = keyPair.publicKey.toString("hex");

    this.blocks = [];
    this.memPool = [];

    const transaction0: Transaction = new Transaction({
      type: TransactionType.FEE,
      to: publicKey,
      txInput: {
        fromAddress: publicKey,
        amount: 1,
      } as TransactionInput,
    } as Transaction);
    transaction0.txInput!.sign(privateKey);

    const genesisBlock = new Block({
      index: 0,
      previousHash: "",
      transactions: [transaction0] as Transaction[],
    } as Block);

    genesisBlock.mine(0, "miner");

    this.blocks.push(genesisBlock);
    this.nextIndex++;
  }

  getLastBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  addTransaction(transaction: Transaction): Validation {
    if (transaction.txInput) {
      const fromAddress = transaction.txInput.fromAddress;
      const pendingTxs = this.memPool.filter((tx) => tx.txInput!.fromAddress === fromAddress);
      if (pendingTxs && pendingTxs.length)
        return new Validation(false, "This wallet has a pending transaction.");

      //TODO: Validar a origem dos fundos
    }

    const validation = transaction.isValid();
    if (!validation.success)
      return new Validation(false, "Invalid transaction: " + validation.message);

    if (this.blocks.some((b) => b.transactions.some((t) => t.hash === transaction.hash)))
      return new Validation(false, "Duplicated tx in blockchain");

    this.memPool.push(transaction);
    return new Validation(true, transaction.hash);
  }

  addBlock(block: Block): Validation {
    const lastBlock = this.getLastBlock();
    const validation = block.isValid(lastBlock.index, lastBlock.hash, this.getDifficulty());
    if (!validation.success) return validation;

    const txs = block.transactions.filter((tx) => tx.type !== TransactionType.FEE).map((tx) => tx.hash);
    const newMemPool = this.memPool.filter((tx) => !txs.includes(tx.hash));
    if (newMemPool.length + txs.length !== this.memPool.length)
      return new Validation(false, "Some transactions are not in the mempool");

    this.blocks.push(block);
    this.nextIndex++;

    this.memPool = newMemPool;

    return new Validation(true, block.hash);
  }

  getDifficulty(): number {
    return Math.ceil(this.blocks.length / Blockchain.DIFFICULT_FACTOR) + 1;
  }

  getBlock(hash: string): Block | undefined {
    return this.blocks.find((block) => block.hash === hash);
  }

  getTransaction(hash: string): TransactionSearch {
    const memPoolIndex = this.memPool.findIndex((tx) => tx.hash === hash);
    if (memPoolIndex !== -1) {
      const transaction = this.memPool[memPoolIndex];
      return {
        memPoolIndex,
        transaction,
      } as TransactionSearch;
    }

    const blockIndex = this.blocks.findIndex((block) =>
      block.transactions.some((tx) => tx.hash === hash)
    );
    if (blockIndex !== -1) {
      const transaction = this.blocks[blockIndex].transactions.find((tx) => tx.hash === hash);
      return {
        blockIndex,
        transaction,
      } as TransactionSearch;
    }

    return { blockIndex: -1, memPoolIndex: -1 } as TransactionSearch;
  }

  isValid(): Validation {
    for (let i = this.blocks.length - 1; i > 0; i--) {
      const currentBlock = this.blocks[i];
      const previousBlock = this.blocks[i - 1];
      const validation = currentBlock.isValid(
        previousBlock.index,
        previousBlock.hash,
        this.getDifficulty()
      );
      if (!validation.success)
        return new Validation(false, `Invalid block #${currentBlock.index}: ${validation.message}`);
    }

    return new Validation();
  }

  getFeePerTx(): number {
    return 1;
  }

  getNextBlock(): BlockInfo | null {
    if (!this.memPool.length) return null;

    const transactions = this.memPool.slice(0, Blockchain.TX_PER_BLOCK);

    const difficulty = this.getDifficulty();
    const previousHash = this.getLastBlock().hash;
    const index = this.blocks.length;
    const feePerTx = this.getFeePerTx();
    const maxDifficulty = Blockchain.MAX_DIFFICULTY;

    return {
      transactions,
      difficulty,
      previousHash,
      index,
      feePerTx,
      maxDifficulty,
    } as BlockInfo;
  }
}
