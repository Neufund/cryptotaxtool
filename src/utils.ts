import { CryptoCurrency, FiatCurrency, ILedgerEntry} from "./typings/types";

export const parseCurrency = (currency: string): FiatCurrency | CryptoCurrency => {
  const crypto = CryptoCurrency[currency as keyof typeof CryptoCurrency];
  if (crypto !== undefined) {
    return crypto;
  }
  return FiatCurrency[currency as keyof typeof FiatCurrency];
};

export const ledgerEntryComparator = (a: ILedgerEntry, b: ILedgerEntry): number => {
  const dateDiff = a.date.diff(b.date);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  const stringDiff = a.id.localeCompare(b.id);
  if (stringDiff !== 0) {
    return stringDiff;
  }
  const typeDiff = a.type.localeCompare(b.type);
  if (typeDiff !== 0) {
    return typeDiff;
  }

  return a.expenseType.localeCompare(b.expenseType);
};
