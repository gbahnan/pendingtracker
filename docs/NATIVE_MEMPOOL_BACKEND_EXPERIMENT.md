# Native Mempool backend experiment — isolated from production

## Decision
Use the **actual** open-source Mempool backend as the Bitcoin engine behind the existing Pending Tracker Next.js interface. Do **not** replace the gold transaction page, existing homepage, wallet interface, or Ethereum. This branch is an experiment; no production cutover is authorized.

## Verified upstream sources
- https://github.com/mempool/mempool (AGPL-3.0)
- https://github.com/mempool/mempool/blob/master/backend/README.md
- https://github.com/mempool/mempool/blob/master/backend/mempool-config.sample.json
- https://github.com/mempool/mempool/blob/master/backend/package.json

## What makes this different from our current API adapter
A native Mempool backend is a **separate, long-running service** with its own database and Bitcoin Core RPC connection. The existing Next.js/Vercel application remains the frontend and requests data from the new service. Pointing MEMPOOL_BASE_URL at public mempool.space does **not** count as testing the native backend.

## Required backend infrastructure
- Bitcoin Core (RPC, txindex), synchronized to the relevant chain.
- MariaDB 10.5+.
- Electrum-compatible server for address/wallet lookups (optional in Mempool but **required for Pending Tracker wallet parity**).
- Mempool backend built with Node.js 20+, npm and Rust per upstream backend README.
- Persistent server/container hosting (not an ordinary Vercel serverless function).
- Private internal URL, secrets for Bitcoin Core RPC, health checks and logs.
- Legal review of AGPL-3.0 obligations before distributing or offering a modified version.

## Upstream configuration findings (verified in sample)
- MEMPOOL.AUDIT = false by default.
- MEMPOOL.CPFP_INDEXING = false by default.
- MEMPOOL.BLOCKS_SUMMARIES_INDEXING = false by default.
- MEMPOOL.GOGGLES_INDEXING = false by default.
- LIGHTNING.ENABLED = false by default.
- MEMPOOL.BACKEND defaults to electrum.
- Database is enabled by default.
Do not enable everything blindly; audit CPU, disk, indexing time, and data prerequisites first.

## Proof-of-concept acceptance gate
1. Deploy a separate native Mempool backend on persistent compute with Bitcoin Core, MariaDB and Electrum connectivity.
2. Verify it responds to /api/tx/:txid, /api/v1/fees/recommended, /api/address/:address and projected block endpoints using real fixtures.
3. Compare supported data and calculations with our current public-API provider; record unavailable/optional features.
4. Connect **the existing** /btc/[txid] page to the isolated backend via environment configuration. Preserve markup, layout, colors, visualizations and AI summaries.
5. Verify the page with pending, confirmed, RBF/CPFP and unknown transactions; test error cases and iPhone.
6. Only then decide whether to expand to the Bitcoin explorer, wallet and homepage. No production merge until verified.

## What has actually happened
- Isolated branch created and this experiment specification committed.
- Upstream backend source, package and sample configuration inspected.
- **No native backend has been provisioned or started yet.**
- No Bitcoin node, Electrum server, MariaDB, or backend hosting is known to be connected.
- Production remains unchanged.

## Capabilities to investigate for user value
- CPFP ancestry/package fees and replacement history.
- Mempool projected blocks and precise fee context.
- Full historical blocks, mining pools, audit discrepancies and difficulty.
- Wallet address/UTXO and balance history.
- Historical fee and network statistics.
- Optional Lightning and advanced indexing, if justified.
- Testnet/signet environments.
Distinguish native backend capabilities from hosted mempool.space-only services; do not promise universal parity.
