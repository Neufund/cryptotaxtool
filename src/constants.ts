import BigNumber from "bignumber.js";
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
    INCOMING = "INCOMMING",
    LOCAL = "LOCAL",
    OUTGOING = "OUTGOING",
}

export enum WalletType {
    STANDARD = "STANDARD",
    DEV = "DEV",
}

export const dateFormat = "YYYY-MM-DD";

export interface IRawTransaction {
    contractAddress: string;
    from: string;
    gasPrice: string;
    gasUsed: string;
    hash: string;
    timeStamp: string;
    to: string;
    txreceipt_status: string;
    value: string;
}

export interface IParsedTransaction {
    contractCreation: boolean;
    date: Moment;
    from: string;
    gasEth: BigNumber;
    gasPrice: BigNumber;
    gasUsed: BigNumber;
    hash: string;
    to: string;
    txFailed: boolean;
    value: BigNumber;
}

export interface IComputedTransaction {
    date: string;
    from: string;
    hash: string;
    to: string;
    txCostETH: string;
    txCostFiat: string;
    txValueETH: string;
    txValueFiat: string;
    type: TxType;
    desc?: string;
}
