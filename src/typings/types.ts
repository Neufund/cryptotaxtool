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

export enum ExpenseType {
  FEE = "FEE",
  PAYMENT = "PAYMENT",
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
  ethereumNodeUrl: string;
  ETH: {
    wallets: IEthAccount[];
    contracts: IEthAccount[];
  };
  NEU: {
    tokenMapperUrl: string;
    contractAddress: string;
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

  type: TxType;
  expenseType: null | ExpenseType;
  notes?: string;
}

export interface ILedgerEntryDisplay {
  date: string;
  id: string;

  sender: string;
  senderCurrency: string;
  senderAmount: string;
  senderAmountFiat: string;

  receiver: string;
  receiverCurrency: string;
  receiverAmount: string;
  receiverAmountFiat: string;

  type: string;
  expenseType: string;
  notes?: string;
}
