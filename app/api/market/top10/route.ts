import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const cgKey = process.env.COINGECKO_DEMO_KEY;

  try {
    // --- CoinGecko (optional key) ---
    if (cgKey) {
      const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
      url.searchParams.set("vs_currency", "usd");
      url.searchParams.set("order", "market_cap_desc");
      url.searchParams.set("per_page", "10");
      url.searchParams.set("page", "1");
      url.searchParams.set("sparkline", "false");
      url.searchParams.set("price_change_percentage", "24h");

      const res = await fetch(url.toString(), {
        headers: { accept: "application/json", "x-cg-demo-api-key": cgKey },
        cache: "no-store",
      });

      if (res.ok) {
        const raw = await res.json();
        const coins = Array.isArray(raw)
          ? raw.map((c: any) => ({
              rank: c.market_cap_rank,
              name: c.name,
              symbol: String(c.symbol ?? "").toUpperCase(),
              priceUsd: c.current_price ?? null,
              change24hPct: c.price_change_percentage_24h ?? null,
            }))
          : [];

        const out = NextResponse.json(
          { provider: "CoinGecko", fetchedAtIso: new Date().toISOString(), coins },
          { status: 200 }
        );
        out.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
        return out;
      }
    }

    // --- Fallback: CoinPaprika (no key) ---
    const papRes = await fetch("https://api.coinpaprika.com/v1/tickers?quotes=USD", { cache: "no-store" });
    if (!papRes.ok) throw new Error("CoinPaprika failed");
    const pap = await papRes.json();

    const coins = Array.isArray(pap)
      ? pap
          .sort((a: any, b: any) => (a.rank ?? 999999) - (b.rank ?? 999999))
          .slice(0, 10)
          .map((c: any) => ({
            rank: c.rank,
            name: c.name,
            symbol: String(c.symbol ?? "").toUpperCase(),
            priceUsd: c.quotes?.USD?.price ?? null,
            change24hPct: c.quotes?.USD?.percent_change_24h ?? null,
          }))
      : [];

    const out = NextResponse.json(
      { provider: "CoinPaprika", fetchedAtIso: new Date().toISOString(), coins },
      { status: 200 }
    );
    out.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return out;
  } catch {
    return NextResponse.json({ error: "Price lookup failed." }, { status: 502 });
  }
}
