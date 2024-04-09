import sha256 from "crypto-js/sha256";
import TransactionType from "./transactionType";
import Validation from "./validation";
import TransactionInput from "./transactionInput";
import TransactionOutput from "./transactionOutput";
import Blockchain from "./blockchain";

export default class Transaction {
  type: TransactionType;
  timestamp: number;
  hash: string;
  txInputs: TransactionInput[] | undefined;
  txOutputs: TransactionOutput[] | undefined;

  constructor(tx?: Transaction) {
    this.type = tx?.type || TransactionType.REGULAR;
    this.timestamp = tx?.timestamp || Date.now();

    this.txInputs = tx?.txInputs ? tx.txInputs.map((txi) => new TransactionInput(txi)) : undefined;
    this.txOutputs = tx?.txOutputs
      ? tx.txOutputs.map((txo) => new TransactionOutput(txo))
      : undefined;

    this.hash = tx?.hash || this.getHash();

    this.txOutputs?.forEach((txo, index, arr) => {
      arr[index].tx = this.hash;
    });
  }

  getHash(): string {
    const from =
      this.txInputs && this.txInputs.length > 0
        ? this.txInputs?.map((txi) => txi.signature).join("")
        : "";

    const to =
      this.txOutputs && this.txOutputs.length > 0
        ? this.txOutputs?.map((txo) => txo.getHash()).join("")
        : "";

    return sha256(this.type + from + to + this.timestamp).toString();
  }

  isValid(difficulty: number, totalFees: number): Validation {
    if (this.hash !== this.getHash()) return new Validation(false, "Invalid hash");

    if (this.txInputs && this.txInputs.length) {
      const validations = this.txInputs.map((txi) => txi.isValid()).filter((v) => !v.success);
      if (validations && validations.length) {
        const msg = validations.map((v) => v.message).join(" ");
        return new Validation(false, `Invalid txInputs: ${msg}`);
      }
    }

    if (this.txOutputs && this.txOutputs.length) {
      const validations = this.txOutputs.map((txo) => txo.isValid()).filter((v) => !v.success);
      if (validations && validations.length) {
        const msg = validations.map((v) => v.message).join(" ");
        return new Validation(false, `Invalid txOutputs: ${msg}`);
      }
    }

    const inputSum = this.txInputs?.reduce((v, tx) => v + tx.amount, 0) || 0;
    const outputSum = this.txInputs?.reduce((v, tx) => v + tx.amount, 0) || 0;

    if (inputSum < outputSum)
      return new Validation(false, "Invalid tx: input amounts must be greater than output amounts");

    if (this.txOutputs?.some((txO) => txO.tx !== this.hash))
      return new Validation(false, "Invalid TXO reference hash");

    //TODO: validar as taxas e recompensas quando tx.type === FEE
    if (this.type === TransactionType.FEE) {
      const txo = this.txOutputs![0];
      if(txo.amount > Blockchain.getRewardAmout(difficulty) + totalFees)
        return new Validation(false, "Invalid tx reward");
    }

    return new Validation();
  }
}
