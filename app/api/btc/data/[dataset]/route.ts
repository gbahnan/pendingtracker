import { NextResponse } from "next/server";
import { bitcoinDatasets, BitcoinDataset, BitcoinUpstreamError, fetchBitcoinDataset } from "@/lib/btc/providers/datasets";

export const runtime = "edge";

/** Safe, read-only dataset access. Existing pages are not changed. */
export async function GET(request: Request, { params }: { params: { dataset: string } }) {
  const dataset = params.dataset;
  if (!Object.prototype.hasOwnProperty.call(bitcoinDatasets, dataset)) {
    return NextResponse.json({ error: "Unknown Bitcoin dataset" }, { status: 404 });
  }
  const url = new URL(request.url);
  const args: Record<string, string> = {};
  for (const key of ["txid", "hash", "address", "height", "index", "timestamp", "interval", "period", "slug", "pubkey", "channel", "blockCount", "country", "isp", "group", "search", "shortId", "walletId", "prefix", "scripthash", "from", "to"]) {
    const value = url.searchParams.get(key);
    if (value !== null) args[key] = value;
  }
  try {
    const data = await fetchBitcoinDataset(dataset as BitcoinDataset, args);
    return NextResponse.json({ dataset, data, provider: "mempool" }, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (error) {
    const status = error instanceof BitcoinUpstreamError ? error.status : 502;
    return NextResponse.json({ error: status === 400 ? "Invalid query parameters" : status === 404 ? "Dataset not available" : "Bitcoin data provider unavailable" }, { status });
  }
}
