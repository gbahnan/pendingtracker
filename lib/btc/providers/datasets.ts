/**
 * Server-side catalog of documented Mempool/Esplora Bitcoin API routes.
 * This is an allowlist, not an open proxy. The catalog makes broad data access
 * reusable without tying pages to a particular upstream deployment.
 *
 * Availability differs by instance. In particular, /api/v1 endpoints may be
 * disabled, rate-limited, or return different schemas.
 */
import { mempoolBaseUrl } from "./mempool";

export const bitcoinDatasets = {
  lightningChannelSearch: { path: "/api/v1/lightning/channels/search/{search}", input: "search" },
  lightningPenaltyClosures: { path: "/api/v1/lightning/penalties", input: "" },
  lightningChannelByShortId: { path: "/api/v1/lightning/channels/{shortId}", input: "shortId" },
  lightningNodeFeeHistogram: { path: "/api/v1/lightning/nodes/{pubkey}/fees/histogram", input: "pubkey" },
  statistics2h: { path: "/api/v1/statistics/2h", input: "" },
  statistics24h: { path: "/api/v1/statistics/24h", input: "" },
  statistics1w: { path: "/api/v1/statistics/1w", input: "" },
  statistics1m: { path: "/api/v1/statistics/1m", input: "" },
  statistics3m: { path: "/api/v1/statistics/3m", input: "" },
  statistics6m: { path: "/api/v1/statistics/6m", input: "" },
  statistics1y: { path: "/api/v1/statistics/1y", input: "" },
  statistics2y: { path: "/api/v1/statistics/2y", input: "" },
  statistics3y: { path: "/api/v1/statistics/3y", input: "" },
  statistics4y: { path: "/api/v1/statistics/4y", input: "" },
  statisticsAll: { path: "/api/v1/statistics/all", input: "" },
  lightningNodesWorld: { path: "/api/v1/lightning/nodes/world", input: "" },
  lightningNodesCountry: { path: "/api/v1/lightning/nodes/country/{country}", input: "country" },
  lightningNodesIsp: { path: "/api/v1/lightning/nodes/isp/{isp}", input: "isp" },
  lightningNodesGroup: { path: "/api/v1/lightning/nodes/group/{group}", input: "group" },

  bitcoinTreasuries: { path: "/api/v1/treasuries", input: "" },
  publicWallet: { path: "/api/v1/wallet/{walletId}", input: "walletId" },
  backendInfo: { path: "/api/v1/backend-info", input: "" },
  feeEstimates: { path: "/api/v1/fee-estimates", input: "" },
  initData: { path: "/api/v1/init-data", input: "" },
  blocksAtHeight: { path: "/api/v1/blocks/{height}", input: "height" },
  blockTxSummary: { path: "/api/v1/block/{hash}/tx/{txid}/summary", input: "hash,txid" },
  blockTxAudit: { path: "/api/v1/block/{hash}/tx/{txid}/audit", input: "hash,txid" },
  staleTipsByHeight: { path: "/api/v1/stale-tips/{height}", input: "height" },
  miningBlockAuditScoresByHeight: { path: "/api/v1/mining/blocks/audit/scores/{height}", input: "height" },
  miningPoolBlocksByHeight: { path: "/api/v1/mining/pool/{slug}/blocks/{height}", input: "slug,height" },
  miningDifficultyAdjustments: { path: "/api/v1/mining/difficulty-adjustments", input: "" },
  lightningLatestStats: { path: "/api/v1/lightning/statistics/latest", input: "" },
  // Lightning search requires a validated query parameter and is tracked separately.
  accelerationHistoryAggregated: { path: "/api/v1/services/accelerator/accelerations/history/aggregated", input: "" },
  accelerationStats: { path: "/api/v1/services/accelerator/accelerations/stats", input: "" },
  accelerationTransaction: { path: "/api/v1/services/accelerator/accelerations/{txid}", input: "txid" },
  // Binary block data requires a separate, size-limited handler.
  blockTransactionsFirstPage: { path: "/api/block/{hash}/txs", input: "hash" },
  // Unbounded txid lists are intentionally not exposed through the public proxy.
  addressValidation: { path: "/api/v1/validate-address/{address}", input: "address" },
  blockHeader: { path: "/api/block/{hash}/header", input: "hash" },
  blockTransactionIds: { path: "/api/block/{hash}/txids", input: "hash" },
  blockV1: { path: "/api/v1/block/{hash}", input: "hash" },
  latestBlocksV1: { path: "/api/v1/blocks", input: "" },
  blockByTimestamp: { path: "/api/v1/mining/blocks/timestamp/{timestamp}", input: "timestamp" },
  transactionRbfReplacements: { path: "/api/v1/replacements", input: "" },
  fullRbfReplacements: { path: "/api/v1/fullrbf/replacements", input: "" },
  preciseFees: { path: "/api/v1/fees/precise", input: "" },
  price: { path: "/api/v1/prices", input: "" },
  miningDifficultyHistory: { path: "/api/v1/mining/difficulty-adjustments/{interval}", input: "interval" },
  miningPoolDetails: { path: "/api/v1/mining/pool/{slug}", input: "slug" },
  miningPoolHashrate: { path: "/api/v1/mining/pool/{slug}/hashrate", input: "slug" },
  miningPoolBlocks: { path: "/api/v1/mining/pool/{slug}/blocks", input: "slug" },
  miningPoolsHashrate: { path: "/api/v1/mining/hashrate/pools/{period}", input: "period" },
  miningBlocksFees: { path: "/api/v1/mining/blocks/fees/{period}", input: "period" },
  miningBlocksRewards: { path: "/api/v1/mining/blocks/rewards/{period}", input: "period" },
  miningBlocksFeeRates: { path: "/api/v1/mining/blocks/fee-rates/{period}", input: "period" },
  miningBlocksSizesWeights: { path: "/api/v1/mining/blocks/sizes-weights/{period}", input: "period" },
  lightningNetworkStats: { path: "/api/v1/lightning/statistics/{interval}", input: "interval" },
  lightningCountryStats: { path: "/api/v1/lightning/nodes/countries", input: "" },
  lightningIspRankings: { path: "/api/v1/lightning/nodes/isp-ranking", input: "" },
  lightningNodeRankings: { path: "/api/v1/lightning/nodes/rankings", input: "" },
  lightningNodeLiquidityRankings: { path: "/api/v1/lightning/nodes/rankings/liquidity", input: "" },
  lightningNodeConnectivityRankings: { path: "/api/v1/lightning/nodes/rankings/connectivity", input: "" },
  lightningNodeAgeRankings: { path: "/api/v1/lightning/nodes/rankings/age", input: "" },
  lightningNode: { path: "/api/v1/lightning/nodes/{pubkey}", input: "pubkey" },
  lightningNodeHistory: { path: "/api/v1/lightning/nodes/{pubkey}/statistics", input: "pubkey" },
  lightningNodeGeodata: { path: "/api/v1/lightning/channels-geo/{pubkey}", input: "pubkey" },
  lightningGeodata: { path: "/api/v1/lightning/channels-geo", input: "" },
  accelerationPending: { path: "/api/v1/services/accelerator/accelerations", input: "" },
  accelerationHistory: { path: "/api/v1/services/accelerator/accelerations/history", input: "" },
  miningPoolList: { path: "/api/v1/mining/pools", input: "" },
  miningRewardStats: { path: "/api/v1/mining/reward-stats/{blockCount}", input: "blockCount" },
  miningBlocksFeesTimespan: { path: "/api/v1/mining/blocks/fees", input: "" },
  miningBlocksFeeRatesPrecise: { path: "/api/v1/mining/blocks/fee-rates/{period}/precise", input: "period" },
  miningBlocksPredictions: { path: "/api/v1/mining/blocks/predictions/{period}", input: "period" },
  miningBlockAuditScores: { path: "/api/v1/mining/blocks/audit/scores", input: "" },
  miningBlockAuditScore: { path: "/api/v1/mining/blocks/audit/score/{hash}", input: "hash" },
  miningBlockAudit: { path: "/api/v1/mining/blocks/audit/{hash}", input: "hash" },
  historicalPrice: { path: "/api/v1/historical-price", input: "" },
  accelerationTotals: { path: "/api/v1/accelerations/total", input: "" },
  accelerationActive: { path: "/api/v1/accelerations", input: "" },
  accelerationPool: { path: "/api/v1/accelerations/pool/{slug}", input: "slug" },
  accelerationBlock: { path: "/api/v1/accelerations/block/{height}", input: "height" },
  accelerationRecent: { path: "/api/v1/accelerations/recent/{period}", input: "period" },
  blockSummary: { path: "/api/v1/block/{hash}/summary", input: "hash" },
  blockAuditSummary: { path: "/api/v1/block/{hash}/audit-summary", input: "hash" },
  chainTips: { path: "/api/v1/chain-tips", input: "" },
  staleTips: { path: "/api/v1/stale-tips", input: "" },
  blockBulk: { path: "/api/v1/blocks-bulk/{height}", input: "height" },
  addressTransactionSummary: { path: "/api/v1/address/{address}/txs/summary", input: "address" },
  transactionCached: { path: "/api/v1/tx/{txid}/cached", input: "txid" },
  transactionTimes: { path: "/api/v1/transaction-times", input: "" },
  transaction: { path: "/api/tx/{txid}", input: "txid" },
  transactionStatus: { path: "/api/tx/{txid}/status", input: "txid" },
  transactionHex: { path: "/api/tx/{txid}/hex", input: "txid" },
  transactionOutspends: { path: "/api/tx/{txid}/outspends", input: "txid" },
  transactionMerkleProof: { path: "/api/tx/{txid}/merkle-proof", input: "txid" },
  transactionCpfp: { path: "/api/v1/cpfp/{txid}", input: "txid" },
  transactionRbf: { path: "/api/v1/tx/{txid}/rbf", input: "txid" },
  address: { path: "/api/address/{address}", input: "address" },
  addressTransactions: { path: "/api/address/{address}/txs", input: "address" },
  addressUtxos: { path: "/api/address/{address}/utxo", input: "address" },
  block: { path: "/api/block/{hash}", input: "hash" },
  blockTransactions: { path: "/api/block/{hash}/txs/{index}", input: "hash,index" },
  blockHashByHeight: { path: "/api/block-height/{height}", input: "height" },
  latestBlocks: { path: "/api/blocks", input: "" },
  chainTipHeight: { path: "/api/blocks/tip/height", input: "" },
  chainTipHash: { path: "/api/blocks/tip/hash", input: "" },
  mempoolStats: { path: "/api/mempool", input: "" },
  mempoolRecent: { path: "/api/mempool/recent", input: "" },
  recommendedFees: { path: "/api/v1/fees/recommended", input: "" },
  projectedBlocks: { path: "/api/v1/fees/mempool-blocks", input: "" },
  difficultyAdjustment: { path: "/api/v1/difficulty-adjustment", input: "" },
  hashrate: { path: "/api/v1/mining/hashrate/1m", input: "" },
  miningPools: { path: "/api/v1/mining/pools/1w", input: "" },
  recentBlocks: { path: "/api/v1/blocks", input: "" },
} as const;

export type BitcoinDataset = keyof typeof bitcoinDatasets;

export class BitcoinUpstreamError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const validators: Record<string, RegExp> = {
  txid: /^[a-fA-F0-9]{64}$/,
  hash: /^[a-fA-F0-9]{64}$/,
  address: /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,87})$/i,
  height: /^\d{1,8}$/,
  index: /^\d{1,8}$/,
  timestamp: /^\d{9,11}$/,
  blockCount: /^\d{1,6}$/,
  interval: /^(?:latest|24h|3d|1w|1m|3m|6m|1y|2y|3y)$/,
  period: /^(?:24h|3d|1w|1m|3m|6m|1y|2y|3y)$/,
  slug: /^[a-zA-Z0-9_-]{1,80}$/,
  pubkey: /^[a-fA-F0-9]{66}$/,
  channel: /^\d{1,20}$/,
  walletId: /^[a-zA-Z0-9_-]{1,100}$/,
  country: /^[a-zA-Z]{2}$/,
  isp: /^\d{1,12}$/,
  group: /^[a-zA-Z0-9_-]{1,60}$/,
  search: /^[a-zA-Z0-9:_-]{1,80}$/,
  shortId: /^[a-zA-Z0-9x:_-]{1,80}$/,
};

export async function fetchBitcoinDataset(
  dataset: BitcoinDataset,
  parameters: Record<string, string> = {},
): Promise<unknown> {
  const spec = bitcoinDatasets[dataset];
  if (!spec) throw new BitcoinUpstreamError(400, "Unknown Bitcoin dataset");
  let path: string = spec.path;
  for (const name of spec.input.split(",").filter(Boolean)) {
    const value = parameters[name] ?? "";
    if (!validators[name]?.test(value)) {
      throw new BitcoinUpstreamError(400, `Invalid ${name}`);
    }
    path = path.replace(`{${name}}`, encodeURIComponent(value));
  }
  const response = await fetch(`${mempoolBaseUrl()}${path}`, {
    headers: { accept: "application/json, text/plain" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 15 },
  });
  if (!response.ok) {
    throw new BitcoinUpstreamError(
      response.status === 404 ? 404 : 502,
      response.status === 404 ? "Data unavailable from Bitcoin provider" : "Bitcoin provider temporarily unavailable",
    );
  }
  const raw = await response.text();
  if (raw.length > 2_000_000) throw new BitcoinUpstreamError(502, "Upstream response too large");
  try { return JSON.parse(raw); } catch { return raw; }
}
