import * as ecc from "tiny-secp256k1";
import ECPairFactory, { ECPairInterface } from "ecpair";
import sha256 from "crypto-js/sha256";
import Validation from "./validation";
import TransactionOutput from "./transactionOutput";

const ECPair = ECPairFactory(ecc);

export default class TransactionInput {
  fromAddress: string;
  amount: number;
  previousTx: string;
  signature: string;

  constructor(txInput?: TransactionInput) {
    this.fromAddress = txInput?.fromAddress || "";
    this.amount = txInput?.amount || 0;
    this.previousTx = txInput?.previousTx || "";
    this.signature = txInput?.signature || "";
  }

  sign(privateKey: string): void {
    this.signature = ECPair.fromPrivateKey(Buffer.from(privateKey, "hex"))
      .sign(Buffer.from(this.getHash(), "hex"))
      .toString("hex");
  }

  getHash(): string {
    return sha256(this.fromAddress + this.amount + this.previousTx).toString();
  }

  isValid(): Validation {
    if (!this.signature) return new Validation(false, "Signature is required");

    if (!this.previousTx) return new Validation(false, "Previous TX is required");

    if (this.amount < 1) return new Validation(false, "Amount must be greater than zero.");

    const hash = Buffer.from(this.getHash(), "hex");
    const isValid = ECPair.fromPublicKey(Buffer.from(this.fromAddress, "hex")).verify(
      hash,
      Buffer.from(this.signature, "hex")
    );

    return isValid ? new Validation() : new Validation(false, "Invalid tx input signature");
  }

  static fromTxo(txo: TransactionOutput): TransactionInput {
    return new TransactionInput({
      fromAddress: txo.toAddress,
      amount: txo.amount,
      previousTx: txo.tx,
    } as TransactionInput);
  }
}
