import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import Blockchain from "../lib/blockchain";
import Block from "../lib/block";
import Validation from "../lib/validation";

const PORT: number = parseInt(`${process.env.BLOCKCHAIN_PORT || "3000"}`);

const app = express();

app.use(morgan("tiny"));
app.use(express.json());

const blockchain = new Blockchain();

app.get("/status", (req, res, next) => {
  res.json({
    isValid: blockchain.isValid().success,
    numberOfBlocks: blockchain.blocks.length,
    lastBlock: blockchain.getLastBlock(),
    difficulty: blockchain.getDifficulty(),
  });
});

app.get("/blocks/next", (req, res, next) => {
  res.json(blockchain.getNextBlock());
});

app.get("/blocks/:indexOrHash", (req, res, next) => {
  let block;

  if (/^[0-9]+$/.test(req.params.indexOrHash)) {
    block = blockchain.blocks[parseInt(req.params.indexOrHash)];
  } else {
    block = blockchain.getBlock(req.params.indexOrHash);
  }

  if (!block) return res.status(404).json({ message: "Block not found" });
  else return res.json(block);
});

app.post("/blocks", (req, res, next) => {
  if (!req.body.index || isNaN(parseFloat(req.body.index)))
    return res.status(422).send({ message: "Invalid index" });

  const newBlock = new Block(
    req.body.index,
    req.body.previousHash,
    req.body.data,
    req.body.timestamp,
    req.body.hash,
    req.body.nonce,
    req.body.miner
  );
  const validation: Validation = blockchain.addBlock(newBlock);
  if (validation.success) return res.status(201).json(newBlock);
  else return res.status(400).json({ message: "Block validation failed", validation });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app };
