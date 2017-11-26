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
    hash: string;
    txCostETH: string;
    txCostFiat: string;
    txValueETH: string;
    txValueFiat: string;
    type: TxType;
}
