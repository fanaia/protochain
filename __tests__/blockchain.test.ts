import Block from "../src/lib/block";
import Blockchain from "../src/lib/blockchain";

describe("Blockchain tests", () => {
  test("Should has genesis block", () => {
    const blockchain = new Blockchain();
    expect(blockchain.blocks.length).toBe(1);
    expect(blockchain.blocks[0].index).toBe(0);
    expect(blockchain.blocks[0].data).toBe("Genesis Block");
  });

  test("Should be valid", () => {
    const blockchain = new Blockchain();
    expect(blockchain.isValid().success).toBeTruthy();
  });

  test("addBlock", () => {
    const blockchain = new Blockchain();
    const newBlock = new Block(1, blockchain.getLastBlock().hash, "data1");
    newBlock.mine(0, "miner");
    const ret = blockchain.addBlock(newBlock);
    expect(ret.success).toBeTruthy();
  });

  test("Blockchain Should be invalid", () => {
    const blockchain = new Blockchain();
    const newBlock = new Block(1, blockchain.getLastBlock().hash, "data1");
    newBlock.mine(0, "miner");
    const r = blockchain.addBlock(newBlock);
    blockchain.blocks[1].data = "data2";
    const validation = blockchain.isValid();
    expect(validation.success).toBeFalsy();
  });

  test("addBlock invalid", () => {
    const blockchain = new Blockchain();
    const newBlock = new Block(1, "", "data1");
    const ret = blockchain.addBlock(newBlock);
    expect(ret.success).toBeFalsy();
  });

  test("getBlock by hash", () => {
    const blockchain = new Blockchain();
    const block = blockchain.getBlock(blockchain.blocks[0].hash);
    expect(block).toBeTruthy();
  });

  test("getBlock not found by hash", () => {
    const blockchain = new Blockchain();
    const block = blockchain.getBlock("a");
    expect(block).toBeFalsy();
  });

  test("getNextBlock", () => {
    const blockchain = new Blockchain();
    const blockInfo = blockchain.getNextBlock();
    expect(blockInfo.index).toBe(1);
  });
});
