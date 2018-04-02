import { BigNumber } from "bignumber.js";
import { Moment } from "moment";

export interface IRawEthScanTransaction {
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

export interface IParsedEthScanTransaction {
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
