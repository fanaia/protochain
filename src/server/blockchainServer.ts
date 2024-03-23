import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import Blockchain from "../lib/blockchain";
import Block from "../lib/block";
import Validation from "../lib/validation";
import Transaction from "../lib/transaction";

const PORT: number = parseInt(`${process.env.BLOCKCHAIN_PORT}`);

const app = express();

app.use(morgan("tiny"));
app.use(express.json());

const blockchain = new Blockchain();

app.get("/status", (req, res, next) => {
  res.json({
    mempool: blockchain.memPool.length,
    blocks: blockchain.blocks.length,
    isValid: blockchain.isValid().success,
    lastBlock: blockchain.getLastBlock(),
    difficulty: blockchain.getDifficulty(),
  });
});

app.get("/transactions/:hash?", (req, res, next) => {
  if (req.params.hash) {
    return res.json(blockchain.getTransaction(req.params.hash));
  } else {
    return res.json({
      next: blockchain.memPool.slice(0, Blockchain.TX_PER_BLOCK),
      total: blockchain.memPool.length,
    });
  }
});

app.post("/transactions", (req, res, next) => {
  if (req.body.hash === undefined) return res.status(422).send({ message: "Undefined hash" });

  const tx = new Transaction(req.body as Transaction);

  const validation: Validation = blockchain.addTransaction(tx);
  if (validation.success) return res.status(201).json(tx);
  else return res.status(400).json({ message: "Tx validation failed", validation });
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

  const block = new Block(req.body as Block);

  const validation: Validation = blockchain.addBlock(block);
  if (validation.success) return res.status(201).json(block);
  else return res.status(400).json({ message: "Block validation failed", validation });
}); 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app };
