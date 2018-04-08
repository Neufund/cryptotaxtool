import { coinTrackingImport } from "./cointracking/worker";
import { obtainPrices } from "./currencyPrices";
import { gatherETH } from "./eth/worker";
import { dumpToCSV } from "./export";

const code = async () => {
  await obtainPrices();
  const ledger = await gatherETH();
  dumpToCSV(ledger);
  coinTrackingImport();
};

code().catch(err => {
  console.log(err);
  process.exit(1);
});
