import { FeeRecommendations, MempoolTx, TxStatus } from "../types";

const DEFAULT_BASE = "https://mempool.space";

/**
 * Uses the public mempool.space API by default.
 * You can point this at your own instance later (recommended for scale + privacy).
 */
export function mempoolBaseUrl(): string {
  const env = process.env.MEMPOOL_BASE_URL || process.env.NEXT_PUBLIC_MEMPOOL_BASE_URL || DEFAULT_BASE;
  return env.replace(/\/$/, "");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "accept": "application/json",
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(7000),
    // Next.js fetch caching:
    // - We want near-real-time, but we *do* want caching to reduce provider load.
    next: { revalidate: 10 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} :: ${text.slice(0, 180)}`);
  }
  return (await res.json()) as T;
}

export async function getTx(txid: string): Promise<MempoolTx> {
  const url = `${mempoolBaseUrl()}/api/tx/${txid}`;
  return fetchJson<MempoolTx>(url);
}

export async function getTxStatus(txid: string): Promise<TxStatus> {
  const url = `${mempoolBaseUrl()}/api/tx/${txid}/status`;
  return fetchJson<TxStatus>(url);
}

export async function getRecommendedFees(): Promise<FeeRecommendations> {
  // Mempool derives precise recommendations from projected blocks and mempool minimums.
  // Prefer their own calculated result instead of locally reconstructing fee thresholds.
  // The precise endpoint may not be enabled on every Mempool-compatible instance.
  try {
    const precise = await fetchJson<FeeRecommendations>(`${mempoolBaseUrl()}/api/v1/fees/precise`);
    if (precise && [precise.fastestFee, precise.halfHourFee, precise.hourFee, precise.economyFee, precise.minimumFee].every(v => typeof v === "number" && Number.isFinite(v) && v >= 0)) return precise;
  } catch { /* Fall back to the broadly supported endpoint. */ }
  return fetchJson<FeeRecommendations>(`${mempoolBaseUrl()}/api/v1/fees/recommended`);
}

/** Mempool CPFP cluster data is optional: never fail a transaction lookup if absent. */
export async function getCpfpInfo(txid: string): Promise<Record<string, unknown> | null> {
  try {
    const data = await fetchJson<Record<string, unknown>>(`${mempoolBaseUrl()}/api/v1/cpfp/${txid}`);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch { return null; }
}

/** Mempool retains replacement history for RBF transactions when available. */
export async function getRbfHistory(txid: string): Promise<unknown | null> {
  try { return await fetchJson<unknown>(`${mempoolBaseUrl()}/api/v1/tx/${txid}/rbf`); }
  catch { return null; }
}

/** Use Mempool address validation instead of relying only on regex shape checks. */
export async function validateBtcAddress(address: string): Promise<{ isvalid?: boolean; isValid?: boolean; address?: string } | null> {
  try { return await fetchJson<{ isvalid?: boolean; isValid?: boolean; address?: string }>(`${mempoolBaseUrl()}/api/v1/validate-address/${encodeURIComponent(address)}`); }
  catch { return null; }
}

/** Check whether a transaction output has already been spent. */
export async function getTxOutspends(txid: string): Promise<Array<{ spent: boolean; txid?: string; vin?: number }> | null> {
  try {
    const result = await fetchJson<Array<{ spent: boolean; txid?: string; vin?: number }>>(`${mempoolBaseUrl()}/api/tx/${txid}/outspends`);
    return Array.isArray(result) ? result : null;
  } catch { return null; }
}

/** First-seen timestamp is best-effort: the provider may not retain it. */
export async function getTxFirstSeen(txid: string): Promise<number | null> {
  try {
    const value = await fetchJson<unknown>(`${mempoolBaseUrl()}/api/v1/tx/${txid}/first-seen`);
    // Do not infer a timestamp from an undocumented or unrelated response.
    return typeof value === "number" && Number.isSafeInteger(value) && value > 1_000_000_000 ? value : null;
  } catch { return null; }
}

/** Merkle proof is available only for confirmed transactions. */
export async function getTxMerkleProof(txid: string): Promise<{block_height:number;merkle:string[];pos:number}|null> {
  try {
    const proof=await fetchJson<unknown>(`${mempoolBaseUrl()}/api/tx/${txid}/merkle-proof`);
    if(!proof||typeof proof!=="object"||Array.isArray(proof))return null;
    const p=proof as Record<string,unknown>;
    if(!Number.isSafeInteger(p.block_height)||!Number.isSafeInteger(p.pos)||!Array.isArray(p.merkle)||!p.merkle.every(x=>typeof x==="string"&&/^[0-9a-f]{64}$/i.test(x)))return null;
    return {block_height:p.block_height as number,pos:p.pos as number,merkle:p.merkle as string[]};
  } catch {return null;}
}
