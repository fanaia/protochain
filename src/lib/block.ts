import sha256 from "crypto-js/sha256";
import Validation from "./validation";
import BlockInfo from "./blockInfo";
import Transaction from "./transaction";
import TransactionType from "./transactionType";

export default class Block {
  index: number;
  hash: string;
  previousHash: string;
  transactions: Transaction[];
  timestamp: number;
  nonce?: number;
  miner?: string;

  constructor(block?: Block) {
    this.index = block?.index || 0;
    this.timestamp = block?.timestamp || Date.now();
    this.previousHash = block?.previousHash || "";
    this.transactions =
      (block?.transactions?.map((tx: any) => new Transaction(tx)) as Transaction[]) || [];
    this.nonce = block?.nonce || 0;
    this.miner = block?.miner || "";
    this.hash = block?.hash || "";
  }

  getHash(): string {
    const txs = this.transactions.map((tx) => tx.hash).reduce((a, b) => a + b);
    const hash: string =
      this.index + this.timestamp + this.previousHash + txs + this.nonce + this.miner;
    return sha256(hash).toString();
  }

  mine(difficulty: number, miner: string) {
    const prefix = "0".repeat(difficulty + 1);
    let hash: string;

    this.miner = miner;
    this.nonce = 0;

    do {
      this.nonce++;
      // this.nonce = Math.floor(Math.random() * 100000);
      hash = this.getHash();
    } while (!hash.startsWith(prefix));

    this.hash = hash;
  }

  isValid(
    previousIndex: number,
    previousHash: string,
    difficulty: number,
    feePerTx: number
  ): Validation {
    if (!this.transactions || this.transactions.length < 1)
      return new Validation(false, "No transactions");

    const feeTxs = this.transactions.filter((tx) => tx.type === TransactionType.FEE);
    if (!feeTxs.length) return new Validation(false, "No fee tx");
    if (feeTxs.length > 1) return new Validation(false, "Too many fees");

    if (!feeTxs[0].txOutputs?.some((txo) => txo.toAddress === this.miner))
      return new Validation(false, "Invalid fee tx: different from miner");

    const totalFees =
      feePerTx * this.transactions.filter((tx) => tx.type != TransactionType.FEE).length;
    const validationsTx = this.transactions.map((tx) => tx.isValid(difficulty, totalFees));
    const errorsTx = validationsTx.filter((v) => !v.success).map((v) => v.message);

    if (errorsTx.length > 0)
      return new Validation(false, "Invalid transactions: " + errorsTx.reduce((a, b) => a + b));

    if (this.index !== previousIndex + 1) return new Validation(false, "Invalid previousIndex");
    if (this.timestamp < 1) return new Validation(false, "Invalid timestamp");
    if (this.previousHash !== previousHash) return new Validation(false, "Invalid previousHash");
    if (this.nonce! < 1 || !this.miner) return new Validation(false, "No mined block");

    const prefix = new Array(difficulty + 1).join("0");
    if (this.hash !== this.getHash() || !this.hash.startsWith(prefix))
      return new Validation(false, "Invalid hash");

    return new Validation();
  }

  static fromBlockInfo(blockInfo: BlockInfo): Block {
    const block = new Block();
    block.index = blockInfo.index;
    block.previousHash = blockInfo.previousHash;
    block.transactions = blockInfo.transactions?.map((tx) => new Transaction(tx)) || [];
    return block;
  }
}
