import * as commander from "commander";
import * as Moment from "moment";

import * as c from "../config.json";
import { IConfig } from "./typings/config";

const command = commander
  .option(
    "-l, --last-week",
    "Get data from last week whole days since 8 days ago to yesterday inclusive"
  )
  .parse(process.argv);

export const config: IConfig = { ...c };

if (command.lastWeek) {
  const endData = Moment()
    .startOf("date")
    .add(-1, "days");
  const startData = Moment()
    .startOf("date")
    .add(-8, "days");
  console.log(
    `Got --last-week parameter overriding config.json values with from: ${startData} to: ${endData}`
  );
  config.startDate = startData;
  config.endDate = endData;
} else {
  config.startDate = Moment(c.startDate);
  config.endDate = Moment(c.endDate);
  console.log(`Using date range from config.json from: ${config.startDate} to: ${config.endDate}`);
}
