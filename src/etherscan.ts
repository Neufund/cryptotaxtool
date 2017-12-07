import { BigNumber } from "bignumber.js";
import {delay} from "bluebird";
import { uniqBy } from "lodash";
import * as Moment from "moment";
import fetch from "node-fetch";
import * as Web3 from "web3";

import * as c from "../config.json";
import { IParsedTransaction, IRawTransaction } from "./constants";
import {IConfig} from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;
const startMoment = Moment(config.startDate);
const endMoment = Moment(config.endDate);

const etherScanOffset = 1000;
const blockIntervalSeconds = 14;

export const getTransactions = async (wallets: string[]): Promise<IRawTransaction[]> => {
    console.log(`Looking for border blocks for dates from: ${config.startDate} to: ${config.endDate}`);
    const startBlock = await findStartBlock(startMoment);
    const endBlock = await findEndBlock(endMoment);
    console.log(`Blocks between: ${startBlock} - ${endBlock}`);

    let allTxs: IRawTransaction[] = [];
    for (const wallet of wallets) {
        console.log(`getting transactions for: ${wallet}`);
        let page = 0;

        while (true) {
            page++;
            const url = getEtherScanApiTxURL(wallet, startBlock, endBlock, page, etherScanOffset);
            console.log(`page ${page} - ${url}`);
            const txs = await fetch(url).then((res) => {
                return res.json();
            });
            allTxs = allTxs.concat(txs.result.map((tx: any): IRawTransaction => {
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
            }));
            if (txs.result.length < etherScanOffset) {
                break;
            }
            await delay(300);
        }
    }
    const removedDups = uniqBy(allTxs, "hash");
    const filteredByDate = removedDups.filter(filterDate);
    filteredByDate.sort(comparatorTimestamp);

    return Promise.resolve(filteredByDate);
};

const findStartBlock = async (date: Moment.Moment): Promise<number> => {
    let blockNumber = await getNewestBlockNumber();
    let blockDate = await getBlockDateByNumber(blockNumber);

    while (blockDate.isSameOrAfter(date) || Math.abs(blockDate.diff(date, "days", true)) > 1) {
        const blockDiff = blockDate.diff(date, "seconds") / blockIntervalSeconds;
        blockNumber = Math.floor(blockNumber - blockDiff);
        blockDate = await getBlockDateByNumber(blockNumber);
    }

    return Promise.resolve(blockNumber);
};

const findEndBlock = async (date: Moment.Moment): Promise<number> => {
    let blockNumber = await getNewestBlockNumber();
    let blockDate = await getBlockDateByNumber(blockNumber);

    while (blockDate.isSameOrBefore(date) || Math.abs(blockDate.diff(date, "days", true)) > 1) {
        const blockDiff = blockDate.diff(date, "seconds") / blockIntervalSeconds;
        blockNumber = Math.ceil(blockNumber - blockDiff);
        blockDate = await getBlockDateByNumber(blockNumber);
    }

    return Promise.resolve(blockNumber);
};

const getNewestBlockNumber = async (): Promise<number> => {
    return fetch("https://api.etherscan.io/api?module=proxy&action=eth_blockNumber")
        .then((res) => res.json())
        .then((res) => parseInt(res.result, 16));
};

const getBlockDateByNumber = async (blockNumber: number): Promise<Moment.Moment> => {
    return fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber\
&tag=${blockNumber.toString(16)}&boolean=true&apikey=${config.ethScanApiKey}`)
    .then((res) => res.json())
    .then((res) => Moment.unix(parseInt(res.result.timestamp, 16)));
};

const getEtherScanApiTxURL = (
    publicKey: string,
    startBlock: number,
    endBlock: number,
    page: number,
    offset: number): string => {
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

const comparatorTimestamp = (a: IRawTransaction, b: IRawTransaction): number => {
    const timeStampA = parseInt(a.timeStamp, 10);
    const timeStampB = parseInt(b.timeStamp, 10);
    return timeStampA - timeStampB;
};

const filterDate = (tx: IRawTransaction): boolean =>
    Moment.unix(parseInt(tx.timeStamp, 10)).isBetween(startMoment, endMoment, "days", "[]");

export const parseTransactions = (transactions: IRawTransaction[]): IParsedTransaction[] => {
    const web3 = new Web3();
    const ret: IParsedTransaction[] = [];
    for (const tx of transactions) {
        const parsedTx = {
            contractCreation: tx.contractAddress !== "",
            date: Moment.unix(parseInt(tx.timeStamp, 10)),
            from: tx.from,
            gasEth: new BigNumber(0),
            gasPrice: new BigNumber(tx.gasPrice),
            gasUsed: new BigNumber(tx.gasUsed),
            hash: tx.hash,
            to: tx.to,
            txFailed: tx.txreceipt_status === "0",
            value: new BigNumber(tx.value),
        };
        parsedTx.gasEth = web3.fromWei(parsedTx.gasPrice.times(parsedTx.gasUsed), "ether");
        parsedTx.value = web3.fromWei(parsedTx.value, "ether");
        ret.push(parsedTx);
    }

    return ret;
};
