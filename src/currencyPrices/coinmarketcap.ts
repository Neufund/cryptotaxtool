import { zip } from "lodash";
import * as Moment from "moment";
import nodeFetch from "node-fetch";
import * as weightedMean from "weighted-mean";

import { config } from "../config";
import { dateFormat } from "../constants";
import { CryptoCurrency, FiatCurrency, IPricesTable } from "../typings/types";

const DATA_ENDPOINT = "https://graphs2.coinmarketcap.com/currencies/neumark/";

export const addNeuPrices = async (prices: IPricesTable): Promise<IPricesTable> => {
  console.log("getting NEU / ETH prices from CoinMarketCap");
  const rawData = await nodeFetch(DATA_ENDPOINT).then(res => {
    return res.json();
  });

  const pricesBrokenIntoDays = rawData.price_platform.reduce(dateReducer, {});
  const volumesBrokenIntoDays = rawData.volume_usd.reduce(dateReducer, {});

  const rawPrices: any = {};
  for (const date of Object.keys(pricesBrokenIntoDays).filter(dateFilter)) {
    rawPrices[date] = weightedMean(zip(pricesBrokenIntoDays[date], volumesBrokenIntoDays[date]));
  }

  const retPrices: IPricesTable = {};
  for (const date of Object.keys(rawPrices)) {
    const priceInEUR = rawPrices[date] * prices[date][CryptoCurrency.ETH][FiatCurrency.EUR];
    retPrices[date] = {
      [FiatCurrency.EUR]: {
        [CryptoCurrency.NEU]: 1 / priceInEUR,
      },
      [CryptoCurrency.ETH]: {
        [CryptoCurrency.NEU]: 1 / rawPrices[date],
      },
      [CryptoCurrency.NEU]: {
        [CryptoCurrency.NEU]: 1,
        [CryptoCurrency.ETH]: rawPrices[date],
        [FiatCurrency.EUR]: priceInEUR,
      },
    };
  }

  // We need data since "2017-11-12" but Coinmarketcap has it since 2017-12-29 so we just copy first entry
  if (config.startDate.isBefore("2017-12-29")) {
    const startMoment = Moment("2017-11-11");
    for (let i = 0; i < 47; i = i + 1) {
      retPrices[startMoment.add(1, "days").format(dateFormat)] = retPrices["2017-12-29"];
    }
  }

  return retPrices;
};

const dateReducer = (accumulator: any, currentValue: any): any => {
  const date = Moment(currentValue[0]).format(dateFormat);
  const value = Number.parseFloat(currentValue[1]);

  if (accumulator[date] === undefined) {
    accumulator[date] = [];
  }
  accumulator[date].push(value);
  return accumulator;
};

const dateFilter = (date: string): boolean =>
  Moment(date).isBetween(config.startDate, config.endDate);
