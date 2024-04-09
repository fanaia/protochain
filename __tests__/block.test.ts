// import Block from "../src/lib/block";
// import Transaction from "../src/lib/transaction";
// import TransactionType from "../src/lib/transactionType";
// import Validation from "../src/lib/validation";

// describe("Block", () => {
//   let block: Block;
//   let transaction: Transaction;

// beforeEach(() => {
//   transaction = new Transaction({
//     type: TransactionType.REGULAR,
//     txInputs: [],
//     txOutputs: [],
//     timestamp: Date.now(),
//     hash: "",
//     getHash: () => "",
//     isValid: (): Validation => ({ isValid: true }),
//   });
//   block = new Block({
//     index: 0,
//     timestamp: Date.now(),
//     previousHash: "previousHash",
//     transactions: [transaction],
//     nonce: 0,
//     miner: "miner",
//     hash: "hash",
//     getHash: () => "",
//     mine: () => {},
//     isValid: () => true,
//   });
// });

// it("should create a new block with all fields", () => {
//   expect(block.index).toBe(0);
//   expect(block.timestamp).toBeDefined();
//   expect(block.previousHash).toBe("previousHash");
//   expect(block.transactions).toEqual([transaction]);
//   expect(block.nonce).toBe(0);
//   expect(block.miner).toBe("miner");
//   expect(block.hash).toBe("hash");
// });

//   it("should calculate the correct hash", () => {
//     const hash = block.getHash();
//     expect(hash).toBe(block.hash);
//   });

//   it("should mine a block", () => {
//     const difficulty = 2;
//     const miner = "miner";
//     block.mine(difficulty, miner);
//     expect(block.hash.startsWith("00")).toBe(true);
//     expect(block.miner).toBe(miner);
//   });
// });
