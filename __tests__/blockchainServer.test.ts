import request from "supertest";
import { app } from "../src/server/blockchainServer";
import Block from "../src/lib/block";

beforeAll(() => {
  // app.listen(3000);
});

let block0: Block;

describe("blockchainServer", () => {
  test("GET /status", async () => {
    const response = await request(app).get("/status");
    expect(response.status).toEqual(200);
    expect(response.body.numberOfBlocks).toEqual(1);
  });

  test("GET /blocks/next", async () => {
    const response = await request(app).get("/blocks/next");
    expect(response.status).toEqual(200);
    expect(response.body.index).toEqual(1);
  });

  test("GET /blocks/:indexOrHash by index", async () => {
    const response = await request(app).get("/blocks/0");
    block0 = response.body;
    expect(response.status).toEqual(200);
    expect(block0.data).toEqual("Genesis Block");
  });

  test("GET /blocks/:indexOrHash by hash", async () => {
    const response = await request(app).get(`/blocks/${block0.hash}`);
    expect(response.status).toEqual(200);
    expect(response.body.index).toEqual(0);
  });

  test("GET /blocks/:indexOrHash not found", async () => {
    const response = await request(app).get("/blocks/10");
    expect(response.status).toEqual(404);
  });

  test("POST /blocks valid", async () => {
    const newBlock = new Block(1, block0.hash, "block2");
    await newBlock.mine(0, "miner");
    const response = await request(app).post("/blocks/").send(newBlock);
    expect(response.status).toEqual(201);
  });

  test("POST /blocks invalid index", async () => {
    const response = await request(app).post("/blocks/").send({
      index: "x",
      previousHash: block0.hash,
      data: "block2",
    });
    expect(response.status).toEqual(422);
  });

  test("POST /blocks invalid", async () => {
    const response = await request(app).post("/blocks/").send({
      index: 1,
      previousHash: block0.hash,
      data: "block2 fail",
    });
    expect(response.status).toEqual(400);
  });
});
