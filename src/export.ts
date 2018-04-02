import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";

import { config } from "./config";
import { dateFormat } from "./constants";
import { prices } from "./currencyPrices";
import { CryptoCurrency, ILedgerEntry, ILedgerEntryDisplay } from "./typings/types";

export const dumpToCSV = (ledger: ILedgerEntry[]): void => {
  const path = `./outcome/test_Transactions_${config.startDate.format("YYMMDD")}-${config.endDate.format(
    "YYMMDD"
  )}.csv`;

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
    "senderCurrencyExchangeRate",
    "receiver",
    "receiverCurrency",
    "receiverAmount",
    "feeCurrency",
    "feeAmount",
    "feeFiat",
    "feeCurrencyExchangeRate",
    "type",
    "notes",
  ];
  const fieldNames = [
    `Date`,
    `Transaction id`,
    `Sender`,
    `Sender currency`,
    `Sender amount`,
    `Sender amount in ${config.fiatCurrency}`,
    `Sender currency exchange rate from date in  ${config.fiatCurrency}`,
    `Receiver`,
    `Receiver currency`,
    `Receiver amount`,
    `Fee currency`,
    `Fee amount`,
    `Fee amount in  ${config.fiatCurrency}`,
    `Fee currency exchange rate from date in ${config.fiatCurrency}`,
    `Transaction type`,
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
    const feeCurrencyPrice = prices[date][entry.feeCurrency][config.fiatCurrency];

    return {
      date,
      id: entry.id,
      sender: entry.sender,
      senderCurrency: entry.senderCurrency.toString(),
      senderAmount: entry.senderAmount.toString(),
      senderAmountFiat: entry.senderAmount.times(senderCurrencyPrice).toFixed(4),
      senderCurrencyExchangeRate: senderCurrencyPrice.toString(),
      receiver: entry.receiver,
      receiverCurrency: entry.receiverCurrency.toString(),
      receiverAmount: entry.receiverAmount.toString(),
      feeCurrency: entry.feeCurrency.toString(),
      feeAmount: entry.feeAmount.toString(),
      feeFiat: entry.feeAmount.times(feeCurrencyPrice).toFixed(4),
      feeCurrencyExchangeRate: feeCurrencyPrice.toString(),
      type: entry.type.toString(),
      notes: entry.notes,
    };
  });
};
