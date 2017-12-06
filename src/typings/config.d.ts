import { FiatCurrency } from "../constants";

export interface IConfig {
    startBlock: string;
    ethScanApiKey: string;
    wallets: Array<{
        address: string;
        alias: string;
        isDev?: boolean;
    }>;
    fiatCurrency: FiatCurrency;
}
