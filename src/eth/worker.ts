import { config } from "../config";
import { ILedgerEntry } from "../typings/types";
import { computeTransactions } from "./computeTx";
import { getTransactions, parseTransactions } from "./etherscan";

export const gatherETH = async (): Promise<ILedgerEntry[]> => {
  const walletsToCheck = config.ETH.wallets.map(wallet => wallet.address);
  // TODO: we need functionality to log contracts created that not on config contract list
  const rawEthTxs = await getTransactions(walletsToCheck);
  const parsedTxs = parseTransactions(rawEthTxs);
  return computeTransactions(parsedTxs);
};
