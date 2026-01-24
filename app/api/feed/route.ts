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
    const btcRes = await fetch(btcUrl, { cache: "no-store" });
    const btcJson = btcRes.ok ? await btcRes.json() : [];

    const btc = Array.isArray(btcJson)
      ? btcJson.slice(0, 12).map((t: any) => {
          const fee = toNum(t.fee);
          const vsize = toNum(t.vsize);
          const feerate = fee !== null && vsize !== null && vsize > 0 ? fee / vsize : null;

          return {
            chain: "BTC" as const,
            hash: String(t.txid ?? ""),
            feeRateSatVb: feerate ? Math.round(feerate * 10) / 10 : null,
          };
        })
      : [];

    // ETH: Blockscout v2 transaction list
    const ethUrl = "https://eth.blockscout.com/api/v2/transactions?items_count=12";
    const ethRes = await fetch(ethUrl, { cache: "no-store" });
    const ethJson = ethRes.ok ? await ethRes.json() : null;

    const items = (ethJson as any)?.items ?? [];
    const eth = Array.isArray(items)
      ? items.slice(0, 12).map((t: any) => ({
          chain: "ETH" as const,
          hash: String(t.hash ?? ""),
          valueWei: String(t.value ?? "0"),
        }))
      : [];

    const out = NextResponse.json(
      { fetchedAtIso: new Date().toISOString(), btc, eth },
      { status: 200 }
    );

    out.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
    return out;
  } catch {
    return NextResponse.json({ error: "Feed failed." }, { status: 502 });
  }
}
