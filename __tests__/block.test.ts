import ECPairFactory, { ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import Block from "../src/lib/block";
import BlockInfo from "../src/lib/blockInfo";
import Transaction from "../src/lib/transaction";
import TransactionInput from "../src/lib/transactionInput";
import TransactionType from "../src/lib/transactionType";

const ECPair = ECPairFactory(ecc);

describe("Block", () => {
  let privateKey: string;
  let publicKey: string;
  let transaction: Transaction;
  let block: Block;

  beforeEach(() => {
    const keyPair = ECPair.makeRandom();
    privateKey = keyPair.privateKey?.toString("hex") || "";
    publicKey = keyPair.publicKey.toString("hex");

    const txFee = new Transaction({
      to: publicKey,
      type: TransactionType.FEE,
    } as Transaction);

    transaction = new Transaction({
      type: TransactionType.REGULAR,
      to: publicKey,
      txInput: new TransactionInput({
        fromAddress: publicKey,
        amount: 10,
      } as TransactionInput),
    } as Transaction);
    transaction.txInput!.sign(privateKey);

    block = new Block({
      index: 1,
      previousHash: "",
      transactions: [txFee, transaction],
      miner: publicKey,
    } as Block);
  });

  it("should create a new block", () => {
    expect(block).toBeTruthy();
  });

  it("should mine a block", () => {
    block.mine(0, publicKey);
    expect(block.hash).toBeTruthy();
    expect(block.miner).toBe(publicKey);
  });

  it("should validate a block", () => {
    const previousIndex = 0;
    const previousHash = block.previousHash;
    const difficulty = 2;

    block.miner = publicKey;
    block.hash = block.getHash();

    block.mine(difficulty, publicKey);
    const validation = block.isValid(previousIndex, previousHash, difficulty);
    expect(validation.success).toBe(true);
  });

  it("should create a new block from BlockInfo", () => {
    const blockInfo: BlockInfo = {
      index: 0,
      previousHash: "",
      difficulty: 0,
      maxDifficulty: 1,
      feePerTx: 1,
    } as BlockInfo;

    const newBlock = Block.fromBlockInfo(blockInfo);

    expect(newBlock.index).toBe(blockInfo.index);
    expect(newBlock.previousHash).toBe(blockInfo.previousHash);
  });

  it("should return false when there are no transactions", () => {
    block.transactions = [];
    const validation = block.isValid(0, block.previousHash, 2);
    expect(validation.success).toBe(false);
    expect(validation.message).toBe("No transactions");
  });

  it("should return false by Too many fees", () => {
    block.transactions.push(new Transaction({ type: TransactionType.FEE } as Transaction));
    block.transactions.push(new Transaction({ type: TransactionType.FEE } as Transaction));
    const validation = block.isValid(0, "", 0);
    expect(validation.message).toBe("Too many fees");
  });

  it("should return false by No fee tx", () => {
    block.transactions = block.transactions.filter(tx => tx.type !== TransactionType.FEE);
    const validation = block.isValid(0, "", 0);
    expect(validation.message).toBe("No fee tx");
  });

  it("should return false by Invalid fee tx: different from miner", () => {
    block.transactions[0].to = "teste";
    const validation = block.isValid(0, "", 0);
    expect(validation.message).toBe("Invalid fee tx: different from miner");
  });

  it("should return false by Invalid previousIndex", () => {
    const validation = block.isValid(1, "", 0);
    expect(validation.message).toBe("Invalid previousIndex");
  });

  it("should return false by Invalid timestamp", () => {
    block.timestamp = 0;
    const validation = block.isValid(0, "", 0);
    expect(validation.message).toBe("Invalid timestamp");
  });

  it("should return false by Invalid previousHash", () => {
    const validation = block.isValid(0, "x", 0);
    expect(validation.message).toBe("Invalid previousHash");
  });

  it("should return false by No mined block", () => {
    const validation = block.isValid(0, "", 0);
    expect(validation.message).toBe("No mined block");
  });

  it("should return false by Invalid hash", () => {
    block.mine(0, publicKey);
    block.hash = "";
    const validation = block.isValid(0, "", 0);
    expect(validation.message).toBe("Invalid hash");
  });

  it("should return false by Invalid transactions", () => {
    block.transactions[0].hash = "teste";
    const validation = block.isValid(0, "", 0);
    expect(validation.message).toContain("Invalid transactions");
  });
});
