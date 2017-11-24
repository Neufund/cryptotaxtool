import * as c from "../config.json";
import { getTransactions } from "./transactions";
import {IConfig} from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

const code = async () =>  {
    const txs = await getTransactions(config.wallets);
    console.log(txs);
};

code();
