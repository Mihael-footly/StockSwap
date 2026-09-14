# StockSwap implementation

User-approved master specification: build a real same-chain stock exposure swap, beginning with verified infrastructure. Workspace audit: empty on 2026-09-14. No reusable application, wallet, database, contracts, or deployment.

Architecture: Next.js App Router, TypeScript, viem, EIP-1193, Phantom’s injected EVM provider and WalletConnect, Zod, Postgres. The app never substitutes demo data for chain results. Default mainnet read-only. Routes require approved assets and venues and fresh reference data; execution is gated on persistent storage.

- [ ] Verify canonical network/token/venue deployments against official documentation and RPC.
- [ ] Write safety and routing tests, implement integer slippage, expiry, route comparison, direct and single-hop adapter quoting.
- [ ] Implement registry and reference price abstraction, RPC fallback and health check.
- [ ] Implement quote persistence, transaction construction, receipt verification and reconciliation with Postgres.
- [ ] Build swap, searchable asset picker, settings, wallet connect, exact approval, transaction state flow, activity and permanent receipt.
- [ ] Validate tests, TypeScript, production build, mobile browser flow and deployment.

Design: refined forest/cream/green consumer exchange. A large central swap card with restrained typography, generous margins, tactile token selectors, a visible network indicator and honest empty states. Explore supplies asset provenance and legal metadata. No arbitrary token address entry. No invented market metrics or charts.

Initial path: reuse an existing allowlisted DEX router when a canonical deployment is available. This avoids deploying an unnecessary custody contract. Encode the exact token path, recipient, input, minimum output and deadline server-side, revalidate before execution, simulate, and verify destination transfers against the confirmed transaction. No signed backend custody authorization is needed for an immutable DEX call that pays the wallet directly. A custom router remains out of scope unless actual execution requires one.
