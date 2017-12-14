import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";

import * as c from "../config.json";
import { computeTransactions } from "./computeTx";
import { getTransactions , parseTransactions } from "./etherscan";
import { IConfig } from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

const code = async () =>  {
    let contracts = config.contracts;

    const walletsToCheck = config.wallets.map((wallet) => wallet.address);
    const txsRaw = await getTransactions(walletsToCheck);
    const newContracts = txsRaw.filter((txRaw) => txRaw.contractAddress !== "").map((txRaw) => ({
        address: txRaw.contractAddress,
        alias: `new contract ${txRaw.contractAddress}`,
    }));
    contracts = contracts.concat(newContracts);
    const txsParsed = parseTransactions(txsRaw);
    const txsFinal = await computeTransactions(txsParsed, contracts);
    writeToFile(txsFinal);
    displayNewContracts(newContracts);
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

const displayNewContracts = (newContracts: Array<{
    address: string;
    alias: string;
}>): void => {
    if (newContracts.length === 0) {
        return;
    }
    console.log("During selected period following contracts were deployed. Consider adding them to your config file.");
    for (const contract of newContracts) {
        console.log(contract.address);
    }
};
