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
    contracts: Array<{
        address: string;
        alias: string;
    }>;
    fiatCurrency: FiatCurrency;
    kraken: {
        enabled: boolean,
        key: string,
        secret: string,
    };
}
