import { BigNumber } from "bignumber.js";
import { Moment } from "moment";

export enum FiatCurrency {
  EUR = "EUR",
  USD = "USD",
}

export enum CryptoCurrency {
  BTC = "BTC",
  ETC = "ETC",
  ETH = "ETH",
  REP = "REP",
  XMR = "XMR",
}

export enum TxType {
  DEPOSIT = "DEPOSIT",
  LOCAL = "LOCAL",
  EXPENSE = "EXPENSE",
}

export interface IEthAcconut {
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
    wallets: IEthAcconut[];
    contracts: IEthAcconut[];
  };
  fiatCurrency: FiatCurrency;
  kraken: {
    enabled: boolean;
    key: string;
    secret: string;
  };
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

  receiver: string;
  receiverCurrency: string;
  receiverAmount: string;

  feeCurrency: string;
  feeAmount: string;
  feeFiat: string;

  type: string;
  notes?: string;
}
