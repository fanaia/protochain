import ECPairFactory, { ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import Blockchain from "../src/lib/blockchain";
import Block from "../src/lib/block";
import Transaction from "../src/lib/transaction";
import TransactionInput from "../src/lib/transactionInput";
import TransactionType from "../src/lib/transactionType";

const ECPair = ECPairFactory(ecc);

describe("Blockchain", () => {
  let privateKey: string;
  let publicKey: string;
  let blockchain: Blockchain;
  let transaction: Transaction;
  let block: Block;

  beforeEach(() => {
    const keyPair = ECPair.makeRandom();
    privateKey = keyPair.privateKey?.toString("hex") || "";
    publicKey = keyPair.publicKey.toString("hex");

    blockchain = new Blockchain();
    transaction = new Transaction({
      type: TransactionType.REGULAR,
      to: publicKey,
      txInput: new TransactionInput({
        fromAddress: publicKey,
        amount: 10,
      } as TransactionInput),
    } as Transaction);
    transaction.txInput.sign(privateKey);

    block = new Block({
      index: 1,
      previousHash: "",
      transactions: [transaction],
    } as Block);
  });

  it("should add a valid transaction", () => {
    const validation = blockchain.addTransaction(transaction);
    expect(validation.success).toBe(true);
    expect(blockchain.memPool).toContain(transaction);
  });

  it("should not add an invalid transaction", () => {
    transaction.to = "";
    const validation = blockchain.addTransaction(transaction);
    expect(validation.success).toBe(false);
    expect(validation.message).toBe("Invalid transaction: Invalid to");
  });

  it("should not add a duplicated transaction in blockchain", () => {
    blockchain.blocks[0].transactions.push(transaction);
    const validation = blockchain.addTransaction(transaction);
    expect(validation.success).toBe(false);
    expect(validation.message).toBe("Duplicated tx in blockchain");
  });

  it("should not add a duplicated transaction in mempool", () => {
    blockchain.memPool.push(transaction);
    const validation = blockchain.addTransaction(transaction);
    expect(validation.success).toBe(false);
    expect(validation.message).toBe("Duplicated tx in mempool");
  });

  it("should add a valid block", () => {
    blockchain.addTransaction(transaction);
    const blockinfo = blockchain.getNextBlock();
    if (!blockinfo) throw new Error("Blockinfo is undefined");

    const newBlock = Block.fromBlockInfo(blockinfo);
    newBlock.mine(blockchain.getDifficulty(), publicKey);

    const validation = blockchain.addBlock(newBlock);
    expect(validation.success).toBe(true);
    expect(blockchain.blocks).toContain(newBlock);
  });

  it("should not add an invalid block", () => {
    block.timestamp = 0;
    const validation = blockchain.addBlock(block);
    expect(validation.success).toBe(false);
    expect(validation.message).toBe("Invalid timestamp");
  });

  it("should not add a block with transactions not in the mempool", () => {
    blockchain.addTransaction(transaction);
    const blockinfo = blockchain.getNextBlock();
    if (!blockinfo) throw new Error("Blockinfo is undefined");
    const newBlock = Block.fromBlockInfo(blockinfo);

    const transaction2 = new Transaction({
      type: TransactionType.REGULAR,
      to: publicKey,
      txInput: new TransactionInput({
        fromAddress: publicKey,
        amount: 10,
      } as TransactionInput),
    } as Transaction);
    transaction2.txInput.sign(privateKey);
    newBlock.transactions.push(transaction2);

    newBlock.mine(blockchain.getDifficulty(), publicKey);

    const validation = blockchain.addBlock(newBlock);
    expect(validation.success).toBe(false);
    expect(validation.message).toBe("Some transactions are not in the mempool");
  });

  it("should get a block by hash", () => {
    blockchain.addTransaction(transaction);
    const blockinfo = blockchain.getNextBlock();
    if (!blockinfo) throw new Error("Blockinfo is undefined");

    const newBlock = Block.fromBlockInfo(blockinfo);
    newBlock.mine(blockchain.getDifficulty(), publicKey);
    blockchain.addBlock(newBlock);

    const retrievedBlock = blockchain.getBlock(newBlock.hash);
    expect(retrievedBlock).toEqual(newBlock);
  });

  it("should return undefined if block does not exist", () => {
    const retrievedBlock = blockchain.getBlock("nonexistentHash");
    expect(retrievedBlock).toBeUndefined();
  });

  it('should get a transaction by hash in mempool', () => {
    blockchain.memPool.push(transaction);
    const retrievedTransaction = blockchain.getTransaction(transaction.hash);
    expect(retrievedTransaction.memPoolIndex).toBeGreaterThan(-1);
  });

  it('should get a transaction by hash in blocks', () => {
    blockchain.blocks.push(block);
    const retrievedTransaction = blockchain.getTransaction(transaction.hash);
    expect(retrievedTransaction.blockIndex).toBeGreaterThan(-1);
  });

  it('should return undefined if transaction does not exist', () => {
    const retrievedTransaction = blockchain.getTransaction('nonexistentId');
    expect(retrievedTransaction.memPoolIndex).toBe(-1);
  });

  it('should return true for a valid blockchain', () => {
    const isValid = blockchain.isValid();
    expect(isValid.success).toBe(true);
  });

  it('should return false for an invalid blockchain', () => {
    blockchain.blocks.push(new Block());
    const isValid = blockchain.isValid();
    expect(isValid.success).toBe(false);
  });

  it('should return undefined if mempool is empty', () => {
    const nextBlock = blockchain.getNextBlock();
    expect(nextBlock).toBe(null);
  });
});
