import { BigNumber } from "bignumber.js";
import { promisify } from "bluebird";
import { uniqBy } from "lodash";
import * as Moment from "moment";
import nodeFetch from "node-fetch";
import * as Web3 from "web3";

import { config, getEthAlias } from "../config";
import { CryptoCurrency, ExpenseType, ILedgerEntry, TxType } from "../typings/types";
import { ledgerEntryComparator } from "../utils";
import { IRawTokenMapperTx } from "./types";

export const gatherNEU = async (): Promise<ILedgerEntry[]> => {
  const walletsToCheck = config.ETH.wallets.map(wallet => wallet.address);
  console.log("getting NEU transactions from token mapper");
  const rawTxs = await getNEUTx(walletsToCheck);
  console.log("filling missing transaction data");
  return fillTxData(rawTxs);
};

const getNEUTx = async (walletsToCheck: string[]): Promise<IRawTokenMapperTx[]> => {
  const rawTxs = [];
  for (const wallet of walletsToCheck) {
    const url = generateEndpointUrl(wallet);
    console.log(`Checking ${url}`);
    const txs = await nodeFetch(url).then(res => {
      return res.json();
    });
    rawTxs.push(...txs.filter((tx: IRawTokenMapperTx) => tx.amount !== "0"));
  }
  return uniqBy(rawTxs, "tx_hash");
};

const fillTxData = async (txs: IRawTokenMapperTx[]): Promise<ILedgerEntry[]> => {
  const web3 = new Web3(new Web3.providers.HttpProvider(config.ethereumNodeUrl));
  const getTransactionReceiptAsync = promisify<Web3.Transaction, string>(
    web3.eth.getTransactionReceipt
  );
  const getTransactionAsync = promisify<Web3.Transaction, string>(web3.eth.getTransaction);

  const ret: ILedgerEntry[] = [];
  const combinedTxs: any = [];

  // TODO: here we need to use etherscan so we don't have to make two calls
  for (const tx of txs) {
    console.log(`Getting tx: ${tx.tx_hash}`);
    await Promise.all([
      getTransactionReceiptAsync(tx.tx_hash),
      getTransactionAsync(tx.tx_hash),
    ]).then(results => {
      const [transactionRecepit, transaction] = results;
      combinedTxs.push({
        ethTx: transaction,
        ethTxRec: transactionRecepit,
        mappedTx: tx,
      });
    });
  }

  for (const combinedTx of combinedTxs) {
    const knownMethodCaller = getEthAlias(combinedTx.ethTx.from) !== undefined;
    const knownReceiver = getEthAlias(combinedTx.mappedTx.to_address) !== undefined;
    const knownSender = getEthAlias(combinedTx.mappedTx.from_address) !== undefined;

    const receiverAmount = web3.fromWei(new BigNumber(combinedTx.mappedTx.amount), "ether");
    const feeAmount = web3.fromWei(
      combinedTx.ethTx.gasPrice.times(combinedTx.ethTxRec.gasUsed),
      "ether"
    );

    const receiver = knownReceiver
      ? getEthAlias(combinedTx.mappedTx.to_address).alias
      : combinedTx.mappedTx.to_address;
    const sender = knownSender
      ? getEthAlias(combinedTx.mappedTx.from_address).alias
      : combinedTx.mappedTx.from_address;

    let notes = "";
    let type = null;
    let expenseType = null;

    if (knownReceiver && !knownSender) {
      type = TxType.DEPOSIT;
    } else if (!knownReceiver && knownSender) {
      type = TxType.EXPENSE;
      expenseType = ExpenseType.PAYMENT;
    } else if (knownReceiver && knownSender) {
      type = TxType.LOCAL;
    } else {
      throw new Error("Unknown sender and receiver of Neumark transaction");
    }

    // Special case for Neumark generation
    if (knownReceiver && knownSender && !knownMethodCaller) {
      type = TxType.DEPOSIT;
      notes = "NEU generation";
    }

    ret.push({
      date: Moment(combinedTx.mappedTx.date),
      id: combinedTx.mappedTx.tx_hash,
      receiver,
      sender,
      senderCurrency: CryptoCurrency.NEU,
      receiverCurrency: CryptoCurrency.NEU,
      receiverAmount,
      senderAmount: receiverAmount,
      type,
      expenseType,
      notes,
    });

    if (type !== TxType.DEPOSIT) {
      ret.push({
        date: Moment(combinedTx.mappedTx.date),
        id: combinedTx.mappedTx.tx_hash,
        receiver: "ETH network",
        sender,
        senderCurrency: CryptoCurrency.ETH,
        receiverCurrency: CryptoCurrency.ETH,
        receiverAmount: feeAmount,
        senderAmount: feeAmount,
        type: TxType.EXPENSE,
        expenseType: ExpenseType.FEE,
        notes: "",
      });
    }
  }

  return ret.sort(ledgerEntryComparator);
};

const generateEndpointUrl = (address: string): string => {
  return `${config.NEU.tokenMapperUrl}/api/token/${
    config.NEU.contractAddress
  }/transfers/${address}`;
};

export const combineNEUTransfers = (
  ledgerData: ILedgerEntry[],
  neuTxs: ILedgerEntry[]
): ILedgerEntry[] => {
  const ret = ledgerData.concat(
    neuTxs.filter(ledgerEntry => ledgerEntry.expenseType !== ExpenseType.FEE)
  );

  return ret.sort(ledgerEntryComparator);
};
