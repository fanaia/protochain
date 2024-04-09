import ECPairFactory, { ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import Block from "./block";
import Validation from "./validation";
import BlockInfo from "./blockInfo";
import Transaction from "./transaction";
import TransactionType from "./transactionType";
import TransactionSearch from "./transactionSearch";
import TransactionOutput from "./transactionOutput";
import TransactionInput from "./transactionInput";

const ECPair = ECPairFactory(ecc);

export default class Blockchain {
  static readonly DIFFICULT_FACTOR: number = 5;
  static readonly MAX_DIFFICULTY: number = 62;
  static readonly TX_PER_BLOCK: number = 2;

  blocks: Block[];
  memPool: Transaction[];
  nextIndex: number = 0;

  constructor(miner: string) {
    this.blocks = [];
    this.memPool = [];

    const genesisBlock = this.createGenesisBlock(miner);
    this.blocks.push(genesisBlock);
    this.nextIndex++;
  }

  createGenesisBlock(miner: string): Block {
    const amount = 10; //TODO: calcular recompensa

    const tx = new Transaction({
      type: TransactionType.FEE,
      txOutputs: [{ toAddress: miner, amount } as TransactionOutput],
    } as Transaction);
    tx.hash = tx.getHash();
    tx.txOutputs![0].tx = tx.hash;

    const block = new Block();
    block.transactions = [tx];
    block.mine(this.getDifficulty(), miner);

    return block;
  }

  getLastBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  addTransaction(transaction: Transaction): Validation {
    if (transaction.txInputs && transaction.txInputs.length) {
      const from = transaction.txInputs[0].fromAddress;
      const pendingTxs = this.memPool
        .filter((tx) => tx.txInputs && tx.txInputs.length)
        .map((tx) => tx.txInputs)
        .flat()
        .filter((tx) => tx!.fromAddress === from);

      if (pendingTxs && pendingTxs.length)
        return new Validation(false, "This wallet has a pending transaction.");

      const utxo = this.getUtxo(from);
      for (let i = 0; i < transaction.txInputs.length; i++) {
        const txIn = transaction.txInputs[i];
        const index = utxo.findIndex(
          (txo) => txo!.tx === txIn.previousTx && txo!.amount >= txIn.amount
        );
        if (index === -1)
          return new Validation(false, "Invalid tx: the TXO is already spent or inexistent.");
      }
    }

    const validation = transaction.isValid(this.getDifficulty(), this.getFeePerTx());
    if (!validation.success)
      return new Validation(false, "Invalid transaction: " + validation.message);

    if (this.blocks.some((b) => b.transactions.some((t) => t.hash === transaction.hash)))
      return new Validation(false, "Duplicated tx in blockchain");

    this.memPool.push(transaction);
    return new Validation(true, transaction.hash);
  }

  addBlock(block: Block): Validation {
    const nextBlock = this.getNextBlock();
    if (!nextBlock) return new Validation(false, "There is no next block info");

    const validation = block.isValid(
      nextBlock.index - 1,
      nextBlock.previousHash,
      nextBlock.difficulty,
      nextBlock.feePerTx
    );
    if (!validation.success) return new Validation(false, "Invalid block: " + validation.message);

    const txs = block.transactions
      .filter((tx) => tx.type !== TransactionType.FEE)
      .map((tx) => tx.hash);
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
        this.getDifficulty(),
        this.getFeePerTx()
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

  getTxInputs(wallet: string): (TransactionInput | undefined)[] {
    return this.blocks
      .map((tx) => tx.transactions)
      .flat()
      .filter((tx) => tx.txInputs && tx.txInputs.length)
      .map((tx) => tx.txInputs)
      .flat()
      .filter((tx) => tx!.fromAddress === wallet);
  }

  getTxOutputs(wallet: string): (TransactionOutput | undefined)[] {
    return this.blocks
      .map((tx) => tx.transactions)
      .flat()
      .filter((tx) => tx.txOutputs && tx.txOutputs.length)
      .map((tx) => tx.txOutputs)
      .flat()
      .filter((tx) => tx!.toAddress === wallet);
  }

  getUtxo(wallet: string): (TransactionOutput | undefined)[] {
    const txIns = this.getTxInputs(wallet);
    const txOuts = this.getTxOutputs(wallet);

    if (!txIns || !txIns.length) return txOuts;

    txIns.forEach((txIn) => {
      const index = txOuts.findIndex((txo) => txo!.amount === txIn!.amount);
      if (index !== -1) txOuts.splice(index, 1);
    });

    return txOuts;
  }

  getBalance(wallet: string): number {
    const utxo = this.getUtxo(wallet);
    if (!utxo || !utxo.length) return 0;

    return utxo.reduce((acc, txo) => acc + txo!.amount, 0);
  }

  static getRewardAmout(difficulty: number): number {
    return (64 - difficulty) * 10;
  }
}
