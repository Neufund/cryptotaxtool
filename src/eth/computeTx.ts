import { BigNumber } from "bignumber.js";

import { getEthAlias } from "../config";
import { CryptoCurrency, ExpenseType, ILedgerEntry, TxType } from "../typings/types";
import { IParsedEthScanTransaction } from "./types";

export const computeTransactions = (transactions: IParsedEthScanTransaction[]): ILedgerEntry[] => {
  const txs: ILedgerEntry[] = [];

  for (const tx of transactions) {
    const receiverAlias = getEthAlias(tx.to);
    let receiverIsLocal = false;
    let receiver = tx.to;

    if (receiverAlias !== undefined) {
      receiverIsLocal = true;
      if (receiverAlias.alias !== "") {
        receiver = receiverAlias.alias;
      }
    }

    const senderAlias = getEthAlias(tx.from);
    let senderIsLocal = false;
    let sender = tx.from;

    if (senderAlias !== undefined) {
      senderIsLocal = true;
      if (senderAlias.alias !== "") {
        sender = senderAlias.alias;
      }
    }

    let txType: TxType = null;
    if (senderIsLocal && receiverIsLocal) {
      txType = TxType.LOCAL;
    } else if (senderIsLocal) {
      txType = TxType.EXPENSE;
    } else if (receiverIsLocal) {
      txType = TxType.DEPOSIT;
    } else {
      throw new Error("transaction not FROM nor TO our wallet");
    }

    // we omit incoming failed incoming transactions
    if (txType === TxType.DEPOSIT && tx.txFailed) {
      continue;
    }

    const txCostETH = txType === TxType.DEPOSIT ? new BigNumber(0) : tx.gasEth;
    const txValueETH = tx.txFailed ? new BigNumber(0) : tx.value;

    let notes = "";
    if (senderAlias && senderAlias.isDev) {
      notes += "dev expense";
    }

    if (tx.contractCreation) {
      notes += " contract creation";
    }

    const ledgerEntry: ILedgerEntry = {
      date: tx.date,
      id: tx.hash,

      sender,
      senderCurrency: CryptoCurrency.ETH,
      senderAmount: txValueETH,

      receiver,
      receiverCurrency: CryptoCurrency.ETH,
      receiverAmount: txValueETH,

      type: txType,
      expenseType: txType === TxType.EXPENSE ? ExpenseType.PAYMENT : null,
      notes,
    };

    if (txType !== TxType.DEPOSIT) {
      if (!txValueETH.isZero()) {
        txs.push({
          ...ledgerEntry,
        });
      }

      txs.push({
        ...ledgerEntry,
        senderAmount: txCostETH,
        receiverAmount: txCostETH,
        receiver: "ETH network",
        type: TxType.EXPENSE,
        expenseType: ExpenseType.FEE,
      });
    } else {
      txs.push(ledgerEntry);
    }
  }

  return txs;
};
