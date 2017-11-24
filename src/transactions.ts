import {delay} from "bluebird";
import fetch from "node-fetch";

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
            // console.log(tx);
            return {
                gasPrice: tx.gasPrice,
                gasUsed: tx.gasUsed,
                hash: tx.hash,
                isError: tx.isError,
                timeStamp: tx.timeStamp,
                to: tx.to,
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
