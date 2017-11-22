import * as c from "../config.json";
import {IConfig} from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

console.log(config.wallets);
