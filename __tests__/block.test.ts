import Block from "../src/lib/block";
import BlockInfo from "../src/lib/blockInfo";

const DIFFICULT = 0;
const MINER = "minerExample";

describe("block", () => {
  test("Should be valid", () => {
    const blockTest = new Block(1, "previousHash", "data1");

    blockTest.mine(DIFFICULT, MINER);

    expect(blockTest).toBeTruthy();
    const validation = blockTest.isValid(0, "previousHash", 0);
    expect(validation.success).toBeTruthy();
  });

  test("Should be invalid - index", () => {
    const blockTest = new Block(-1, "previousHash", "data");
    const validation = blockTest.isValid(0, "previousHash", 0);
    expect(validation.success).toBeFalsy();
  });

  test("Should be invalid - data", () => {
    const blockTest = new Block(1, "previousHash", "");
    const validation = blockTest.isValid(0, "previousHash", 0);
    expect(validation.success).toBeFalsy();
  });

  test("Should be invalid - previousIndex", () => {
    const blockTest = new Block(1, "previousHash", "data");
    const validation = blockTest.isValid(1, "previousHash", 0);
    expect(validation.success).toBeFalsy();
  });

  test("Should be invalid - previousHash", () => {
    const blockTest = new Block(1, "", "data");
    const validation = blockTest.isValid(0, "previousHash", 0);
    expect(validation.success).toBeFalsy();
  });

  test("Should be invalid - hash", () => {
    const blockTest = new Block(1, "previousHash", "data");
    blockTest.data = "data2";
    const validation = blockTest.isValid(0, "previousHash", 0);
    expect(validation.success).toBeFalsy();
  });

  test("fromBlockInfo", () => {
    const blockInfo: BlockInfo = {
      index: 1,
      previousHash: "",
      difficulty: 1,
      maxDifficulty: 1,
      feePerTx: 1,
      data: "",
    };
    const block = Block.fromBlockInfo(blockInfo);
    expect(block.index).toBe(blockInfo.index);
  });
});
