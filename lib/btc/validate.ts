export function isLikelyTxid(s: string): boolean {
  // txid: 32 bytes hex => 64 hex chars
  return /^[0-9a-fA-F]{64}$/.test((s || "").trim());
}
