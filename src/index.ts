import { obtainPrices } from "./currencyPrices";

const code = async () => {
  await obtainPrices();
};

code().catch(err => {
  console.log(err);
  process.exit(1);
});
