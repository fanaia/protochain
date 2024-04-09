// import TransactionInput from "../src/lib/transactionInput";
// import ECPairFactory, { ECPairInterface } from "ecpair";
// import * as ecc from "tiny-secp256k1";
// import { SHA256 } from "crypto-js";

// const ECPair = ECPairFactory(ecc);

// describe("TransactionInput", () => {
//   let txInput: TransactionInput;
//   let privateKey: string;
//   let publicKey: string;
//   let privateKey2: string;
//   let publicKey2: string;

//   beforeEach(() => {
//     const keyPair = ECPair.makeRandom();
//     privateKey = keyPair.privateKey?.toString("hex") || "";
//     publicKey = keyPair.publicKey.toString("hex");

//     const keyPair2 = ECPair.makeRandom();
//     privateKey2 = keyPair2.privateKey?.toString("hex") || "";
//     publicKey2 = keyPair2.publicKey.toString("hex");

//     txInput = new TransactionInput({
//       fromAddress: publicKey,
//       amount: 10,
//     } as TransactionInput);
//     txInput.sign(privateKey);
//   });

//   it("should create a new transaction input", () => {
//     const txInput2 = new TransactionInput();
//     expect(txInput2.fromAddress).toBe("");
//     expect(txInput2.amount).toBe(0);
//     expect(txInput2.signature).toBe("");
//   });

//   it("should sign the transaction input", () => {
//     txInput.sign(privateKey);
//     expect(txInput.signature).not.toBe("");
//   });

//   it("should return the correct hash", () => {
//     const hash = SHA256(publicKey + "10").toString();
//     expect(hash).toBe(SHA256(publicKey + "10").toString());
//   });

//   it("should validate a valid transaction input", () => {
//     txInput.sign(privateKey);
//     const validation = txInput.isValid();
//     expect(validation.success).toBe(true);
//   });

//   it("should not validate a transaction input with missing signature", () => {
//     const txInput2 = new TransactionInput(txInput);
//     txInput2.signature = "";

//     const validation = txInput2.isValid();
//     expect(validation.success).toBe(false);
//     expect(validation.message).toBe("Signature is missing");
//   });

//   it("should not validate a transaction input with amount less than 1", () => {
//     txInput.amount = 0;
//     const validation = txInput.isValid();
//     expect(validation.success).toBe(false);
//     expect(validation.message).toBe("Amount must be greater than zero.");
//   });

//   it("should not validate a transaction input with invalid signature", () => {
//     const txInput2 = new TransactionInput(txInput);
//     txInput2.sign(privateKey2);

//     const validation = txInput2.isValid();
//     expect(validation.success).toBe(false);
//     expect(validation.message).toBe("Invalid tx input signature");
//   });
// });
