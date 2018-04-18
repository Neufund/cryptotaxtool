import { BigNumber } from "bignumber.js";
import { Moment } from "moment";

export enum FiatCurrency {
  EUR = "EUR",
  USD = "USD",
}

export enum CryptoCurrency {
  BCH = "BCH",
  BTC = "BTC",
  ETC = "ETC",
  ETH = "ETH",
  REP = "REP",
  XMR = "XMR",
  NEU = "NEU",
}

export enum TxType {
  DEPOSIT = "DEPOSIT",
  LOCAL = "LOCAL",
  EXPENSE = "EXPENSE",
}

export interface IEthAccount {
  address: string;
  alias: string;
  isDev?: boolean;
  isContract?: boolean;
}

export interface IConfig {
  startDate: Moment;
  endDate: Moment;
  ethScanApiKey: string;
  ETH: {
    wallets: IEthAccount[];
    contracts: IEthAccount[];
  };
  fiatCurrency: FiatCurrency;
  email: {
    enabled: boolean;
    destEmail: string;
    userName: string;
    appPassword: string;
  };
}

export interface IPricesTable {
  [date: string]: {
    [currency: string]: {
      [currency: string]: number;
    };
  };
}

export interface ILedgerEntry {
  date: Moment;
  id: string;

  sender: string;
  senderCurrency: FiatCurrency | CryptoCurrency;
  senderAmount: BigNumber;

  receiver: string;
  receiverCurrency: FiatCurrency | CryptoCurrency;
  receiverAmount: BigNumber;

  feeCurrency: FiatCurrency | CryptoCurrency;
  feeAmount: BigNumber;

  type: TxType;
  notes?: string;
}

export interface ILedgerEntryDisplay {
  date: string;
  id: string;

  sender: string;
  senderCurrency: string;
  senderAmount: string;
  senderAmountFiat: string;
  senderCurrencyExchangeRate: string;

  receiver: string;
  receiverCurrency: string;
  receiverAmount: string;

  feeCurrency: string;
  feeAmount: string;
  feeFiat: string;
  feeCurrencyExchangeRate: string;

  type: string;
  notes?: string;
}
