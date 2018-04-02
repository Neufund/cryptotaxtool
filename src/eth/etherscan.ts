import { BigNumber } from "bignumber.js";
import { delay } from "bluebird";
import { uniqBy } from "lodash";
import * as Moment from "moment";
import nodeFetch from "node-fetch";
import * as Web3 from "web3";

import { config } from "../config";
import { IParsedEthScanTransaction, IRawEthScanTransaction } from "./types";

const etherScanOffset = 1000;
const blockIntervalSeconds = 14;
const ETHERSCAN_API_LIMIT = 4.5; // req per s doc says its 5 so we set a bit lower limit

export const getTransactions = async (wallets: string[]): Promise<IRawEthScanTransaction[]> => {
  console.log(`Looking for border blocks for dates range`);
  // const startBlock = await findStartBlock(config.startDate);
  // const endBlock = await findEndBlock(config.endDate);
  const startBlock = 2912029;
  const endBlock = 4838367;
  console.log(`Blocks between: ${startBlock} - ${endBlock}`);

  let allTxs: IRawEthScanTransaction[] = [];
  for (const wallet of wallets) {
    console.log(`getting transactions for: ${wallet}`);
    let page = 0;

    while (true) {
      page += 1;
      const url = getEtherScanApiTxURL(wallet, startBlock, endBlock, page, etherScanOffset);
      console.log(`page ${page} - ${url}`);
      const txs = await nodeFetch(url).then(res => {
        return res.json();
      });
      allTxs = allTxs.concat(
        txs.result.map((tx: any): IRawEthScanTransaction => {
          return {
            contractAddress: tx.contractAddress,
            from: tx.from,
            gasPrice: tx.gasPrice,
            gasUsed: tx.gasUsed,
            hash: tx.hash,
            timeStamp: tx.timeStamp,
            to: tx.to,
            txreceipt_status: tx.txreceipt_status,
            value: tx.value,
          };
        })
      );
      if (txs.result.length < etherScanOffset) {
        break;
      }
      await delay(1000 / ETHERSCAN_API_LIMIT);
    }
  }
  const removedDups = uniqBy(allTxs, "hash");
  const filteredByDate = removedDups.filter(filterDate);
  filteredByDate.sort(comparatorTimestamp);

  console.log(filteredByDate);
  return Promise.resolve(filteredByDate);
};

const findStartBlock = async (date: Moment.Moment): Promise<number> => {
  let blockNumber = await getNewestBlockNumber();
  let blockDate = await getBlockDateByNumber(blockNumber);

  while (blockDate.isAfter(date) || Math.abs(blockDate.diff(date, "hour", true)) > 2) {
    const blockDiff = blockDate.diff(date, "seconds") / blockIntervalSeconds;
    blockNumber = Math.floor(blockNumber - blockDiff);
    blockDate = await getBlockDateByNumber(blockNumber);
  }

  return Promise.resolve(blockNumber);
};

const findEndBlock = async (date: Moment.Moment): Promise<number> => {
  let blockNumber = await getNewestBlockNumber();
  let blockDate = await getBlockDateByNumber(blockNumber);

  // if we are asking for data from future or today just return latest block number
  if (date.isAfter(blockDate)) {
    return Promise.resolve(blockNumber);
  }

  while (blockDate.isBefore(date) || Math.abs(blockDate.diff(date, "hour", true)) > 2) {
    const blockDiff = blockDate.diff(date, "seconds") / blockIntervalSeconds;
    blockNumber = Math.ceil(blockNumber - blockDiff);
    blockDate = await getBlockDateByNumber(blockNumber);
  }

  return Promise.resolve(blockNumber);
};

const getNewestBlockNumber = async (): Promise<number> => {
  return nodeFetch("https://api.etherscan.io/api?module=proxy&action=eth_blockNumber")
    .then(res => res.json())
    .then(res => parseInt(res.result, 16));
};

const getBlockDateByNumber = async (blockNumber: number): Promise<Moment.Moment> => {
  return nodeFetch(`https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber\
&tag=${blockNumber.toString(16)}&boolean=true&apikey=${config.ethScanApiKey}`)
    .then(res => res.json())
    .then(res => Moment.unix(parseInt(res.result.timestamp, 16)));
};

const getEtherScanApiTxURL = (
  publicKey: string,
  startBlock: number,
  endBlock: number,
  page: number,
  offset: number
): string => {
  return `http://api.etherscan.io/api\
?module=account\
&action=txlist\
&address=${publicKey}\
&startblock=${startBlock}\
&endblock=${endBlock}\
&page=${page}\
&offset=${offset}\
&sort=asc\
&apikey=${config.ethScanApiKey}`;
};

const comparatorTimestamp = (a: IRawEthScanTransaction, b: IRawEthScanTransaction): number => {
  const timeStampA = parseInt(a.timeStamp, 10);
  const timeStampB = parseInt(b.timeStamp, 10);
  return timeStampA - timeStampB;
};

const filterDate = (tx: IRawEthScanTransaction): boolean =>
  Moment.unix(parseInt(tx.timeStamp, 10)).isBetween(config.startDate, config.endDate, "days", "[]");

export const parseTransactions = (
  transactions: IRawEthScanTransaction[]
): IParsedEthScanTransaction[] => {
  const web3 = new Web3();
  const ret: IParsedEthScanTransaction[] = [];
  for (const tx of transactions) {
    const parsedTx = {
      contractCreation: tx.contractAddress !== "",
      date: Moment.unix(parseInt(tx.timeStamp, 10)),
      from: tx.from,
      gasEth: new BigNumber(0),
      gasPrice: new BigNumber(tx.gasPrice),
      gasUsed: new BigNumber(tx.gasUsed),
      hash: tx.hash,
      to: tx.contractAddress !== "" ? tx.contractAddress : tx.to,
      txFailed: tx.txreceipt_status === "0",
      value: new BigNumber(tx.value),
    };
    parsedTx.gasEth = web3.fromWei(parsedTx.gasPrice.times(parsedTx.gasUsed), "ether");
    parsedTx.value = web3.fromWei(parsedTx.value, "ether");
    ret.push(parsedTx);
  }

  return ret;
};
