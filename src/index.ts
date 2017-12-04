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

    const txs = [];

    for (const tx of transactions) {
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

        const fromDevWallet = fromConfig !== undefined && fromConfig.isDev !== undefined && fromConfig.isDev;
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
            continue;
        }

        const computedTx: IComputedTransaction = {
            date: txDate,
            from: fromName,
            hash: tx.hash,
            to: toName,
            txCostETH: txType === TxType.INCOMING ? "0" : tx.gasEth.toString(),
            txCostFiat: txType === TxType.INCOMING ? "0" : tx.gasEth.times(ethPrice).toFixed(4),
            txValueETH: tx.txFailed ? "0" : tx.value.toString(),
            txValueFiat: tx.txFailed ? "0" : tx.value.times(ethPrice).toFixed(4),
            type: txType,
        };

        if (fromDevWallet) {
            computedTx.desc = "dev expense";
        }

        txs.push(computedTx);
    }

    return Promise.resolve(txs);
};

const writeToFile = (transactions: any) => {
    const fields = ["date", "hash", "from", "to", "txCostETH", "txValueETH", "txCostFiat", "txValueFiat", "type", "desc"];
    const csv = json2csv({ data: transactions, fields });

    if (!existsSync("./outcome")) {
        mkdirSync("./outcome");
    }

    writeFileSync("./outcome/transactions.csv", csv);
    console.log("file saved");
};
