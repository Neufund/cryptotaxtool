import { writeFile} from "fs";
import * as json2csv from "json2csv";

import * as c from "../config.json";
import { getTransactions } from "./transactions";
import {IConfig} from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

const code = async () =>  {
    const txs = await getTransactions(config.wallets);
    // console.log(txs);

    writeToFile(txs);

};

code();

const writeToFile = (transactions: any) => {
    // const fields = ["gasPrice", "gasUsed", "hash", "isError", "time", "to", "value"];
    const csv = json2csv({ data: transactions, fields: Object.keys(transactions[0])});

    writeFile("file.csv", csv, (err) => {
        if (err){
            throw err;
        }
        console.log("file saved");
    });
};
