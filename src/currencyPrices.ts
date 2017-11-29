import * as Moment from "moment";
import fetch from "node-fetch";

import { CryptoCurrency, FiatCurrency } from "./constants";

export const cryptoCurrencyPrices = async (
    startDate: string,
    cryptoCurrency: CryptoCurrency,
    fiatCurrency: FiatCurrency,
) => {
    console.log(`getting prices of ${cryptoCurrency} from Kraken starting from: ${startDate} in ${fiatCurrency}`);
    const startDateParsed = Moment(startDate);
    const currencySymbol = krakenCoinPairSymbol(cryptoCurrency, fiatCurrency);
    const url = `https://api.kraken.com/0/public/OHLC?pair=${currencySymbol}&since=${startDateParsed.unix()}&interval=1440`;
    return fetch(url)
        .then((res) => res.json())
        .then((res) => {
            const pricesRaw = res.result[currencySymbol];
            const prices = pricesRaw.map(
                (price: any) => {
                    return {
                        date: Moment.unix(price[0]).format("YYYY-MM-DD"),
                        price: parseFloat(price[5]),
                    };
                }).reduce((acc: any, v: any) => {
                    acc[v.date] = v.price;
                    return acc;
                },
                {});

            // console.log(prices);
            return prices;
        });
};

const krakenCoinPairSymbol = (cryptoCurrency: CryptoCurrency, fiatCurrency: FiatCurrency) => {
    if (cryptoCurrency === CryptoCurrency.BTC) {
      return `XXBTZ${fiatCurrency}`;
    } else {
        return `X${cryptoCurrency}Z${fiatCurrency}`;
    }
};
