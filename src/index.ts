import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as json2csv from "json2csv";

import { computeTransactions } from "./computeTx";
import { config } from "./config";
import { sendEmail } from "./email";
import { getTransactions, parseTransactions } from "./etherscan";
import { findKrakenTxs } from "./kraken";

const code = async () => {
  let contracts = config.contracts;

  const walletsToCheck = config.wallets.map(wallet => wallet.address);
  const txsRaw = await getTransactions(walletsToCheck);
  const newContracts = txsRaw.filter(txRaw => txRaw.contractAddress !== "").map(txRaw => ({
    address: txRaw.contractAddress,
    alias: `new contract ${txRaw.contractAddress}`,
  }));
  contracts = contracts.concat(newContracts);
  const txsParsed = parseTransactions(txsRaw);
  let txsComputed = await computeTransactions(txsParsed, contracts);

  if (config.kraken.enabled) {
    txsComputed = await findKrakenTxs(txsComputed);
  }

  const filePath = writeToFile(txsComputed);

  if (config.email.enabled) {
    sendEmail(filePath);
  }

  displayNewContracts(newContracts);
};

code().catch(err => {
  console.log(err);
  process.exit(1);
});

const writeToFile = (transactions: any) => {
  const path = `./outcome/Transactions_${config.startDate.format("YYMMDD")}-${config.endDate.format(
    "YYMMDD"
  )}.csv`;
  const fields = [
    "date",
    "hash",
    "from",
    "to",
    "txCostETH",
    "txValueETH",
    "txTotalETH",
    "txCostFiat",
    "txValueFiat",
    "txTotalFiat",
    "ethPrice",
    "type",
    "desc",
  ];
  const fieldNames = [
    `Date`,
    `Transaction id`,
    `Sender`,
    `Receiver`,
    `Transaction cost in ETH`,
    `Transaction amount in ETH`,
    `Transaction total in ETH`,
    `Transaction cost in ${config.fiatCurrency}`,
    `Transaction amount in ${config.fiatCurrency}`,
    `Transaction total in ${config.fiatCurrency}`,
    `ETH price from date in ${config.fiatCurrency} (weighted average exchange rate)`,
    `Transaction type`,
    `Description`,
  ];
  const csv = json2csv({ fields, fieldNames, data: transactions });

  if (!existsSync("./outcome")) {
    mkdirSync("./outcome");
  }

  writeFileSync(path, csv);
  console.log(`${path} saved`);
  return path;
};

const displayNewContracts = (
  newContracts: Array<{
    address: string;
    alias: string;
  }>
): void => {
  if (newContracts.length === 0) {
    return;
  }
  console.log(
    "During selected period following contracts were deployed. Consider adding them to your config file."
  );
  for (const contract of newContracts) {
    console.log(contract.address);
  }
};
