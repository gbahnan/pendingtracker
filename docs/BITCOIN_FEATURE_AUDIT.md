# Pending Tracker — Bitcoin functionality audit and implementation tracker

Last reviewed: 2026-10-18. Source: current `main` implementation and Mempool integration endpoints. **A passing build is not a live functional test.** Statuses below are code-level observations, not production validation.

## Acceptance criteria
Every feature is done only after: (1) data source returns validated data, (2) correct plain-English explanation is visible on the right page, (3) loading, errors, stale data and unsupported cases are handled, (4) iPhone and desktop layouts checked, (5) production deployed and live tested with known real transactions/addresses. Never present estimates as exact position or guaranteed confirmation times. Preserve Ethereum design and data paths.

## Inventory — Bitcoin

| Capability | Current evidence | Status | Next acceptance task |
| --- | --- | --- | --- |
| Transaction lookup, status and confirmations | `app/api/btc/tx/[txid]/route.ts` fetches tx/status | Implemented; unverified live | Test pending, confirmed, unknown, provider outage |
| Live tx refresh | `app/btc/[txid]/page.tsx` WebSocket + polling fallback | Implemented; unverified event protocol | Validate actual tx/block events and reconnect |
| Recommended fees | `lib/btc/providers/mempool.ts` precise with recommended fallback | Implemented; unverified accuracy | Test fee guide against provider and stale data |
| CPFP ancestor/descendant data | `getCpfpInfo`, tx explanation | Partial | Validate response schema, ancestor/descendant meanings, effective package fee |
| RBF replacement history | `getRbfHistory`, generic tx explanation | Partial | Render replacement chain with verified tx IDs and status |
| Acceleration guidance | Contextual RBF/CPFP explanations | Implemented; unverified live | Confirm full-RBF caveats and wallet guidance |
| Spent outputs | `getTxOutspends` in tx API | Data connected; UI partial | Show individual spent/unspent outputs with links |
| Projected blocks | `/api/v1/fees/mempool-blocks` and fee-band matching | Approximate only | Retrieve actual tracked tx position if provider supports it; label fallback estimate |
| Confirmed block details | Recent blocks feed includes count, size, fees, pool name; tx explanation uses recent blocks | Partial | Build block detail page, lookup older blocks, accurate pool attribution |
| Fee comparisons | Recent confirmed-block median compared to current recommended fees | Partial | Add explicit time horizon, separate recommendation vs paid median, history chart if justified |
| Wallet address validation | `validateBtcAddress` | Implemented; unverified | Test bech32, base58, invalid checksum |
| Wallet live balances and pending activity | `app/api/btc/address/[address]/live/route.ts` | Implemented; unverified | Test incoming/outgoing, mempool replacement and pagination |
| Wallet UTXOs | `/api/address/:address/utxo`, confirmed/pending counts and values | Partial | Show per-output details, maturity, spendability caveats, paging |
| Bitcoin block visualization | `app/bitcoin/BlockchainWebGL.tsx` still uses `HexagonLab` | **Not complete** | Integrate gold rectangular projected/confirmed blocks; preserve Ethereum hexagons |
| Bitcoin mobile layout | Existing responsive components | Not audited | Test iPhone sizes, horizontal scroll, labels and touch |
| Network/provider reliability | Network API aggregates multiple providers, frequent polling | Needs hardening | Caching, rate limits, fallback, error telemetry |
| Lightning Network | No verified implementation in reviewed files | Future scope | Separate research; not prerequisite for core on-chain explorer |
| Mining difficulty | No verified user-facing implementation in reviewed files | Low priority | Explain only if core functionality complete |

## Priority implementation order
1. **Accuracy and data contract**: verify Mempool WebSocket tracked-tx position protocol; distinguish exact data from fee-band projection; validate CPFP/RBF/outspend schemas.
2. **Finish transaction page**: position, RBF history links, output spend states, detailed confirmed block and mining pool data.
3. **Finish wallet page**: UTXO detail table, pending incoming/outgoing states, live address events and pagination.
4. **Explorer/home parity**: fee context, block statistics, links and coherent data explanations across Bitcoin entry points.
5. **Expanded Mempool parity**: first-seen times, balance history, Merkle proofs, mining audits, fee history, and testnet/signet, with accurate support and unavailable states.
6. **Quality gate**: real test fixtures, mobile Safari, accessibility, performance, upstream failure modes, Vercel READY and actual production smoke tests.
7. **Visual integration LAST**: replace Bitcoin hexagons with gold rectangular projected and confirmed blocks using the existing prototype; do not alter Ethereum visuals.

## Release log
- PR #6: Bitcoin WebSocket transaction refresh — merged.
- PR #7: CPFP ancestry explanations — merged.
- PR #8: Wallet UTXO counts/value — merged.
- PR #9: Recent confirmed block explanations — merged.
- PR #10: Short-term fee comparisons — merged.
- PR #11: RBF/CPFP acceleration guidance — merged.

These releases do **not** mean the entire feature inventory has passed live functional verification. Update this file as each item is independently validated.

## Consolidated implementation workflow (2026-10-18)

- Integration branch: `bitcoin-complete-integration`, based on `btc-expanded-mempool-capabilities` and incorporating the historical-block work from `btc-historical-block-details`.
- PR #14 and PR #15 are source branches, not independent production releases; all subsequent Bitcoin features should be implemented on the integration branch to avoid repeated isolated PRs.
- **Definition of complete:** every agreed feature has a real data source, validated schema, usable explanation, error handling, mobile/desktop check, tests, and confirmed production behavior. A READY preview alone is insufficient.
- **Remaining expanded scope:** first-seen endpoint live validation; real RBF chain; wallet balance history and UTXO detail; historical fee charts; mining audit; testnet/signet; true transaction position where available; provider reliability and mobile quality. Merkle proof metadata is present in development but independent verification is not implemented.
- **Visualization is the final task**, after all functional and quality checks, and Ethereum remains unchanged.
- Production remains on the latest merged `main` until the consolidated release passes verification. Do not merge incomplete integration work merely because it builds.
