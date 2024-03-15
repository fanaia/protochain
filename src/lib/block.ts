import sha256 from "crypto-js/sha256";
import Validation from "./validation";
import BlockInfo from "./blockInfo";

export default class Block {
  index: number;
  hash: string;
  previousHash: string;
  data: string;
  timestamp: number;
  nonce?: number;
  miner?: string;

  constructor(
    index: number,
    previousHash: string,
    data: string,
    timestamp: number = Date.now(),
    hash: string = "",
    nonce?: number,
    miner?: string
  ) {
    this.index = index;
    this.previousHash = previousHash;
    this.data = data;
    if (nonce) this.nonce = nonce;
    if (miner) this.miner = miner;
    this.timestamp = timestamp;
    this.hash = hash || this.getHash();
  }

  getHash(): string {
    const hash: string =
      this.index + this.data + this.timestamp + this.previousHash + this.nonce + this.miner;
    return sha256(hash).toString();
  }

  async mine(difficulty: number, miner: string) {
    const prefix = "0".repeat(difficulty + 1);
    let hash: string;

    this.miner = miner;
    this.nonce = 0;

    do {
      this.nonce++;
      // this.nonce = Math.floor(Math.random() * 10000000000); 
      hash = this.getHash();
    } while (!hash.startsWith(prefix));

    this.hash = hash;
  }

  isValid(previousIndex: number, previousHash: string, difficulty: number): Validation {
    if (this.index < 0) return new Validation(false, "Invalid index");
    if (!this.data) return new Validation(false, "Invalid data");
    if (this.index !== previousIndex + 1) return new Validation(false, "Invalid previousIndex");
    if (this.previousHash !== previousHash) return new Validation(false, "Invalid previousHash");
    if (!this.nonce || !this.miner) return new Validation(false, "No mined block");

    const prefix = new Array(difficulty + 1).join("0");
    if (this.hash !== this.getHash() || !this.hash.startsWith(prefix))
      return new Validation(false, "Invalid hash");

    return new Validation();
  }

  static fromBlockInfo(blockInfo: BlockInfo): Block {
    const block = new Block(blockInfo.index, blockInfo.previousHash, blockInfo.data);
    return block;
  }
} 