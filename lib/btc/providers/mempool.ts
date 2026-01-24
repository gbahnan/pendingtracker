import { FeeRecommendations, MempoolTx, TxStatus } from "../types";

const DEFAULT_BASE = "https://mempool.space";

/**
 * Uses the public mempool.space API by default.
 * You can point this at your own instance later (recommended for scale + privacy).
 */
export function mempoolBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_MEMPOOL_BASE_URL || DEFAULT_BASE;
  return env.replace(/\/$/, "");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "accept": "application/json",
      ...(init?.headers || {}),
    },
    // Next.js fetch caching:
    // - We want near-real-time, but we *do* want caching to reduce provider load.
    next: { revalidate: 15 },
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
  // Documented endpoint used by many projects and client libraries.
  const url = `${mempoolBaseUrl()}/api/v1/fees/recommended`;
  return fetchJson<FeeRecommendations>(url);
}
