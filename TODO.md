# Tasks to work on portfolio and api-portfolio
## Review CLAUDE.md and AGENTS.md for both the repo portolio and the other repo api-portfolio before committing any changes.

- make sure every $ amount, or number, everywhere in the repo has this format or number amount with thosand seperator commas such as: 10,000,000.00 or $10,000,000.00
- Market price refresh on settings, data fails "Price refresh failed" could not reach the server.
- Seems like when I add another asset, its price is 0, make it so when added, it fetches a new price or get another price if its the same asset already the user or another user has. If no price can be reached than notify.
- With this in mind, lets add the coingecho api so we can track crypto prices like wsteth and eth and sol, xrp and btc. Make the other apis back up for crypto. For crypto, keep morpho for morpho, while the other crypto tokens fetch prices by coingecho.
-- On goals, there is a bug where i connot connect to a asset section or liabilties directly when I add a goal, I have to first manually put a goal than change it to a assrt section or liabiltiy. Also make sure the liabilties the progress is less debt not more.
-  Review the manual save intergration at the top right on the banner and test to see if it actually saves to the server.
- On cash, if a update the balance and i still have the intital $, update the interest, if i update the interest, than update the balance.
- On cash make sure the interest accruted is also reflected on the site and add not in the cost basis. On assets, liabilties and cash, at the overivew of each page also include the cost basis and %,$ gain/loss.
- On the dashboard graph of net worth, add the abiltiy to have cash, assets and liabilties as lines on the graph. On data for settings, add the ability to either turn off or on these lines. make default on.
- Review the mobile layout and fix the assets page to be like how liabilties and cash. Explore any other ways mobile view is laking or if there are any bugs.
- As an admin, I cannot log in from login, it does not work and allow me to log in, but i can log in as a user. Review why this is happening. 

## Once All tasks are complete and fixed, go through the repo and find any bugs. Run lint, build, test and bump both repo versions using the guidelines descrbed on how to bump. Put what you learned inside of CLAUDE.md and AGENTS.md. If there is any dead/unused code, tell me.

# Future (don't focus on now)

- Google Sheets / excel integration
- Have it on settings where users have an option. Either have the google sheet mirror from a google sheet and/or the data from our portfolio is uploaded to a google sheet. To mirror a google sheet, the google sheet can have the price ata from google finane, and if its uploaded to google sheet it can have the google prices on the google sheet, but just update shares, cost ect. Research how to develop this. Also make an option like the excel download to download in google sheet style too. 
