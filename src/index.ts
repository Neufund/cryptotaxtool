import { writeFile} from "fs";
import * as json2csv from "json2csv";

import * as c from "../config.json";
import { Currency } from "./constants";
import { ethPrices } from "./ethPrices";
import { getTransactions , parseTransactions } from "./transactions";
import { IConfig } from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

const code = async () =>  {
    const txs = await getTransactions(config.wallets);
    txs.sort(sortTable);
    const txParsed = parseTransactions(txs);
    const txFinal = await computeFiatValueAndLocality(txParsed);
    writeToFile(txFinal);

};

code().catch((err) => console.log(err));

const sortTable = (a: any, b: any) => {
    const timeStampA = parseInt(a.timeStamp, 10);
    const timeStampB = parseInt(b.timeStamp, 10);
    return timeStampA - timeStampB;
};

const computeFiatValueAndLocality = async (transactions: any) => {
    const prices = await ethPrices(transactions[0].date, Currency.USD);

    return transactions.map((tx: any) => {
        const ethPrice = prices[tx.date];
        const localTo = undefined !== config.wallets.find((elm) => {
            return elm.toLowerCase() === tx.to;
        });

        const localFrom = undefined !== config.wallets.find((elm) => {
            return elm.toLowerCase() === tx.from;
        });
        const local = localFrom && localTo;

        return {
            date: tx.date,
            hash: tx.hash,
            local,
            txCostFiat: tx.gasEth.times(ethPrice).toString(),
            txValueFiat: tx.value.times(ethPrice).toString(),
        };
    });
};

const writeToFile = (transactions: any) => {
    const fields = ["hash", "date", "txCostFiat", "txValueFiat", "local"];
    const csv = json2csv({ data: transactions, fields });

    writeFile("file.csv", csv, (err) => {
        if (err) {
            throw err;
        }
        console.log("file saved");
    });
};
