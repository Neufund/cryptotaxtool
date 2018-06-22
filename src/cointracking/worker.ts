import { BigNumber } from "bignumber.js";
import { readFileSync } from "fs";
import * as Moment from "moment";
import * as Papa from "papaparse";

import { config } from "../config";
import { CryptoCurrency, ExpenseType, ILedgerEntry, TxType } from "../typings/types";
import { parseCurrency } from "../utils";

const COIN_TRACKING_DATE_FORMAT = "DD.MM.YYYY HH:mm";

/**
 * Columns to export from cointracking info:
 *  0. (1)  Type
 *  1. (2)  Buy
 *  2. (3)  Cur.
 *  3. (6)  Sell
 *  4. (7)  Cur.
 *  5. (10) Fee.
 *  6. (11) Cur
 *  7. (14) Exchange
 *  8. (18) Trade ID
 *  9. (20) Trade Date
 */

export const coinTrackingImport = (): ILedgerEntry[] => {
  // TODO: choosing which file to import could be done better. Also cointracking paid account has API that we could use instead
  const data = readFileSync("./import/list.csv", "utf-8").replace(/^\uFEFF/, "");
  const csv = Papa.parse(data, {
    encoding: "utf-8",
  });
  return parseData(csv.data);
};

const parseData = (transactions: any[]): ILedgerEntry[] => {
  const ret: ILedgerEntry[] = [];
  for (const transaction of transactions.slice(1).filter(csvDateFilter)) {
    const date = Moment(transaction[9], COIN_TRACKING_DATE_FORMAT);
    const id = transaction[8];
    let type;
    let expenseType = null;
    let sender = transaction[7];
    let receiver = transaction[7];

    let senderCurrency = parseCurrency(transaction[4]);
    let senderAmount = transaction[3] !== "-" ? new BigNumber(transaction[3]) : new BigNumber(0);

    let receiverCurrency = parseCurrency(transaction[2]);
    let receiverAmount = transaction[1] !== "-" ? new BigNumber(transaction[1]) : new BigNumber(0);

    let feeCurrency = parseCurrency(transaction[6]);
    const feeAmount = transaction[5] !== "-" ? new BigNumber(transaction[5]) : new BigNumber(0);

    if (feeCurrency === undefined) {
      feeCurrency = receiverCurrency;
    }

    if (transaction[0] === "Deposit") {
      type = TxType.DEPOSIT;
      sender = "Unknown";
      senderCurrency = receiverCurrency;
      senderAmount = receiverAmount;
    } else if (transaction[0] === "Withdrawal") {
      type = TxType.EXPENSE;
      receiver = "Unknown";
      senderAmount = senderAmount.minus(feeAmount);
      receiverCurrency = senderCurrency;
      receiverAmount = senderAmount;
      expenseType = ExpenseType.PAYMENT;
    } else if (transaction[0] === "Trade") {
      type = TxType.LOCAL;
    } else {
      throw new Error("Unknown transaction type in cointracking info import");
    }

    const ledgerEntry: ILedgerEntry = {
      date,
      id,
      sender,
      senderCurrency,
      senderAmount,
      receiver,
      receiverCurrency,
      receiverAmount,
      type,
      expenseType,
    };

    ret.push({
      ...ledgerEntry,
    });

    if (!feeAmount.isZero()) {
      ret.push({
        ...ledgerEntry,
        senderCurrency: feeCurrency,
        senderAmount: feeAmount,
        receiverCurrency: feeCurrency,
        receiverAmount: feeAmount,
        receiver: "Kraken exchange",
        type: TxType.EXPENSE,
        expenseType: ExpenseType.FEE,
      });
    }
  }

  return ret;
};

export const combineCoinTrackingInfo = (
  ledgerData: ILedgerEntry[],
  coinTrackingData: ILedgerEntry[]
): ILedgerEntry[] => {
  const ret = ledgerData.concat(
    coinTrackingData.filter(
      ledgerEntry =>
        ledgerEntry.type === TxType.LOCAL ||
        (ledgerEntry.type === TxType.EXPENSE && ledgerEntry.expenseType === ExpenseType.FEE)
    )
  );

  for (const coinTrackingEntry of coinTrackingData.filter(
    cte => cte.type === TxType.EXPENSE && cte.expenseType === ExpenseType.PAYMENT
  )) {
    const matchedTxs = ret.filter(
      ledgerEntry =>
        ledgerEntry.receiverAmount.eq(coinTrackingEntry.senderAmount) &&
        ledgerEntry.receiverCurrency === coinTrackingEntry.senderCurrency &&
        ledgerEntry.type === TxType.DEPOSIT &&
        Math.abs(ledgerEntry.date.diff(coinTrackingEntry.date, "days", true)) <= 1
    );

    if (matchedTxs.length > 1) {
      console.log(coinTrackingEntry);
      console.log(matchedTxs);
      throw new Error(
        "Cointracking import error. During tx matching there is unambiguous transaction"
      );
    } else if (matchedTxs.length === 1) {
      const matchedTx = matchedTxs[0];

      matchedTx.sender = coinTrackingEntry.sender;
      matchedTx.type = TxType.LOCAL;
      matchedTx.date = coinTrackingEntry.date;
      matchedTx.notes =
        matchedTx.notes + `eth id: ${matchedTx.id}; cointracking id: ${coinTrackingEntry.id}`;
      matchedTx.id = coinTrackingEntry.id;
    } else {
      ret.push(coinTrackingEntry);
    }
  }

  for (const coinTrackingEntry of coinTrackingData.filter(cte => cte.type === TxType.DEPOSIT)) {
    const matchedTxs = ret.filter(
      ledgerEntry =>
        ledgerEntry.senderAmount.greaterThan(coinTrackingEntry.receiverAmount.times(0.995)) &&
        ledgerEntry.senderAmount.lessThan(coinTrackingEntry.receiverAmount.times(1.005)) &&
        ledgerEntry.senderCurrency === coinTrackingEntry.receiverCurrency &&
        ledgerEntry.senderCurrency === CryptoCurrency.ETH &&
        ledgerEntry.type === TxType.EXPENSE &&
        Math.abs(ledgerEntry.date.diff(coinTrackingEntry.date, "days", true)) <= 1
    );

    if (matchedTxs.length > 1) {
      console.log(coinTrackingEntry);
      console.log(matchedTxs);

      throw new Error(
        "Cointracking import error. During tx matching there is unambiguous transaction"
      );
    } else if (matchedTxs.length === 1) {
      const matchedTx = matchedTxs[0];

      const krakenFee = matchedTx.senderAmount.minus(coinTrackingEntry.receiverAmount);

      matchedTx.type = TxType.LOCAL;
      matchedTx.receiver = coinTrackingEntry.receiver;
      matchedTx.senderAmount = coinTrackingEntry.receiverAmount;
      matchedTx.receiverAmount = coinTrackingEntry.receiverAmount;

      const txFee = ret.filter(le => le.id === matchedTx.id && le.expenseType === ExpenseType.FEE);
      if (txFee.length !== 1) {
        throw new Error("Cointracking import error. During DEPOSIT fee tx matching failed. ");
      }

      txFee[0].notes =
        txFee[0].notes +
        `eth fee: ${txFee[0].senderAmount.toString()}; kraken fee: ${krakenFee.toString()}`;
      txFee[0].senderAmount = txFee[0].senderAmount.plus(krakenFee);
      txFee[0].receiverAmount = txFee[0].receiverAmount.plus(krakenFee);
      txFee[0].receiver = txFee[0].receiver + " and Kraken exchange";
    } else {
      ret.push(coinTrackingEntry);
    }
  }

  ret.sort(ledgerEntryComparator);

  return ret;
};

const csvDateFilter = (line: string[]): boolean =>
  Moment(line[9], COIN_TRACKING_DATE_FORMAT).isBetween(config.startDate, config.endDate);

const ledgerEntryComparator = (a: ILedgerEntry, b: ILedgerEntry): number => {
  const dateDiff = a.date.diff(b.date);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  const stringDiff = a.id.localeCompare(b.id);
  if (stringDiff !== 0) {
    return stringDiff;
  }
  const typeDiff = a.type.localeCompare(b.type);
  if (typeDiff !== 0) {
    return typeDiff;
  }

  return a.expenseType.localeCompare(b.expenseType);
};
