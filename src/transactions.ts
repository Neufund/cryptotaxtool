import { BigNumber } from "bignumber.js";
import {delay} from "bluebird";
import * as Moment from "moment";
import fetch from "node-fetch";
import * as Web3 from "web3";

import * as c from "../config.json";
import {IConfig} from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

export const getTransactions = async (wallets: [string]): Promise<any[]> => {
    let ret: any[] = [];
    for (const wallet of wallets) {
        const addresss = getEtherScanApiTxURL(wallet);
        console.log(`getting transactions for: ${wallet}`);
        const txs = await fetch(addresss).then((res) => {
            return res.json();
        });
        ret = ret.concat(txs.result.map((tx: any) => {
            return {
                from: tx.from,
                gasPrice: tx.gasPrice,
                gasUsed: tx.gasUsed,
                hash: tx.hash,
                issuedTx: tx.from === wallet.toLowerCase(),
                timeStamp: tx.timeStamp,
                to: tx.to,
                txFailed: tx.txreceipt_status === "0",
                value: tx.value,
            };
        }));
        await delay(300);
    }
    return Promise.resolve(ret);
};

const getEtherScanApiTxURL = (publicKey: string): string => {
    return `http://api.etherscan.io/api?module=account&action=txlist&address=${publicKey}&startblock=${config.startBlock}&sort=asc&apikey=${config.ethScanApiKey}`;
};

export const parseTransactions = (transactions: any) => {
    const web3 = new Web3();
    const ret: any[] = [];
    for (const tx of transactions) {
        const parsedTx = {
            date: Moment.unix(tx.timeStamp).format("YYYY-MM-DD"),
            from: tx.from,
            gasEth: 0,
            gasPrice: new BigNumber(tx.gasPrice),
            gasUsed: tx.issuedTx ? new BigNumber(tx.gasUsed) : new BigNumber(0),
            hash: tx.hash,
            to: tx.to,
            value: tx.txFailed ? new BigNumber(0) : new BigNumber(tx.value),
        };
        if (tx.issuedTx) {
            parsedTx.value = parsedTx.value.neg();
        }
        parsedTx.gasEth = web3.fromWei(parsedTx.gasPrice.times(parsedTx.gasUsed), "ether");
        parsedTx.value = web3.fromWei(parsedTx.value, "ether");
        ret.push(parsedTx);
    }

    return ret;
};
