# Mempool API catalog: live validation

Checked against `https://mempool.space` on 2026-10-18. These are direct upstream HTTP/schema observations, **not** a claim that 117 features are integrated into the explorer UI.

## Reproduce

From the repository root:

```sh
node scripts/probe-bitcoin-catalog.mjs
```

Requires Node.js and curl. The script reads the current TypeScript route catalog, discovers a recent block, a transaction from that block, a real output address/script hash, a Lightning node/channel, and a published treasury wallet. It issues only read-only GET requests with concurrency 2, a 250ms gap per worker, an 18-second timeout, and a 2,000,000-byte response ceiling. It records status, duration, byte count, MIME type, JSON type, and observed object keys without storing large payloads. No credentials are needed.

Optional targeted checks:

```sh
BITCOIN_PROBE_ONLY=addressTransactionSummary,historicalPrice BITCOIN_PROBE_OUTPUT=docs/mempool-followup-validation.json node scripts/probe-bitcoin-catalog.mjs
```

`BITCOIN_PROBE_BASE` can select another compatible deployment. Responses and latency will differ by instance and network. The fixture bootstrap adds a few requests beyond the catalog count.

## Initial full pass

`mempool-live-validation.json` preserves the original 117-entry pass and its original paths/fixtures. It found 106 HTTP successes, seven 404 responses, three responses over the size limit, and one 400 response. One of the 106 successes is a **204 empty cache response**, not a retrieved transaction.

The observed successful groups include transaction/status/hex/outspends/merkle proof/CPFP/RBF, address history and UTXOs, script hash info/history/summary/UTXOs, blocks and audit data, recommended and precise current fees, projected mempool blocks, difficulty, hashrate, pool/mining statistics, prices, mempool statistics, and Lightning rankings/statistics. This verifies upstream data availability with the recorded fixtures; it does not validate every parameter value, every field's semantics, every UI consumer, or long-term service reliability.

## Findings and corrections

| Catalog entry | Initial observation | Resolution or limitation |
| --- | --- | --- |
| `addressTransactionSummary` | 404 HTML at `/api/v1/address/.../txs/summary` | Public Esplora route is `/api/address/.../txs/summary`; corrected and rechecked. |
| `accelerationHistoryAggregated` | 400: missing parameters | Requires `timeframe`; corrected to bounded `?timeframe=1m` and rechecked. |
| `historicalPrice` | Unfiltered history exceeds 2MB | Bound with validated `timestamp` and `currency=USD`; corrected and rechecked. |
| `lightningChannelByShortId` | Short string `800000x1x0` returns 404 | Despite route parameter naming, backend queries numeric `channels.id`, not `short_id`. Probe now discovers the numeric ID from a real node's active channel list; verified with a known channel. |
| `publicWallet` | Unknown `wbtc` fixture returns 404 | Probe now discovers wallet IDs from `/api/v1/treasuries`; valid published wallet returns data. |
| `blockBulk`, `blockBulkRange` | 404 JSON explicitly says API disabled | Source-defined feature, disabled on public mempool.space. Keep optional and do not represent as usable there. |
| `miningBlocksFeeRatesPrecise` | 404 HTML `Cannot GET` | Defined in fork backend source but unavailable on the tested public deployment. Ordinary fee-rate history works; do not silently relabel it as the precise endpoint. |
| `accelerationTransaction` | 404 for ordinary transaction | Expected data-dependent result: transaction was not identified as accelerated. Route existence alone does not guarantee accelerator records. |
| `lightningNodesCountry` (`US`), `lightningGeodata` | Responses exceed 2MB | Public route exists but these fixtures cannot pass the bounded generic proxy. Need a smaller query or dedicated constrained handler before integration. |
| `transactionCached` | 204, zero-byte body | Valid cache miss; consumer must handle absent cached transaction. Standard transaction fetch succeeds. |

`mempool-followup-validation.json` records the targeted rerun after the first three path fixes and the two fixture corrections. The original full-pass file is intentionally retained so the pre-fix findings remain reviewable.

## Source cross-check

Cross-checked against the Angular fork's `backend/src/api/bitcoin/bitcoin.routes.ts`, `backend/src/api/mining/mining-routes.ts`, `backend/src/api/explorer/{nodes,channels}.routes.ts`, `backend/src/api/explorer/channels.api.ts`, and frontend API services. A backend source route may be disabled, not yet deployed, or exposed under a different public namespace. In particular, frontend Esplora calls establish `/api/address/...` and `/api/txs/outspends?txids=ID1,ID2`; a generic `/api/v1` prefix is not interchangeable.

## Limits

These checks did not broadcast transactions, request paid acceleration, run a Bitcoin node, validate WebSocket subscriptions, verify AI text, or certify explorer UI integration. External timing measurements include the execution environment's network path and are unsuitable for architecture performance comparisons without browser-level controls.

## Provider behavior after the audit

The public-provider adapter now rejects the two disabled bulk entries and the unavailable precise-history entry before requesting them. Other compatible instances can still enable them through `MEMPOOL_BASE_URL`. Cached-transaction 204 responses normalize to `null`; unexpected HTML is treated as an upstream error. Numeric channel IDs are required by the legacy `shortId` query parameter. Historical-price requests require a validated timestamp, and aggregate accelerator history uses a one-month window.

The mining API now consumes the catalog's tested hashrate/difficulty entries. Bitcoin overview block-height search opens the existing block page, which resolves height to hash and requests Mempool's enriched block endpoint for mining-pool and fee information. Existing homepage and Ethereum source files and the Bitcoin layout/CSS are unchanged.

Focused provider tests: `node scripts/test-bitcoin-provider.cjs`. They exercise first-seen route/response normalization and absence, request validation before provider access, disabled public features, empty cache responses and HTML failures.

Browser verification on the isolated Next.js deployment: live network snapshot, fee bands and pending transactions rendered; search for `900000` opened block 900,000 with ViaBTC, 1,562 transactions, 2 sat/vB median and 1,791,835 sats total fees. This is evidence for those flows, not all catalog features. First-seen corrected endpoint returned `[0]` for an old confirmed transaction; the UI correctly keeps its time unavailable rather than inventing one. True iPhone rendering and AI-generated output were not verified in this run.
