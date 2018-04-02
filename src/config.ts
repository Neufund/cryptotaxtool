import * as commander from "commander";
import * as Moment from "moment";

import * as c from "../config.json";
import { IConfig, IEthAccount } from "./typings/types";

const command = commander
  .option(
    "-l, --last-week",
    "Get data from last week whole days since 7 days ago to yesterday inclusive"
  )
  .parse(process.argv);

export const config: IConfig = { ...c };

if (command.lastWeek) {
  const endData = Moment()
    .endOf("date")
    .add(-1, "days");
  const startData = Moment()
    .startOf("date")
    .add(-7, "days");
  console.log(
    `Got --last-week parameter overriding config.json values with from: ${startData} to: ${endData}`
  );
  config.startDate = startData;
  config.endDate = endData;
} else {
  config.startDate = Moment(c.startDate).startOf("date");
  config.endDate = Moment(c.endDate).endOf("date");
  console.log(`Using date range from config.json from: ${config.startDate} to: ${config.endDate}`);
}

for (const contract of config.ETH.contracts) {
  contract.isContract = true;
}

for (const wallet of config.ETH.wallets) {
  if (wallet.isDev === undefined) {
    wallet.isDev = false;
  }
}

export const getEthAlias = (ethAddress: string): IEthAccount => {
  const wallet = config.ETH.wallets.find(elm => {
    return elm.address.toLowerCase() === ethAddress.toLowerCase();
  });

  if (wallet !== undefined) {
    return wallet;
  }

  const contract = config.ETH.contracts.find(elm => {
    return elm.address.toLowerCase() === ethAddress.toLowerCase();
  });

  if (contract !== undefined) {
    return contract;
  }

  return undefined;
};
