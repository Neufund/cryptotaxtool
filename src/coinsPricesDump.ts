import * as program from "commander";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";
import * as Moment from "moment";

import { CryptoCurrency, FiatCurrency } from "./constants";
import { cryptoCurrencyPrices } from "./currencyPrices";

const dateFormat = "DD.MM.YYYY";

async function main() {
  program.option("-d, --date <startdate>", "Starting date").parse(process.argv);

  console.log(`will check prices from ${program.date}`);

  const startDate = Moment(program.date, dateFormat);

  const [btc, etc, eth, rep, xmr] = await Promise.all([
    cryptoCurrencyPrices(startDate.toISOString(), CryptoCurrency.BTC, FiatCurrency.EUR),
    cryptoCurrencyPrices(startDate.toISOString(), CryptoCurrency.ETC, FiatCurrency.EUR),
    cryptoCurrencyPrices(startDate.toISOString(), CryptoCurrency.ETH, FiatCurrency.EUR),
    cryptoCurrencyPrices(startDate.toISOString(), CryptoCurrency.REP, FiatCurrency.EUR),
    cryptoCurrencyPrices(startDate.toISOString(), CryptoCurrency.XMR, FiatCurrency.EUR),
  ]);

  const data = [];

  for (const date of Object.keys(btc)) {
    data.push({
      btc: btc[date],
      date: Moment(date).format(dateFormat),
      etc: etc[date],
      eth: eth[date],
      rep: rep[date],
      xmr: xmr[date],
    });
  }

  const fields = ["date", "btc", "etc", "eth", "rep", "xmr"];
  const csv = json2csv({ data, fields });

  if (!existsSync("./outcome")) {
    mkdirSync("./outcome");
  }

  writeFileSync("./outcome/priceDump.csv", csv);
  console.log("file saved");
}

main().catch(err => console.log(err));
