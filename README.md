# StockSwap

StockSwap is a production-oriented same-chain swap interface for verified Stock Tokens. The repository is intentionally safe by default: it targets Robinhood Chain mainnet (4663) in read-only mode, disables execution without Supabase server credentials and an explicit `EXECUTION_ENABLED=true`, and never accepts arbitrary token contracts or router targets from the browser.

## Repository audit

The supplied workspace was empty. There was no existing frontend, wallet integration, chain configuration, database, contract, or deployment to reuse.

The live Robinhood asset registry currently includes AAPL, NVDA, TSLA, AMD, META, GOOGL, AMZN, NFLX, MSFT, and COIN in the reviewed catalog used by this build. It does not include HOOD, and it has no testnet deployments. The shortest currently verifiable route is **AAPL → USDG → NVDA** on Robinhood Chain mainnet through Uniswap V3. Direct AAPL/NVDA pools were absent when checked; the V3 two-pool route returned real quoter output. See `docs/chain-verification.log` for the read-only check.

Robinhood Chain Stock Tokens are issuer-created tokenised debt securities that provide economic exposure to an underlying reference. They do not represent registered brokerage shares or grant legal or beneficial ownership of the underlying company. The app links to issuer disclosures on every asset detail view.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev:local
```

Leave that terminal open while using the app, then visit http://127.0.0.1:3000.

Safe read-only mainnet defaults are used when `.env.local` is absent. For a real execution environment, configure a dedicated RPC provider, the supplied Supabase project using `SUPABASE_URL` and a server-only `SUPABASE_SECRET_KEY`, `CRON_SECRET`, and set `EXECUTION_ENABLED=true` only after the deployment has been tested with a funded development wallet. Never expose the secret key through a `NEXT_PUBLIC_` variable. Phantom’s EVM provider is available from the connect modal when the Phantom extension or in-app browser injects `window.phantom.ethereum`.

```bash
npm test
npm run typecheck
npm run build
npm run check:chain
```

`check:chain` performs read-only checks against the official network, registry, Uniswap deployments, token decimals, and live pool quoters. It does not broadcast a transaction.

## Execution model

The server resolves every asset against the issuer registry, checks bytecode, decimals, oracle pause and multiplier state, quotes allowlisted Uniswap V2/V3 pools, ranks only fresh routes within safety limits, and prepares exact recipient/path/minimum-output calldata. The browser signs an exact approval and then the exact swap. A Supabase-backed reconciliation worker verifies the transaction, token transfers, minimum output, receipt status, and confirmations before marking a receipt complete.

## Deployment

The project is Vercel-ready with `vercel.json` and a scheduled reconciliation endpoint. The current sandbox could not authenticate the Vercel CLI because its external network and usage limits blocked the deploy request. From an authenticated shell:

```bash
vercel deploy . -y --no-wait --scope stoevskyinvestment-2667s-projects
```
