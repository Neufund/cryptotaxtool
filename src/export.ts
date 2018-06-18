import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";

import { config } from "./config";
import { dateFormat } from "./constants";
import { prices } from "./currencyPrices/currencyPrices";
import { ILedgerEntry, ILedgerEntryDisplay } from "./typings/types";

export const dumpToCSV = (ledger: ILedgerEntry[]): void => {
  const path = `./outcome/test_Transactions_${config.startDate.format(
    "YYMMDD"
  )}-${config.endDate.format("YYMMDD")}.csv`;

  if (!existsSync("./outcome")) {
    mkdirSync("./outcome");
  }

  const formattedEntries = prepareDataToDisplay(ledger);

  const fields = [
    "date",
    "id",
    "sender",
    "senderCurrency",
    "senderAmount",
    "senderAmountFiat",
    "receiver",
    "receiverCurrency",
    "receiverAmount",
    "receiverAmountFiat",
    "type",
    "expenseType",
    "notes",
  ];
  const fieldNames = [
    `Date`,
    `Transaction id`,
    `Sender`,
    `Sender currency`,
    `Sender amount`,
    `Sender amount in ${config.fiatCurrency}`,
    `Receiver`,
    `Receiver currency`,
    `Receiver amount`,
    `Receiver amount in ${config.fiatCurrency}`,
    `Transaction type`,
    `Expense type`,
    `Notes`,
  ];
  const csv = json2csv({ fields, fieldNames, data: formattedEntries });

  writeFileSync(path, csv);
  console.log(`${path} saved`);
};

export const prepareDataToDisplay = (ledger: ILedgerEntry[]): ILedgerEntryDisplay[] => {
  return ledger.map(entry => {
    const date = entry.date.format(dateFormat);
    const senderCurrencyPrice = prices[date][entry.senderCurrency][config.fiatCurrency];
    const receiverCurrencyPrice = prices[date][entry.receiverCurrency][config.fiatCurrency];

    return {
      date,
      id: entry.id,
      sender: entry.sender,
      senderCurrency: entry.senderCurrency.toString(),
      senderAmount: entry.senderAmount.toString(),
      senderAmountFiat: entry.senderAmount.times(senderCurrencyPrice.toString(10)).toFixed(4),
      receiver: entry.receiver,
      receiverCurrency: entry.receiverCurrency.toString(),
      receiverAmount: entry.receiverAmount.toString(),
      receiverAmountFiat: entry.receiverAmount.times(receiverCurrencyPrice.toString(10)).toFixed(4),
      type: entry.type.toString(),
      expenseType: entry.expenseType === null ? "" : entry.expenseType.toString(),
      notes: entry.notes,
    };
  });
};
