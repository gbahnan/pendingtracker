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
    const precise = await fetchJson<FeeRecommendations>(`${mempoolBaseUrl()}/api/v1/fees/recommended/precise`);
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
