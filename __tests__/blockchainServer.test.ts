import ECPairFactory, { ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import request from "supertest";
import { app } from "../src/server/blockchainServer";
import Blockchain from "../src/lib/blockchain";
import Transaction from "../src/lib/transaction";
import TransactionType from "../src/lib/transactionType";
import TransactionInput from "../src/lib/transactionInput";
import Block from "../src/lib/block";
import BlockInfo from "../src/lib/blockInfo";

const ECPair = ECPairFactory(ecc);

describe("Blockchain Server", () => {
  let privateKey: string;
  let publicKey: string;
  let blockchain: Blockchain;

  beforeEach(() => {
    const keyPair = ECPair.makeRandom();
    privateKey = keyPair.privateKey?.toString("hex") || "";
    publicKey = keyPair.publicKey.toString("hex");

    blockchain = new Blockchain();

    // Adicione algumas transações ao memPool
    for (let i = 0; i < 5; i++) {
      const txInput = new TransactionInput({
        fromAddress: publicKey,
        amount: 10,
      } as TransactionInput);
      txInput.sign(privateKey);

      const tx = new Transaction({
        type: TransactionType.REGULAR,
        to: publicKey,
        txInput: txInput,
      } as Transaction);

      blockchain.addTransaction(tx);
    }

    // Adicione alguns blocos à blockchain
    for (let i = 0; i < 5; i++) {
      const block = new Block({
        index: i,
        timestamp: Date.now(),
        transactions: blockchain.memPool.slice(
          i * Blockchain.TX_PER_BLOCK,
          (i + 1) * Blockchain.TX_PER_BLOCK
        ),
        previousHash: blockchain.getLastBlock().hash,
      } as Block);
      blockchain.addBlock(block);
    }
  });

  it("GET /status", async () => {
    const res = await request(app).get("/status");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("mempool");
    expect(res.body).toHaveProperty("blocks");
    expect(res.body).toHaveProperty("isValid");
    expect(res.body).toHaveProperty("lastBlock");
    expect(res.body).toHaveProperty("difficulty");
  });

  it("GET /transactions/:hash", async () => {
    const res = await request(app).get("/transactions/test-hash");
    expect(res.statusCode).toEqual(200);
  });

  it("GET /transactions", async () => {
    const res = await request(app).get("/transactions");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("next");
    expect(res.body).toHaveProperty("total");
  });

  it("POST /transactions", async () => {
    const txInput = new TransactionInput({
      fromAddress: publicKey,
      amount: 10,
    } as TransactionInput);
    txInput.sign(privateKey);

    const tx = new Transaction({
      type: TransactionType.REGULAR,
      to: publicKey,
      txInput: txInput,
    } as Transaction);

    const res = await request(app).post("/transactions").send(tx);
    expect(res.statusCode).toEqual(201);
  });

  it("POST /transactions Undefined hash", async () => {
    const res = await request(app).post("/transactions").send({});
    expect(res.statusCode).toEqual(422);
    expect(res.body.message).toContain("Undefined hash");
  });

  it("POST /transactions with invalid tx", async () => {
    const txInput = new TransactionInput({
      fromAddress: publicKey,
      amount: 10,
    } as TransactionInput);

    const tx = new Transaction({
      type: TransactionType.REGULAR,
      to: publicKey,
      txInput: txInput,
    } as Transaction);

    const res = await request(app).post("/transactions").send(tx);
    expect(res.statusCode).toEqual(400);
  });

  it("GET /blocks/next", async () => {
    const res = await request(app).get("/blocks/next");
    expect(res.statusCode).toEqual(200);
  });

  it("GET /blocks/:indexOrHash by index", async () => {
    const res = await request(app).get(`/blocks/0`);
    expect(res.statusCode).toEqual(200);
  });

  it("GET /blocks/:indexOrHash by hash", async () => {
    const res1 = await request(app).get(`/blocks/0`);
    const res2 = await request(app).get(`/blocks/${res1.body.hash}`);
    expect(res2.statusCode).toEqual(200);
  });

  it("GET /blocks/:indexOrHash not found", async () => {
    const res1 = await request(app).get(`/blocks/10`);
    expect(res1.statusCode).toEqual(404);
  });

  it("POST /blocks with valid block", async () => {
    const tx = new Transaction({
      type: TransactionType.REGULAR,
      to: publicKey,
      txInput: new TransactionInput({
        fromAddress: publicKey,
        amount: 10,
      } as TransactionInput),
    } as Transaction);
    tx.txInput!.sign(privateKey);
    await request(app).post("/transactions").send(tx);
    const resNext = await request(app).get("/blocks/next");
    const blockinfo = resNext.body as BlockInfo;
    if (!blockinfo) throw new Error("Blockinfo is undefined");

    const newBlock = Block.fromBlockInfo(blockinfo);
    newBlock.transactions.push(
      new Transaction({
        to: publicKey,
        type: TransactionType.FEE,
      } as Transaction)
    );
    newBlock.miner = publicKey;
    newBlock.hash = newBlock.getHash();
    newBlock.mine(blockinfo.difficulty, publicKey);

    const res = await request(app).post("/blocks").send(newBlock);
    expect(res.statusCode).toEqual(201);
  });

  it("POST /blocks with invalid index", async () => {
    const invalidBlock = new Block();
    const res = await request(app).post("/blocks").send(invalidBlock);
    expect(res.statusCode).toEqual(422);
  });

  it("POST /blocks with invalid block", async () => {
    const res = await request(app).post("/blocks").send({ index: 1 });
    expect(res.statusCode).toEqual(400);
  });
});
