import { BigNumber } from "bignumber.js";
import { readFileSync } from "fs";
import * as Moment from "moment";
import * as Papa from "papaparse";

import { ILedgerEntry, TxType } from "../typings/types";
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
  // TODO: handle better choosing file to import
  const data = readFileSync("./import/list.csv", "utf-8").replace(/^\uFEFF/, "");
  const csv = Papa.parse(data, {
    encoding: "utf-8",
  });
  return parseData(csv.data);
};

const parseData = (transactions: any[]): ILedgerEntry[] => {
  const ret: ILedgerEntry[] = [];
  for (const transaction of transactions.slice(1)) {
    const date = Moment(transaction[9], COIN_TRACKING_DATE_FORMAT);
    const id = transaction[8];
    let type;
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
      feeCurrency,
      feeAmount,
      type,
    };

    if (type === TxType.LOCAL) {
      if (!feeAmount.isZero()) {
        ret.push({
          ...ledgerEntry,
          senderAmount: new BigNumber(0),
          receiverAmount: new BigNumber(0),
          type: TxType.EXPENSE,
        });
      }
      ret.push({
        ...ledgerEntry,
        feeAmount: new BigNumber(0),
      });
    } else if (type === TxType.DEPOSIT) {
      if (!ledgerEntry.feeAmount.isZero()) {
        ret.push({
          ...ledgerEntry,
          senderAmount: new BigNumber(0),
          receiverAmount: new BigNumber(0),
          type: TxType.EXPENSE,
        });
      }
      ret.push({
        ...ledgerEntry,
        feeAmount: new BigNumber(0),
      });
    } else {
      ret.push(ledgerEntry);
    }
  }

  return ret;
};

export const combineCoinTrackingInfo = (
  ledgerData: ILedgerEntry[],
  coinTrackingData: ILedgerEntry[]
): ILedgerEntry[] => {
  const ret = ledgerData.concat(
    coinTrackingData.filter(ledgerEntry => ledgerEntry.type === TxType.LOCAL)
  );

  for (const coinTrackingEntry of coinTrackingData.filter(
    ledgerEntry => ledgerEntry.type !== TxType.LOCAL
  )) {
    const matchedTxs = ret.filter(ledgerEntry => {
      if (
        ledgerEntry.senderAmount.eq(coinTrackingEntry.senderAmount) &&
        ledgerEntry.senderCurrency === coinTrackingEntry.senderCurrency &&
        ((ledgerEntry.type === TxType.EXPENSE && coinTrackingEntry.type === TxType.DEPOSIT) ||
          (ledgerEntry.type === TxType.DEPOSIT && coinTrackingEntry.type === TxType.EXPENSE)) &&
        ledgerEntry.date.diff(coinTrackingEntry.date, "days", true) <= 2
      ) {
        return true;
      }
    });

    if (matchedTxs.length > 1) {
      console.log(coinTrackingEntry);
      console.log(matchedTxs);
      throw new Error(
        "Cointracking import error. During tx matching there is unambiguous transaction"
      );
    } else if (matchedTxs.length === 1) {
      const matchedTx = matchedTxs[0];

      if (matchedTx.type === TxType.DEPOSIT) {
        matchedTx.sender = coinTrackingEntry.sender;
      } else {
        matchedTx.receiver = coinTrackingEntry.sender;
      }

      ret.push({
        ...matchedTx,
        type: TxType.EXPENSE,
        senderAmount: new BigNumber(0),
        receiverAmount: new BigNumber(0),
        feeAmount:
          matchedTx.type === TxType.DEPOSIT ? coinTrackingEntry.feeAmount : matchedTx.feeAmount,
        feeCurrency: coinTrackingEntry.feeCurrency,
      });

      matchedTx.type = TxType.LOCAL;
      matchedTx.feeAmount = new BigNumber(0);
    } else {
      ret.push(coinTrackingEntry);
    }
  }

  ret.sort(ledgerEntryComparator);

  return ret;
};

const ledgerEntryComparator = (a: ILedgerEntry, b: ILedgerEntry): number => {
  const dateDiff = a.date.diff(b.date);
  if (dateDiff !== 0) {
    return dateDiff;
  }
  return a.id.localeCompare(b.id);
};
