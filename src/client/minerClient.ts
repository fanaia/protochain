import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import BlockInfo from "../lib/blockInfo";
import Block from "../lib/block";
import Wallet from "../lib/wallet";
import Transaction from "../lib/transaction";
import TransactionType from "../lib/transactionType";
import TransactionOutput from "../lib/transactionOutput";
import Blockchain from "../lib/blockchain";

const BLOCKCHAIN_SERVER = process.env.BLOCKCHAIN_SERVER;

const minerWallet = new Wallet(process.env.MINER_WALLET);
console.log("Miner wallet: ", minerWallet.publicKey);

let totalMined = 0;

const getRewardTx = (blockInfo: BlockInfo, nextBlock: Block): Transaction => {
  let amount = 0;

  if (blockInfo.difficulty <= blockInfo.maxDifficulty)
    amount += Blockchain.getRewardAmout(blockInfo.difficulty);

  const txo = new TransactionOutput({
    toAddress: minerWallet.publicKey,
    amount: 10,
  } as TransactionOutput);

  const tx = new Transaction({
    type: TransactionType.FEE,
    txOutputs: [txo],
  } as Transaction);

  tx.hash = tx.getHash();
  tx.txOutputs![0].tx = tx.hash;

  return tx;
};

async function mine() {
  console.log("Getting next block to mine...");
  const { data } = await axios.get(`${BLOCKCHAIN_SERVER}/blocks/next`);

  if (!data) {
    console.log("No block to mine. Waiting for new blocks...");
    setTimeout(mine, 10000);
    return;
  } else {
    const blockInfo = data as BlockInfo;
    console.log("Next block to mine: ", blockInfo.index);

    const newBlock = Block.fromBlockInfo(blockInfo);
    newBlock.transactions.push(new Transaction(getRewardTx()));
    newBlock.miner = minerWallet.publicKey;
    newBlock.hash = newBlock.getHash();

    console.log("Start mining block: #", newBlock.index);
    newBlock.mine(blockInfo.difficulty, minerWallet.publicKey);
    console.log("Block mined!");
    console.log("Sending mined block to blockchain server...");

    try {
      await axios.post(`${BLOCKCHAIN_SERVER}/blocks`, newBlock);
      console.log("Block sent to blockchain server and accepted!");
      totalMined++;
    } catch (error: any) {
      console.error(
        "Error sending block to blockchain server: ",
        error.response ? error.response.data : error.message
      );
    }
  }

  console.log("Total mined blocks: ", totalMined);
  setTimeout(mine, 1000);
}

console.log(`Mining in ${BLOCKCHAIN_SERVER}`);
mine();
