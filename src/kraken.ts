/*
import * as Kraken from "kraken-exchange";
import * as Moment from "moment";

import { config } from "./config";
import { IComputedTransaction, TxType } from "./constants";

export const findKrakenTxs = async (
  transactions: IComputedTransaction[]
): Promise<IComputedTransaction[]> => {
  const kraken = new Kraken(config.kraken.key, config.kraken.secret);
  const withdrawalsRaw = (await kraken.ledgers("ETH", "withdrawal")).ledger;
  const withdrawalsParsed = Object.values(withdrawalsRaw).map((elm: any) => ({
    amount: Math.abs(parseFloat(elm.amount)),
    fee: parseFloat(elm.fee),
    time: Moment.unix(elm.time),
  }));

  return transactions.map(tx => {
    if (tx.type !== TxType.DEPOSIT) {
      return tx;
    }

    const matchedTxs = withdrawalsParsed.filter(withdrawal => {
      const txAmount = parseFloat(tx.txValueETH);
      return withdrawal.amount === txAmount;
    });

    if (matchedTxs.length === 0) {
      return tx;
    }

    if (matchedTxs.length === 1) {
      const matchedTx = matchedTxs[0];
      const price = parseFloat(tx.ethPrice);
      return {
        ...tx,
        desc: "from Kraken",
        from: "kraken",
        txCostETH: matchedTx.fee.toString(10),
        txCostFiat: (matchedTx.fee * price).toString(10),
        txTotalETH: (matchedTx.fee + matchedTx.amount).toString(10),
        txTotalFiat: ((matchedTx.fee + matchedTx.amount) * price).toString(10),
        type: TxType.LOCAL,
      };
    }

    if (matchedTxs.length > 1) {
      throw new Error(
        "There is more withdrawal matching tx. We are not handling that case we need to fix script"
      );
    }
  });
};
*/
