// import ECPairFactory, { ECPairInterface } from "ecpair";
// import * as ecc from "tiny-secp256k1";
// import Transaction from "../src/lib/transaction";
// import TransactionType from "../src/lib/transactionType";
// import TransactionInput from "../src/lib/transactionInput";

// const ECPair = ECPairFactory(ecc);

// describe("Transaction", () => {
//   let privateKey: string;
//   let publicKey: string;
//   let transaction: Transaction;

//   beforeEach(() => {
//     const keyPair = ECPair.makeRandom();
//     privateKey = keyPair.privateKey?.toString("hex") || "";
//     publicKey = keyPair.publicKey.toString("hex");

//     transaction = new Transaction({
//       type: TransactionType.REGULAR,
//       to: publicKey,
//       txInput: new TransactionInput({
//         fromAddress: publicKey,
//         amount: 10,
//       } as TransactionInput),
//     } as Transaction);
//     transaction.txInput!.sign(privateKey);
//   });

//   it("should create a new transaction with fields null", () => {
//     const transaction = new Transaction();
//     expect(transaction).toBeTruthy();
//   });

//   it("deve criar uma instância", () => {
//     expect(transaction).toBeTruthy();
//   });

//   it("deve obter o hash da transação", () => {
//     const hash = transaction.getHash();
//     expect(hash).toBeTruthy();
//   });

//   it("deve validar a transação", () => {
//     const validation = transaction.isValid();
//     expect(validation.success).toBe(true);
//   });

//   it("não deve validar uma transação inválida", () => {
//     transaction.to = "";
//     const validation = transaction.isValid();
//     expect(validation.success).toBe(false);
//   });

//   it("não deve validar uma transação com hash inválido", () => {
//     transaction.hash = "invalid-hash";
//     const validation = transaction.isValid();
//     expect(validation.success).toBe(false);
//   });

//   it("não deve validar uma transação com txInput inválido", () => {
//     transaction.txInput = new TransactionInput();
//     const validation = transaction.isValid();
//     expect(validation.success).toBe(false);
//   });
// });
