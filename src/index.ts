import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";

import * as c from "../config.json";
import { computeTransactions } from "./computeTx";
import {
    IRawTransaction,
} from "./constants";
import { getTransactions , parseTransactions } from "./transactions";
import { IConfig } from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

let createdContracts: string[];

const code = async () =>  {
    const walletsToCheck = config.wallets.map((wallet) => wallet.address);
    const txsRaw = await getTransactions(walletsToCheck);
    txsRaw.sort(sortTable);
    createdContracts = txsRaw.filter((txRaw) => txRaw.contractAddress !== "").map((txRaw) => txRaw.contractAddress);
    const txsParsed = parseTransactions(txsRaw);
    const txsFinal = await computeTransactions(txsParsed, createdContracts);
    writeToFile(txsFinal);
};

code().catch((err) => console.log(err));

const sortTable = (a: IRawTransaction, b: IRawTransaction): number => {
    const timeStampA = parseInt(a.timeStamp, 10);
    const timeStampB = parseInt(b.timeStamp, 10);
    return timeStampA - timeStampB;
};

const writeToFile = (transactions: any) => {
    const fields = ["date", "hash", "from", "to", "txCostETH", "txValueETH", "txTotalETH",  "txCostFiat", "txValueFiat", "txTotalFiat", "type", "desc"];
    const csv = json2csv({ data: transactions, fields });

    if (!existsSync("./outcome")) {
        mkdirSync("./outcome");
    }

    writeFileSync("./outcome/transactions.csv", csv);
    console.log("file saved");
};
