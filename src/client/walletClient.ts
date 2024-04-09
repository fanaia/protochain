import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import readline from "readline";
import Wallet from "../lib/wallet";
import Transaction from "../lib/transaction";
import TransactionType from "../lib/transactionType";
import TransactionInput from "../lib/transactionInput";
import TransactionOutput from "../lib/transactionOutput";

const BLOCKCHAIN_SERVER = process.env.BLOCKCHAIN_SERVER;

let myWalletPub = "";
let myWalletPriv = "";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function menu() {
  setTimeout(() => {
    console.clear();

    if (myWalletPub) console.log(`You are logged as ${myWalletPub}`);
    else console.log("You aren't logged.");

    console.log("1. Create a new wallet");
    console.log("2. Recover a wallet");
    console.log("3. Balance");
    console.log("4. Send tx");
    console.log("5. Search tx");
    console.log("6. Disconnet wallet");
    rl.question("Choose an option: ", (answer) => {
      switch (answer) {
        case "1":
          createWallet();
          break;
        case "2":
          recoverWallet();
          break;
        case "3":
          balance();
          break;
        case "4":
          sendTx();
          break;
        case "5":
          searchTx();
          break;
        case "6":
          disconnet();
          break;
        default:
          console.log("Invalid option");
          menu();
      }
    });
  }, 1000);
}

function preMenu() {
  rl.question("Press any key to continue...", () => {
    menu();
  });
}

function createWallet() {
  console.clear();
  const wallet = new Wallet();
  console.log("Your new wallet is:");
  console.log(wallet);

  myWalletPriv = wallet.privateKey;
  myWalletPub = wallet.publicKey;

  preMenu();
}

function recoverWallet() {
  console.clear();
  rl.question("Enter your private key or WIF: ", (answer) => {
    const wallet = new Wallet(answer);

    console.log("Your recovered wallet is:");
    console.log(wallet);

    myWalletPriv = wallet.privateKey;
    myWalletPub = wallet.publicKey;
    preMenu();
  });
}

async function balance() {
  console.clear();

  if (!myWalletPub) {
    console.log("You need to login first.");
    return preMenu();
  }

  const { data } = await axios.get(`${BLOCKCHAIN_SERVER}/wallets/${myWalletPub}`);
  console.log(`Balance: ${data.balance}`);
  preMenu();
}

function sendTx() {
  console.clear();

  if (!myWalletPub) {
    console.log("You need to login first.");
    return preMenu();
  }

  console.log(`Your wallet balance is: ${myWalletPub}`);
  rl.question("To wallet: ", (toWallet) => {
    if (toWallet.length !== 66) {
      console.log("Invalid wallet address.");
      return preMenu();
    }

    rl.question("Amount: ", async (amountStr) => {
      const amount = parseInt(amountStr);
      if (!amount) {
        console.log("Invalid amount.");
        return preMenu();
      }

      const walletResponse = await axios.get(`${BLOCKCHAIN_SERVER}/wallets/${myWalletPub}`);
      const balance = walletResponse.data.balance as number;
      const fee = walletResponse.data.fee as number;
      const utxo = walletResponse.data.utxo as TransactionOutput[];

      if (balance < amount + fee) {
        console.log("Insufficient balance (tx + fee");
        return preMenu();
      }

      const txInputs = utxo.map((txo) => TransactionInput.fromTxo(txo));
      txInputs.forEach((txIn) => txIn.sign(myWalletPriv));

      const txOutputs = [] as TransactionOutput[];
      txOutputs.push(new TransactionOutput({ toAddress: toWallet, amount } as TransactionOutput));

      const remainingBalance = balance - amount - fee;
      txOutputs.push(
        new TransactionOutput({
          toAddress: myWalletPriv,
          amount: remainingBalance,
        } as TransactionOutput)
      );

      //TODO: Balance Validation
      const tx = new Transaction({
        txInputs,
        txOutputs,
      } as Transaction);

      tx.hash = tx.getHash();
      tx.txOutputs?.forEach((txo) => (txo.tx = tx.hash));

      console.log(tx);
      console.log(`Remaining balance: ${remainingBalance}`);

      try {
        const txResponse = await axios.post(`${BLOCKCHAIN_SERVER}/transactions`, tx);
        console.log(`Transaction sent. Waiting the miners!`);
        console.log(`Hash tx: ${txResponse.data.hash}`);
      } catch (err: any) {
        console.error(err.response ? err.response.data : err.message);
      }

      return preMenu();
    });
  });

  preMenu();
}

function searchTx() {
  console.clear();

  if (!myWalletPub) {
    console.log("You need to login first.");
    return preMenu();
  }

  rl.question(`Your tx hash: `, async (txHash) => {
    const response = await axios.get(`${BLOCKCHAIN_SERVER}/transactions/${txHash}`);
    console.log(response.data);
    return preMenu();
  });
}

function disconnet() {
  console.clear();
  myWalletPub = "";
  console.log("Wallet disconneted.");
  preMenu();
}

menu();
