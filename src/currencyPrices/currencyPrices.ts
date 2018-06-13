import { merge } from "lodash";

import { config } from "../config";
import { CryptoCurrency, FiatCurrency, IPricesTable } from "../typings/types";
import { addNeuPrices } from "./coinmarketcap";
import { cryptoCurrencyPrices } from "./kraken";

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

  prices = merge(prices, await addNeuPrices(prices));
};
