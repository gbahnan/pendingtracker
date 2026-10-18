# Mempool upstream source-route audit (development)

This audit compares Pending Tracker's `lib/btc/providers/datasets.ts` allowlist with actual route declarations in [mempool/mempool](https://github.com/mempool/mempool). **Cataloged is not equivalent to publicly available, tested, or integrated.** The catalog currently has 117 entries, not a 95% coverage claim.

## Upstream route modules inspected

- `backend/src/index.ts` — route registration and conditional features
- `backend/src/api/bitcoin/bitcoin.routes.ts` — transactions, fees, mempool, blocks, scripthashes, address, RBF, Bitcoin internals
- `backend/src/api/mining/mining-routes.ts` — mining, audits, accelerations, historical price
- `backend/src/api/statistics/statistics.routes.ts` — historical mempool statistics
- `backend/src/api/prices/prices.routes.ts` — prices
- `backend/src/api/explorer/nodes.routes.ts` — Lightning nodes
- `backend/src/api/explorer/channels.routes.ts` — Lightning channels
- `backend/src/api/explorer/general.routes.ts` — Lightning statistics/search
- `backend/src/api/acceleration/acceleration.routes.ts` — accelerator services
- `backend/src/api/services/services-routes.ts` — wallets and treasuries
- `backend/src/api/bitcoin/bitcoin-core.routes.ts` — internal Bitcoin Core routes (not exposed through Pending Tracker)
- `backend/src/api/liquid/liquid.routes.ts` — separate Liquid network (out of Bitcoin-mainnet scope)
- `backend/src/api/about.routes.ts` — website/organization metadata, not explorer data

## Important route coverage gaps or special handling

| Source route | Why not simply add to generic GET catalog |
| --- | --- |
| `GET /api/v1/transaction-times` | Requires repeated `txId` query values, with a bounded count |
| `GET /api/v1/mining/blocks/fees` | Requires validated `from` and `to` timestamps |
| `GET /api/v1/lightning/channels` | Requires public key, status and index validation/pagination |
| `GET /api/v1/lightning/channels/txids` | Requires repeated transaction IDs |
| `GET /api/v1/lightning/search` | Requires search query handling |
| `GET /api/v1/lightning/channels-geo/:publicKey` | Public key must be checked for supported formats; previously misnamed parameter |
| `GET /api/v1/mining/blocks/fees/:interval` | Supported interval values need live verification |
| `GET /api/v1/goggles/:interval/... ` | Optional flags, intervals and feature enablement require dedicated validation |
| `GET /api/v1/txs/outspends` | Bounded comma-separated txids required |
| `GET /api/v1/mempool/txids` | Potentially huge response; avoid public proxy |
| `GET /api/block/:hash/raw` | Binary content; needs dedicated size-limited handler |
| `POST /api/v1/tx/push`, `POST /api/v1/acceleration/request/:txid` | State-changing or paid actions; not appropriate for generic read-only proxy |
| `/api/v1/internal/*` | Internal routes must not be exposed |
| `/api/v1/services/accelerator/*` | May depend on paid service or instance configuration |

## Validation required before merging

1. Compare every catalog path with the upstream route declarations and Esplora compatibility routes. Separate `/api` from `/api/v1` prefixes; source registration alone does not guarantee a particular hosted public prefix.
2. Probe representative public endpoints using a bounded test suite with conservative rate limits. Record 200/204/400/401/403/404/429 and schema signatures, not just Vercel build success.
3. Remove, correct, or feature-gate unsupported endpoints. Prevent arbitrary bulk requests and avoid exposing unbounded data.
4. Add input-specific query validation, typed response normalization, caching, and friendly error states.
5. Wire only validated, user-useful datasets into existing Bitcoin pages without changing their established visual design. Verify mobile behavior before production.
6. Keep native backend migration optional, and Bitcoin gold rectangular visualization last.

No production deployment is implied by this audit.
