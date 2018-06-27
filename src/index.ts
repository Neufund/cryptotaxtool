import { coinTrackingImport, combineCoinTrackingInfo } from "./cointracking/worker";
import { obtainPrices } from "./currencyPrices/currencyPrices";
import { gatherETH } from "./eth/worker";
import { dumpToCSV } from "./export";
import { combineNEUTransfers, gatherNEU } from "./neu/worker";

const code = async () => {
  const eth = await gatherETH();
  const coinTrackingTransactions = coinTrackingImport();
  const ledger = combineCoinTrackingInfo(eth, coinTrackingTransactions);
  await obtainPrices();
  const neuTransfers = await gatherNEU();
  const neuAdded = combineNEUTransfers(ledger, neuTransfers);
  dumpToCSV(neuAdded);
};

code().catch(err => {
  console.log(err);
  process.exit(1);
});
