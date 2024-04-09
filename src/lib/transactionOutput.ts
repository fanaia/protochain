import Validation from "./validation";
import sha256 from "crypto-js/sha256";

export default class TransactionOutput {
  toAddress: string;
  amount: number;
  tx: string;

  constructor(txOut?: TransactionOutput) {
    this.toAddress = txOut?.toAddress || "";
    this.amount = txOut?.amount || 0;
    this.tx = txOut?.tx || "";
  }

  isValid(): Validation {
    if (this.amount < 0) return new Validation(false, "Negative amount");
    return new Validation();
  }

  getHash(): string {
    return sha256(this.toAddress + this.amount).toString();
  }
}
