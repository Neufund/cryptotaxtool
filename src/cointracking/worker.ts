import { BigNumber } from "bignumber.js";
import { readFileSync } from "fs";
import * as Moment from "moment";
import * as Papa from "papaparse";

import { ILedgerEntry, TxType } from "../typings/types";
import { parseCurrency } from "../utils";

const COIN_TRACKING_DATE_FORMAT = "DD.MM.YYYY HH:mm";

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
    let type;
    let sender;
    let receiver;
    let senderCurrency;
    let senderAmount;
    let receiverCurrency;
    let receiverAmount;

    if (transaction[0] === "Deposit") {
      type = TxType.DEPOSIT;
      sender = "Unknown";
      senderCurrency = parseCurrency(transaction[2]);
      senderAmount = new BigNumber(transaction[1]);
      receiver = transaction[7];
      receiverCurrency = senderCurrency;
      receiverAmount = senderAmount;
    } else if (transaction[0] === "Withdrawal") {
      type = TxType.EXPENSE;
      sender = transaction[7];
      receiverCurrency = parseCurrency(transaction[4]);
      receiverAmount = new BigNumber(transaction[3]);
      receiver = "Unknown";
      senderCurrency = receiverCurrency;
      senderAmount = receiverAmount;
    } else if (transaction[0] === "Trade") {
      type = TxType.LOCAL;
      sender = transaction[7];
      senderCurrency = parseCurrency(transaction[2]);
      senderAmount = new BigNumber(transaction[1]);
      receiver = transaction[7];
      receiverCurrency = parseCurrency(transaction[4]);
      receiverAmount = new BigNumber(transaction[3]);
    } else {
      throw new Error("Unknown transaction type in cointracking info import");
    }

    ret.push({
      date: Moment(transaction[9], COIN_TRACKING_DATE_FORMAT),
      id: transaction[8],
      sender,
      senderCurrency,
      senderAmount,
      receiver,
      receiverCurrency,
      receiverAmount,
      feeCurrency: parseCurrency(transaction[6]),
      feeAmount: transaction[5] !== "-" ? new BigNumber(transaction[5]) : new BigNumber(0),
      type,
    });
  }

  return ret;
};
