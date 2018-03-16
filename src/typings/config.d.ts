import * as Moment from "moment";

import { FiatCurrency } from "../constants";

export interface IConfig {
  startDate: Moment.Moment;
  endDate: Moment.Moment;
  ethScanApiKey: string;
  wallets: Array<{
    address: string;
    alias: string;
    isDev?: boolean;
  }>;
  contracts: Array<{
    address: string;
    alias: string;
  }>;
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
