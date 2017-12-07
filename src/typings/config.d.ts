import { FiatCurrency } from "../constants";

export interface IConfig {
    startDate: string;
    endDate: string;
    ethScanApiKey: string;
    wallets: Array<{
        address: string;
        alias: string;
        isDev?: boolean;
    }>;
    fiatCurrency: FiatCurrency;
}
