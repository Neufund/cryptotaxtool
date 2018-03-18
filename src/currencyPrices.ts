import * as Moment from "moment";
import nodeFetch from "node-fetch";

import { config } from "./config";
import { dateFormat } from "./constants";
import { CryptoCurrency, FiatCurrency, IPricesTable } from "./typings/types";

export let prices: IPricesTable = {};

export const obtainPrices = async () => {
  // for now just ETH price but later we will call Kraken and.or other sources and merge them together here
  prices = await cryptoCurrencyPrices(config.startDate, CryptoCurrency.ETH, FiatCurrency.EUR);
};

const cryptoCurrencyPrices = async (
  startDate: Moment.Moment,
  cryptoCurrency: CryptoCurrency,
  fiatCurrency: FiatCurrency
): Promise<IPricesTable> => {
  console.log(
    `getting prices of ${cryptoCurrency} from Kraken starting from: ${startDate} in ${fiatCurrency}`
  );
  const currencySymbol = krakenCoinPairSymbol(cryptoCurrency, fiatCurrency);
  const url = `https://api.kraken.com/0/public/OHLC?pair=${currencySymbol}&since=${startDate.unix()}&interval=1440`;
  return nodeFetch(url)
    .then(res => res.json())
    .then(res => {
      return res.result[currencySymbol]
        .map((price: any): { date: Moment.Moment; price: number } => {
          return {
            date: Moment.unix(price[0]),
            price: parseFloat(price[5]),
          };
        })
        .reduce((acc: IPricesTable, v: { date: Moment.Moment; price: number }) => {
          acc[v.date.format(dateFormat)] = {
            [cryptoCurrency]: { [fiatCurrency]: v.price },
            [fiatCurrency]: { [cryptoCurrency]: 1 / v.price },
          };
          return acc;
        }, {});
    });
};

const krakenCoinPairSymbol = (cryptoCurrency: CryptoCurrency, fiatCurrency: FiatCurrency) => {
  if (cryptoCurrency === CryptoCurrency.BTC) {
    return `XXBTZ${fiatCurrency}`;
  }
  return `X${cryptoCurrency}Z${fiatCurrency}`;
};
