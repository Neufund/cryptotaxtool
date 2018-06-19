import { coinTrackingImport, combineCoinTrackingInfo } from "./cointracking/worker";
import { obtainPrices } from "./currencyPrices/currencyPrices";
import { gatherETH } from "./eth/worker";
import { dumpToCSV } from "./export";

const code = async () => {
  const eth = await gatherETH();
  const coinTrackingTransactions = coinTrackingImport();

  const ledger = combineCoinTrackingInfo(eth, coinTrackingTransactions);

  await obtainPrices();

  dumpToCSV(ledger);
};

code().catch(err => {
  console.log(err);
  process.exit(1);
});
