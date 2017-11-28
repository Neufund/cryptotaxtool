import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";

import * as c from "../config.json";
import {
    CryptoCurrency,
    dateFormat,
    FiatCurrency,
    IComputedTransaction,
    IParsedTransaction,
    IRawTransaction,
    TxType,
} from "./constants";
import { cryptoCurrencyPrices } from "./currencyPrices";
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
    const txsFinal = await computeTransactions(txsParsed);
    writeToFile(txsFinal);

};

code().catch((err) => console.log(err));

const sortTable = (a: IRawTransaction, b: IRawTransaction): number => {
    const timeStampA = parseInt(a.timeStamp, 10);
    const timeStampB = parseInt(b.timeStamp, 10);
    return timeStampA - timeStampB;
};

const computeTransactions = async (transactions: IParsedTransaction[]): Promise<IComputedTransaction[]> => {
    const prices = await cryptoCurrencyPrices(
        transactions[0].date.format(dateFormat),
        CryptoCurrency.ETH,
        FiatCurrency.EUR);

    const txs = transactions.map((tx) => {
        const txDate = tx.date.format(dateFormat);
        const ethPrice = prices[txDate];

        const toConfig = config.wallets.find((elm) => {
            return elm.address.toLowerCase() === tx.to.toLowerCase();
        });
        const toName = (toConfig !== undefined && toConfig.alias !== "") ? toConfig.alias : tx.to;

        let localTo = toConfig !== undefined;
        localTo = localTo || undefined !== createdContracts.find((elm) => {
            return elm.toLowerCase() === tx.to.toLowerCase();
        });

        localTo = localTo || tx.contractCreation;

        const fromConfig = config.wallets.find((elm) => {
            return elm.address.toLowerCase() === tx.from.toLowerCase();
        });
        const fromName = (fromConfig !== undefined && fromConfig.alias !== "") ? fromConfig.alias : tx.from;
        const localFrom = fromConfig !== undefined;

        let txType: TxType = null;
        if (localFrom && localTo) {
            txType = TxType.LOCAL;
        } else if (localFrom) {
            txType = TxType.OUTGOING;
        } else if (localTo) {
            txType = TxType.INCOMING;
        } else {
            throw new Error("transaction not FROM nor TO our wallet");
        }

        // we omit incoming failed transactions
        if (txType === TxType.INCOMING && tx.txFailed) {
            return null;
        }

        return {
            date: txDate,
            from: fromName,
            hash: tx.hash,
            to: toName,
            txCostETH: tx.gasEth.toString(),
            txCostFiat: txType === TxType.INCOMING ? "0" : tx.gasEth.times(ethPrice).toFixed(4),
            txValueETH: tx.value.toString(),
            txValueFiat: tx.txFailed ? "0" : tx.value.times(ethPrice).toFixed(4),
            type: txType,
        };
    });

    const res = txs.filter((tx) => tx !== null);
    return Promise.resolve(res);
};

const writeToFile = (transactions: any) => {
    const fields = ["hash", "from", "to", "txCostETH", "txValueETH", "date", "txCostFiat", "txValueFiat", "type"];
    const csv = json2csv({ data: transactions, fields });

    if (!existsSync("./outcome")) {
        mkdirSync("./outcome");
    }

    writeFileSync("./outcome/transactions.csv", csv);
    console.log("file saved");
};
