import Transaction from "./transaction";

export default interface TransactionSearch {
  transaction: Transaction;
  memPoolIndex: number;
  blockIndex: number;
}