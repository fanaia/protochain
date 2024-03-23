import sha256 from "crypto-js/sha256";
import TransactionType from "./transactionType";
import Validation from "./validation";
import TransactionInput from "./transactionInput";

export default class Transaction {
  type: TransactionType;
  timestamp: number;
  hash: string;
  txInput: TransactionInput;
  to: string;

  constructor(tx?: Transaction) {
    this.type = tx?.type || TransactionType.REGULAR;
    this.to = tx?.to || "";
    this.timestamp = tx?.timestamp || Date.now();
    this.hash = tx?.hash || this.getHash();
    this.txInput = new TransactionInput(tx?.txInput) || new TransactionInput();
  }

  getHash(): string {
    return sha256(this.type + this.to + this.timestamp).toString();
  }

  isValid(): Validation {
    if (this.to.length === 0) return new Validation(false, "Invalid to");
    if (this.hash !== this.getHash()) return new Validation(false, "Invalid hash");

    if (this.txInput) {
      const validation = this.txInput.isValid();
      if (!validation.success) return new Validation(false, `Invalid tx: ${validation.message}`);
    }

    return new Validation();
  }
}
