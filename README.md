# Ethereum accounting
## Introduction
Our accounting department needs to follow ETH transfer to and from our wallets and amount of spent on transactions costs. In ETH and fiat currency.

All that information is available online in Etherscan and Kraken (we are using this exchange) but you receive raw data which is inconvenient to process manually. This simple script script helps in this task.

As input you provide Ethereum addresses and outcome is list (csv file) of your transactions with their ETH and fiat tx cost and value from date of transaction divided into deposit, local and expense categories.

Categories describes direction in which eth flows.
- **Deposit** is transaction that comes from unknown address to one of ours. In this case we are ignoring tx fee as it was paid by someone else and we are interested only in ETH amount that was sent to us. If transaction failed we ignore it as we didn’t spent any gas on it nor it didn’t cause change in account balance.
- **Local** transactions are ones that both addresses are ours. Those are special in this manner that we moved eth between our own accounts or just perform transaction on one of our contracts. So generally there is no change in ETH balance but some was spent on transaction fees which goes to network. That’s why we divide every local tx into two entries. Transaction fee is expense as it was paid to network and value of eth is marked as local.In case of failure we ignore value but as we paid for gas we spent so it have to note it.
- **Expense** are transactions that lowered overall amount of eth that we posses. Its possible in two cases. When we sent eth to foreign wallet then both value and tx cost are on us. Or we make local transaction which didn’t change eth balance but still we have paid for gas used to perform it.

## Configuration and running

From technical point of view it's Javascript node application running on [node.js](https://nodejs.org/) and we use [yarn package manager](https://yarnpkg.com) to handle dependencies. To run tool you need both to be installed on your machine. Its easy and both sides provide detailed instruction how to do it.

### Obtaining code
We don't provide npm package. But you can clone repository or [download zip](https://github.com/Neufund/commit.neufund.org/archive/master.zip) from github.
### Dependencies
Go to directory where you put code and issue `yarn` command.
### Configuration
Configuration is stored in `config.json` you need to create one by yourself. We provided example as `config.example.json` just copy it in same directory and fill required data. Most of options are self-explanatory just two require more explanation.
- **ethScanApiKey** To use Etherscan API you have to register and generate your unique API key. Go to [login page](https://etherscan.io/login) and after creating / logging into user panel in [API-KEYs](https://etherscan.io/myapikey) you can generate API key.
- **wallets** For those addresses script will obtain transactions. You can provide `alias` which will be used instead of address on outcome list. Second optional option is `"isDev": true`. If you mark address with it `description` column will start with `dev expenses`. We use it in our company to distinguish dev addresses from ops ones.
### Runing
Just issue `yarn run` command and script will start working and gather all required information. It will crate `outcome` directory with `trasactions.csv` file.
