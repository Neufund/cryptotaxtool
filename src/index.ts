import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";

import * as c from "../config.json";
import { computeTransactions } from "./computeTx";
import { getTransactions , parseTransactions } from "./etherscan";
import { IConfig } from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

let createdContracts: string[];

const code = async () =>  {
    const walletsToCheck = config.wallets.map((wallet) => wallet.address);
    const txsRaw = await getTransactions(walletsToCheck);
    createdContracts = txsRaw.filter((txRaw) => txRaw.contractAddress !== "").map((txRaw) => txRaw.contractAddress);
    const txsParsed = parseTransactions(txsRaw);
    const txsFinal = await computeTransactions(txsParsed, createdContracts);
    writeToFile(txsFinal);
};

code().catch((err) => console.log(err));

const writeToFile = (transactions: any) => {
    const fields = [
        "date",
        "hash",
        "from",
        "to",
        "txCostETH",
        "txValueETH",
        "txTotalETH",
        "txCostFiat",
        "txValueFiat",
        "txTotalFiat",
        "ethPrice",
        "type",
        "desc"];
    const fieldNames = [
        `Date`,
        `Transaction id`,
        `Sender`,
        `Receiver`,
        `Transaction cost in ETH`,
        `Transaction amount in ETH`,
        `Transaction total in ETH`,
        `Transaction cost in ${config.fiatCurrency}`,
        `Transaction amount in ${config.fiatCurrency}`,
        `Transaction total in ${config.fiatCurrency}`,
        `ETH price from date in ${config.fiatCurrency} (weighted average exchange rate)`,
        `Transaction type`,
        `Description`];
    const csv = json2csv({ data: transactions, fields, fieldNames });

    if (!existsSync("./outcome")) {
        mkdirSync("./outcome");
    }

    writeFileSync("./outcome/transactions.csv", csv);
    console.log("file saved");
};
