import * as c from "../config.json";
import {
    CryptoCurrency,
    dateFormat,
    FiatCurrency,
    IComputedTransaction,
    IParsedTransaction,
    TxType,
} from "./constants";
import { cryptoCurrencyPrices } from "./currencyPrices";
import { IConfig } from "./typings/config";

// TODO: this should be done properly
const config = c as IConfig;

export const computeTransactions = async (
    transactions: IParsedTransaction[],
    createdContracts: string[]): Promise<IComputedTransaction[]> => {
    const prices = await cryptoCurrencyPrices(
        transactions[0].date.format(dateFormat),
        CryptoCurrency.ETH,
        FiatCurrency.EUR);

    const txs = [];

    for (const tx of transactions) {
        const txDate = tx.date.format(dateFormat);
        const ethPrice = prices[txDate];

        const toConfig = config.wallets.find((elm) => {
            return elm.address.toLowerCase() === tx.to.toLowerCase();
        });
        const toName = (toConfig !== undefined && toConfig.alias !== "") ? toConfig.alias : tx.to;

        let localTo = toConfig !== undefined;
        localTo = localTo || undefined !== createdContracts.find((elm) => {
            return elm.toLowerCase() === tx.to.toLowerCase();
        });

        localTo = localTo || tx.contractCreation;

        const fromConfig = config.wallets.find((elm) => {
            return elm.address.toLowerCase() === tx.from.toLowerCase();
        });

        const fromDevWallet = fromConfig !== undefined && fromConfig.isDev !== undefined && fromConfig.isDev;
        const fromName = (fromConfig !== undefined && fromConfig.alias !== "") ? fromConfig.alias : tx.from;
        const localFrom = fromConfig !== undefined;

        let txType: TxType = null;
        if (localFrom && localTo) {
            txType = TxType.LOCAL;
        } else if (localFrom) {
            txType = TxType.OUTGOING;
        } else if (localTo) {
            txType = TxType.INCOMING;
        } else {
            throw new Error("transaction not FROM nor TO our wallet");
        }

        // we omit incoming failed transactions
        if (txType === TxType.INCOMING && tx.txFailed) {
            continue;
        }

        const txCostETH = txType === TxType.INCOMING ? "0" : tx.gasEth.toString();
        const txCostFiat = txType === TxType.INCOMING ? "0" : tx.gasEth.times(ethPrice).toFixed(4);
        const txValueETH = tx.txFailed ? "0" : tx.value.toString();
        const txValueFiat = tx.txFailed ? "0" : tx.value.times(ethPrice).toFixed(4);

        const computedTx: IComputedTransaction = {
            date: txDate,
            from: fromName,
            hash: tx.hash,
            to: toName,
            txCostETH,
            txCostFiat,
            txValueETH,
            txValueFiat,
            type: txType,
        };

        if (fromDevWallet) {
            computedTx.desc = "dev expense";
        }

        txs.push(computedTx);
    }

    return Promise.resolve(txs);
};
