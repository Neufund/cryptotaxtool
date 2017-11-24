import * as Moment from "moment";
import fetch from "node-fetch";

export const ethPrices = async () => {
    console.log("getting prices from Kraken");
    const url = "https://api.kraken.com/0/public/OHLC?pair=XETHZEUR&since=1506816000&interval=1440";
    return fetch(url)
        .then((res) => res.json())
        .then((res) => {
            const pricesRaw = res.result.XETHZEUR;
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
