import { NextRequest, NextResponse } from "next/server";
import { mempoolBaseUrl } from "../../../../../../lib/btc/providers/mempool";

export const dynamic = "force-dynamic";
const TXID = /^[0-9a-fA-F]{64}$/;
const paths = {
  transaction: (id: string) => `/api/tx/${id}`,
  status: (id: string) => `/api/tx/${id}/status`,
  outspends: (id: string) => `/api/tx/${id}/outspends`,
  cpfp: (id: string) => `/api/v1/cpfp/${id}`,
  rbf: (id: string) => `/api/v1/tx/${id}/rbf`,
  merkleProof: (id: string) => `/api/tx/${id}/merkle-proof`,
};
type Result = { available: boolean; data?: unknown; status?: number };
async function request(path: string): Promise<Result> {
  try {
    const response = await fetch(`${mempoolBaseUrl()}${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 10 },
    });
    if (!response.ok) return { available: false, status: response.status };
    return { available: true, data: await response.json() };
  } catch { return { available: false }; }
}
export async function GET(_request: NextRequest, { params }: { params: { txid: string } }) {
  const txid = params.txid;
  if (!TXID.test(txid)) return NextResponse.json({ error: "Invalid Bitcoin transaction ID" }, { status: 400 });
  const entries = await Promise.all(Object.entries(paths).map(async ([name, fn]) => [name, await request(fn(txid))] as const));
  const sources = Object.fromEntries(entries);
  if (!sources.transaction?.available) return NextResponse.json({ error: "Transaction unavailable", sources }, { status: 404 });
  return NextResponse.json({ txid, provider: "mempool", mode: "public-api-proof-of-concept", sources }, { headers: { "Cache-Control": "no-store" } });
}
