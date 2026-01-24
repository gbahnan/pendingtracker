import { NextResponse } from "next/server";

export const runtime = "edge";

function toNum(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    // BTC: mempool.space recent mempool txs
    const btcUrl = "https://mempool.space/api/mempool/recent";
    const btcRes = await fetch(btcUrl);
    const btcJson = btcRes.ok ? await btcRes.json() : [];

    const btc = Array.isArray(btcJson)
      ? btcJson.slice(0, 10).map((t: any) => {
          const fee = toNum(t.fee);
          const vsize = toNum(t.vsize);
          const feerate = fee !== null && vsize !== null && vsize > 0 ? fee / vsize : null;

          return {
            chain: "BTC",
            hash: String(t.txid ?? ""),
            feeSats: fee,
            vsize,
            feeRateSatVb: feerate ? Math.round(feerate * 10) / 10 : null,
            valueSats: toNum(t.value),
            firstSeen: toNum(t.time ?? t.firstSeen ?? null), // not always present
          };
        })
      : [];

    // ETH: Blockscout v2 transactions list
    // docs show /api/v2/transactions and items_count param usage
    const ethUrl = "https://eth.blockscout.com/api/v2/transactions?items_count=10";
    const ethRes = await fetch(ethUrl);
    const ethJson = ethRes.ok ? await ethRes.json() : null;

    const items = ethJson?.items ?? ethJson?.result ?? ethJson ?? [];
    const eth = Array.isArray(items)
      ? items.slice(0, 10).map((t: any) => ({
          chain: "ETH",
          hash: String(t.hash ?? t.transaction_hash ?? t.tx_hash ?? ""),
          from: String(t.from?.hash ?? t.from ?? ""),
          to: String(t.to?.hash ?? t.to ?? ""),
          valueWei: String(t.value ?? t.value_wei ?? "0"),
          timestamp: String(t.timestamp ?? t.time ?? t.inserted_at ?? ""),
        }))
      : [];

    const out = NextResponse.json(
      {
        fetchedAtIso: new Date().toISOString(),
        btc,
        eth,
      },
      { status: 200 }
    );

    // Cache on Vercel edge a tiny bit so you don't spam upstream APIs
    out.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
    return out;
  } catch {
    return NextResponse.json({ error: "Feed failed." }, { status: 502 });
  }
}

