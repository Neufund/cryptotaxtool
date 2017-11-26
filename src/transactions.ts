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

export const getTransactions = async (wallets: [string]): Promise<IRawTransaction[]> => {
    let allTxs: IRawTransaction[] = [];
    for (const wallet of wallets) {
        const addresss = getEtherScanApiTxURL(wallet);
        console.log(`getting transactions for: ${wallet}`);
        const txs = await fetch(addresss).then((res) => {
            return res.json();
        });
        allTxs = allTxs.concat(txs.result.map((tx: any): IRawTransaction => {
            return {
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
        await delay(300);
    }
    const removedDups = uniqBy(allTxs, "hash");
    return Promise.resolve(removedDups);
};

const getEtherScanApiTxURL = (publicKey: string): string => {
    return `http://api.etherscan.io/api?module=account&action=txlist&address=${publicKey}&startblock=${config.startBlock}&sort=asc&apikey=${config.ethScanApiKey}`;
};

export const parseTransactions = (transactions: IRawTransaction[]): IParsedTransaction[] => {
    const web3 = new Web3();
    const ret: IParsedTransaction[] = [];
    for (const tx of transactions) {
        const parsedTx = {
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
