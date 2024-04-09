// import Wallet from "../src/lib/wallet";

// describe("Wallet tests", () => {
//   let privateKey = "0bd1ba7a5a7cd5d3601f20aca927b05734fc9fcfb06bb226d11aa2646b44e9e5";
//   let wif = "Kwcgjq5zWTd78M2mBwP5kRCvPHM2EimZB5xL3P5oPhSSmU8ud8Bc";
//   let alice: Wallet;

//   beforeAll(() => {
//     alice = new Wallet();
//   });
  
//   test("Should by valid", () => {
//     const wallet = new Wallet();
//     expect(wallet.privateKey).toBeTruthy();
//     expect(wallet.publicKey).toBeTruthy();
//   });

//   test("Should recover wallet from private key", () => {
//     const wallet = new Wallet();
//     const recoveredWallet = new Wallet(wallet.privateKey);
//     expect(wallet.publicKey).toEqual(recoveredWallet.publicKey);
//   });

//   test("Should recover wallet from wif", () => {
//     const wallet = new Wallet(wif);
//     expect(wallet).toBeTruthy();
//   });
// });
