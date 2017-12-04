import BigNumber from "bignumber.js";

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
            txType = TxType.EXPENSE;
        } else if (localTo) {
            txType = TxType.DEPOSIT;
        } else {
            throw new Error("transaction not FROM nor TO our wallet");
        }

        // we omit incoming failed transactions
        if (txType === TxType.DEPOSIT && tx.txFailed) {
            continue;
        }

        const txCostETH = txType === TxType.DEPOSIT ? new BigNumber(0) : tx.gasEth;
        const txValueETH = tx.txFailed ? new BigNumber(0) : tx.value;
        const txTotalETH = txCostETH.add(txValueETH);

        // we need to handle TxType.LOCAL specially. We have to split into two entries txCost is EXPENSE and txValue is LOCAL
        if (txType !== TxType.LOCAL) {
            const computedTx: IComputedTransaction = {
                date: txDate,
                ethPrice: ethPrice.toFixed(4),
                from: fromName,
                hash: tx.hash,
                to: toName,
                txCostETH: txCostETH.toString(),
                txCostFiat: txCostETH.times(ethPrice).toFixed(4),
                txTotalETH: txTotalETH.toString(),
                txTotalFiat: txTotalETH.times(ethPrice).toFixed(4),
                txValueETH: txValueETH.toString(),
                txValueFiat: txValueETH.times(ethPrice).toFixed(4),
                type: txType,
            };

            if (fromDevWallet) {
                computedTx.desc = "dev expense";
            }
            txs.push(computedTx);
        } else {
            const tempTx: any = {
                date: txDate,
                ethPrice: ethPrice.toFixed(4),
                from: fromName,
                hash: tx.hash,
                to: toName,
                type: txType,
            };

            if (fromDevWallet) {
                tempTx.desc = "dev expense";
            }

            if (txValueETH.greaterThan(0)) {
                tempTx.txCostETH = "0";
                tempTx.txCostFiat = "0";
                tempTx.txTotalETH = txValueETH.toString();
                tempTx.txTotalFiat = txValueETH.times(ethPrice).toFixed(4);
                tempTx.txValueETH = txValueETH.toString();
                tempTx.txValueFiat = txValueETH.times(ethPrice).toFixed(4);
                txs.push({ ...tempTx });
            }

            tempTx.txCostETH = txCostETH.toString();
            tempTx.txCostFiat = txCostETH.times(ethPrice).toFixed(4);
            tempTx.txTotalETH = txCostETH.toString();
            tempTx.txTotalFiat = txCostETH.times(ethPrice).toFixed(4);
            tempTx.txValueETH = "0";
            tempTx.txValueFiat = "0";
            tempTx.type = TxType.EXPENSE;

            txs.push({ ...tempTx });
        }
    }

    return Promise.resolve(txs);
};
