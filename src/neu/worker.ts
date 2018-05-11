import { BigNumber } from "bignumber.js";
import { promisify } from "bluebird";
import * as Moment from "moment";
import nodeFetch from "node-fetch";
import * as Web3 from "web3";

import { config, getEthAlias } from "../config";
import { CryptoCurrency, ILedgerEntry, TxType } from "../typings/types";
import { IRawTokenMapperTx } from "./types";

/*
  This need to be rewritten.
*/

export const gatherNEU = async (): Promise<ILedgerEntry[]> => {
  const walletsToCheck = [
    "",
    "",
  ];
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
  return rawTxs;
};

const fillTxData = async (txs: IRawTokenMapperTx[]): Promise<ILedgerEntry[]> => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider("")
  );
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

  return combinedTxs
    .map(
      (tObj: {
        ethTx: Web3.Transaction;
        ethTxRec: Web3.TransactionReceipt;
        mappedTx: IRawTokenMapperTx;
      }): ILedgerEntry => {
        const receiver =
          getEthAlias(tObj.mappedTx.to_address) !== undefined
            ? getEthAlias(tObj.mappedTx.from_address).alias
            : tObj.mappedTx.to_address;
        const sender =
          getEthAlias(tObj.mappedTx.from_address) !== undefined
            ? getEthAlias(tObj.mappedTx.from_address).alias
            : tObj.mappedTx.from_address;

        return {
          date: Moment(tObj.mappedTx.date),
          id: tObj.mappedTx.tx_hash,
          receiver,
          sender,
          feeCurrency: CryptoCurrency.ETH,
          senderCurrency: CryptoCurrency.NEU,
          receiverCurrency: CryptoCurrency.NEU,
          feeAmount: web3.fromWei(tObj.ethTx.gasPrice.times(tObj.ethTxRec.gasUsed), "ether"),
          receiverAmount: web3.fromWei(new BigNumber(tObj.mappedTx.amount), "ether"),
          senderAmount: web3.fromWei(new BigNumber(tObj.mappedTx.amount), "ether"),
          notes: "",
          type: TxType.EXPENSE,
        };
      }
    )
    .sort(comparatorDateMoment);
};

const generateEndpointUrl = (address: string): string => {
  return `${config.NEU.tokenMapperUrl}/api/token/${
    config.NEU.contractAddress
  }/transfers/${address}`;
};

const comparatorDateMoment = (a: ILedgerEntry, b: ILedgerEntry): number =>
  a.date.valueOf() - b.date.valueOf();
