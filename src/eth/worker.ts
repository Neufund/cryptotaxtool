import { config } from "../config";
import { ILedgerEntry } from "../typings/types";
import { computeTransactions } from "./computeTx";
import { getTransactions, parseTransactions } from "./etherscan";

export const gatherETH = async (): Promise<ILedgerEntry[]> => {
  const walletsToCheck = config.ETH.wallets.map(wallet => wallet.address);
  const rawEthTxs = await getTransactions(walletsToCheck);
  const parsedTxs = parseTransactions(rawEthTxs);
  return computeTransactions(parsedTxs);
};
