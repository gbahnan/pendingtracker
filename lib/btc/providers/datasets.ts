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
  transaction: { path: "/api/tx/{txid}", input: "txid" },
  transactionStatus: { path: "/api/tx/{txid}/status", input: "txid" },
  transactionHex: { path: "/api/tx/{txid}/hex", input: "txid" },
  transactionOutspends: { path: "/api/tx/{txid}/outspends", input: "txid" },
  transactionMerkleProof: { path: "/api/tx/{txid}/merkle-proof", input: "txid" },
  transactionCpfp: { path: "/api/v1/cpfp/{txid}", input: "txid" },
  transactionRbf: { path: "/api/v1/tx/{txid}/rbf", input: "txid" },
  address: { path: "/api/address/{address}", input: "address" },
  addressTransactions: { path: "/api/address/{address}/txs", input: "address" },
  addressMempool: { path: "/api/address/{address}/txs/mempool", input: "address" },
  addressUtxos: { path: "/api/address/{address}/utxo", input: "address" },
  block: { path: "/api/block/{hash}", input: "hash" },
  blockStatus: { path: "/api/block/{hash}/status", input: "hash" },
  blockTransactions: { path: "/api/block/{hash}/txs/{index}", input: "hash,index" },
  blockHashByHeight: { path: "/api/block-height/{height}", input: "height" },
  latestBlocks: { path: "/api/blocks", input: "" },
  chainTipHeight: { path: "/api/blocks/tip/height", input: "" },
  chainTipHash: { path: "/api/blocks/tip/hash", input: "" },
  mempoolStats: { path: "/api/mempool", input: "" },
  mempoolRecent: { path: "/api/mempool/recent", input: "" },
  mempoolTxids: { path: "/api/mempool/txids", input: "" },
  recommendedFees: { path: "/api/v1/fees/recommended", input: "" },
  feeHistory: { path: "/api/v1/fees/mempool-blocks", input: "" },
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
