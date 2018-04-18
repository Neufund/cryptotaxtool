import { merge } from "lodash";
import * as Moment from "moment";
import nodeFetch from "node-fetch";

import { config } from "../config";
import { dateFormat } from "../constants";
import { CryptoCurrency, FiatCurrency, IPricesTable } from "../typings/types";

export let prices: IPricesTable = {};

export const obtainPrices = async () => {
  prices = {};

  prices = merge(
    prices,
    await cryptoCurrencyPrices(config.startDate, CryptoCurrency.BCH, FiatCurrency.EUR)
  );

  prices = merge(
    prices,
    await cryptoCurrencyPrices(config.startDate, CryptoCurrency.BTC, FiatCurrency.EUR)
  );

  prices = merge(
    prices,
    await cryptoCurrencyPrices(config.startDate, CryptoCurrency.BTC, FiatCurrency.USD)
  );

  prices = merge(
    prices,
    await cryptoCurrencyPrices(config.startDate, CryptoCurrency.REP, FiatCurrency.EUR)
  );

  prices = merge(
    prices,
    await cryptoCurrencyPrices(config.startDate, CryptoCurrency.XMR, FiatCurrency.EUR)
  );

  prices = merge(
    prices,
    await cryptoCurrencyPrices(config.startDate, CryptoCurrency.ETC, FiatCurrency.EUR)
  );

  prices = merge(
    prices,
    await cryptoCurrencyPrices(config.startDate, CryptoCurrency.ETH, FiatCurrency.EUR)
  );

  // Now there is only two dates where we need USD / EUR conversion so I'm to lazy to implement it.
  // https://www.x-rates.com/historical/?from=USD&amount=1&date=2016-01-03
  prices = merge(prices, {
    "2016-12-30": {
      EUR: {
        USD: 1.055477,
      },
      USD: {
        EUR: 0.947439,
      },
    },
    "2017-01-03": {
      EUR: {
        USD: 1.086258,
      },
      USD: {
        EUR: 0.920592,
      },
    },
  });
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
            [cryptoCurrency]: { [cryptoCurrency]: 1, [fiatCurrency]: v.price },
            [fiatCurrency]: { [fiatCurrency]: 1, [cryptoCurrency]: 1 / v.price },
          };
          return acc;
        }, {});
    });
};

const krakenCoinPairSymbol = (cryptoCurrency: CryptoCurrency, fiatCurrency: FiatCurrency) => {
  if (cryptoCurrency === CryptoCurrency.BTC) {
    return `XXBTZ${fiatCurrency}`;
  }
  if (cryptoCurrency === CryptoCurrency.BCH) {
    return `${cryptoCurrency}${fiatCurrency}`;
  }
  return `X${cryptoCurrency}Z${fiatCurrency}`;
};
