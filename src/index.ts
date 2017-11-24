import { writeFile} from "fs";
import * as json2csv from "json2csv";

import * as c from "../config.json";
import { ethPrices } from "./ethPrices";
import { getTransactions , parseTransactions } from "./transactions";
import { IConfig } from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

const code = async () =>  {
    const prices = await ethPrices();
    const txs = await getTransactions(config.wallets);
    txs.sort(sortTable);
    const txParsed = parseTransactions(txs);
    // console.log(prices);
    // console.log(txs);

    // writeToFile(txs);

};

code().catch((err) => console.log(err));

const sortTable = (a: any, b: any) => {
    const timeStampA = parseInt(a.timeStamp, 10);
    const timeStampB = parseInt(b.timeStamp, 10);
    return timeStampA - timeStampB;
};

const writeToFile = (transactions: any) => {
    // const fields = ["gasPrice", "gasUsed", "hash", "isError", "time", "to", "value"];
    const csv = json2csv({ data: transactions, fields: Object.keys(transactions[0])});

    writeFile("file.csv", csv, (err) => {
        if (err) {
            throw err;
        }
        console.log("file saved");
    });
};
