# Portfolio — roadmap

## Up next

- Add coin-gecho api for crypto.
- Fix api for tokens/stocks, it doesnt refresh and bitcoin price is wrong. Do this, have it so all assets on api-portfolio update atleast once a day (you can do like 30 updates a minute at 4 am so the rate limiting doesnt happen (for stocks and crypto that is not on manual). So than if a user has a stock/crypto, and another user has the same asset it doesnt need to be called twice, you can get it from the api-portfolio data. Also remember the constants we would use.  cbBTC = BTC price. And USDC = $1.00. And WETH = ETH. Use tickers for calls not names from the data.
- Also lets make it so to refresh prices (if a manual refresh not the 4 am one) instead of having it on assets, go to settings, data, than on the bttom of data show the last time prices were updated, than an opertunnity to refresh prices. Currently if i try to refresh prices it fails.
- On the /wallets, add the ability if a wallet is on BASE or Ethereum, to connect it to a sepcific section on assets or liability or cash or all. Than if turned on, this can use the coingecho api to fetch tokens in the wallet and post them (only if above 10 cents in price to get rid of scam). Also, use the morpho sdk/api to fetch morpho v1 or v2 vaults (note on grapgh ql they have diferent api routes), this can be fetched by wallet address, than the ticker can be the vault ticker, then the name of vault, than have on the settings ot have two options. Either A, have the price per share in $, than the total amount of vault tokens. Or B, have the price of the undernlying assets, aka bitcoin, weth or USDC (pegged to 1$), than the shares/tokens would be how much the user has the udnerlying tokens, not vault shares. And for the markets, the debt  can be in the liabilties section. Note the collateral can be in assets. Find the best way to have the ui for all of this information, think about all the ways this information is presented and the ability for the user to change perameters. Such as on wallet when all of the positions load, where should they be sorted or added?

- Run lint, build and tests for both repos, then delete any dead or unused code for both repos — tell me before you delete anything.

## Possibility (don't focus on now)

- Google Sheets integration
