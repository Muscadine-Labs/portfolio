# Wallet liquid-token sync (planned)

**Status:** design only — not implemented yet.  
**API design:** [Muscadine-Labs/api-portfolio `docs/wallet-token-sync.md`](https://github.com/Muscadine-Labs/api-portfolio/blob/main/docs/wallet-token-sync.md) (local: `../api-portfolio/docs/wallet-token-sync.md`).

## What you get

One wallet **Sync** (manual or daily) covers:

1. **Tokens the wallet holds** (Alchemy on Base/Ethereum) that we recognize in a known registry  
2. **Morpho** positions (existing GraphQL)  
3. **Bitcoin** via electrs when configured  

### Pricing (no extra CoinGecko calls for wrappers)

Same rules as Settings → price refresh / `quote-aliases.ts`:

| Held as | Priced as |
|---------|-----------|
| WETH | **ETH** (shared spot) |
| cbBTC / CBBTC / CBTC | **BTC** (shared spot) |
| USDC / USDT / DAI | **$1** (no API) |
| wstETH, cbETH, AERO, MORPHO, … | Their CoinGecko id **once** per batch |

### Mapping (like Morpho)

In Plan → Wallets → edit wallet, **Token map** next to Morpho map:

- Enable/disable each **held + known** token  
- Target **Assets** or **Cash**  
- Optional **`rowId`**: replace an existing asset/cash row’s quantity + API price (no duplicate)  
- Unmapped → not written  

**Other tokens:** if the wallet holds something useful that isn’t in the registry yet, we **add it to the registry** (address + symbol + price path). Unknown spam stays hidden. Optional later: custom contract + CoinGecko id in the UI.

## UI vs Morpho

| Morpho | Liquid tokens |
|--------|----------------|
| GraphQL positions | Alchemy held balances |
| `morphoMappings` | `tokenMappings` |
| assets / cash / liabilities | **assets / cash** only |
| `rowId` replace | Same |

## Defaults

- Stables → Cash  
- ETH / WETH / cbBTC / LSTs / AERO / MORPHO → Assets  
- User can remap or attach `rowId` anytime  

## Non-goals

- Write txs from the portfolio site  
- Showing every airdrop junk token  
- Solana (later)  

## When implementing

Follow the API checklist; keep portfolio `quote-aliases.ts` in sync with api-portfolio (especially aliases and CoinGecko ids).
