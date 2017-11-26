import BigNumber from "bignumber.js";
import { Moment } from "moment";

export enum Currency {
    EUR = "EUR",
    USD = "USD",
}

export enum TxType {
    INCOMING = "INCOMMING",
    LOCAL = "LOCAL",
    OUTGOING = "OUTGOING",
}

export const dateFormat = "YYYY-MM-DD";

export interface IRawTransaction {
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
    hash: string;
    txCostFiat: string;
    txValueFiat: string;
    type: TxType;
}
