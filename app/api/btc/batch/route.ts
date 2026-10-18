import { NextResponse } from "next/server";
import { mempoolBaseUrl } from "@/lib/btc/providers/mempool";

export const runtime = "edge";

const TXID = /^[a-f0-9]{64}$/i;

/**
 * Source-verified Mempool routes:
 * - GET /api/v1/transaction-times?txId[]=... (up to 100 txids)
 * - GET /api/txs/outspends?txids=... (up to 50 txids)
 *
 * Deliberately caps requests more tightly than upstream to avoid accidental
 * high-volume traffic on the public provider.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  if (kind !== "firstSeen" && kind !== "outspends") {
    return NextResponse.json({ error: "Unknown batch dataset" }, { status: 400 });
  }

  const raw = url.searchParams.get("txids") || "";
  const txids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const max = kind === "firstSeen" ? 20 : 10;
  if (txids.length < 1 || txids.length > max || txids.some((txid) => !TXID.test(txid))) {
    return NextResponse.json({ error: `Provide 1-${max} valid transaction IDs` }, { status: 400 });
  }

  const upstream = new URL(
    kind === "firstSeen" ? "/api/v1/transaction-times" : "/api/txs/outspends",
    mempoolBaseUrl(),
  );
  if (kind === "firstSeen") {
    for (const txid of txids) upstream.searchParams.append("txId[]", txid);
  } else {
    upstream.searchParams.set("txids", txids.join(","));
  }

  try {
    const response = await fetch(upstream.toString(), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 15 },
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Bitcoin data temporarily unavailable" }, { status: 502 });
    }
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 1_000_000) {
      return NextResponse.json({ error: "Response too large" }, { status: 502 });
    }
    const body = await response.text();
    if (body.length > 1_000_000) {
      return NextResponse.json({ error: "Response too large" }, { status: 502 });
    }
    return NextResponse.json({ kind, txids, data: JSON.parse(body) }, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ error: "Bitcoin data provider unavailable" }, { status: 502 });
  }
}
