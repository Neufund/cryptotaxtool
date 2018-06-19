import { CryptoCurrency, FiatCurrency } from "./typings/types";

export const parseCurrency = (currency: string): FiatCurrency | CryptoCurrency => {
  const crypto = CryptoCurrency[currency as keyof typeof CryptoCurrency];
  if (crypto !== undefined) {
    return crypto;
  }
  return FiatCurrency[currency as keyof typeof FiatCurrency];
};
