"use client";

import { useEffect, useState } from "react";

type Coin = {
  rank: number;
  name: string;
  symbol: string;
  priceUsd: number | null;
  change24hPct: number | null;
};

function fmtMoney(n: number | null) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function fmtPct(n: number | null) {
  if (n === null || n === undefined) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function PriceStrip() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [provider, setProvider] = useState<string>("");

  async function load() {
    try {
      const res = await fetch("/api/market/top10", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCoins(Array.isArray(data.coins) ? data.coins : []);
      setProvider(typeof data.provider === "string" ? data.provider : "");
    } catch {
      // ignore transient errors
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="badge">Live prices (Top 10)</div>
        <div className="small">Source: {provider || "—"}</div>
      </div>

      <div style={{ height: 10 }} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {coins.length === 0 ? (
          <div className="small">Loading…</div>
        ) : (
          coins.map((c) => (
            <div key={c.symbol} className="badge" style={{ padding: "8px 10px" }}>
              <b>{c.symbol}</b> {fmtMoney(c.priceUsd)} · {fmtPct(c.change24hPct)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
