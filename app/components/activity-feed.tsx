"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BtcItem = {
  chain: "BTC";
  hash: string;
  feeRateSatVb: number | null;
};

type EthItem = {
  chain: "ETH";
  hash: string;
  valueWei: string;
};

function shortHash(h: string) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

function weiToEth(wei: string) {
  try {
    const w = BigInt(wei || "0");
    const whole = w / 10n ** 18n;
    const frac = w % 10n ** 18n;
    const fracStr = frac.toString().padStart(18, "0").slice(0, 4);
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return "0.0000";
  }
}

export default function ActivityFeed() {
  const [btc, setBtc] = useState<BtcItem[]>([]);
  const [eth, setEth] = useState<EthItem[]>([]);

  async function load() {
    const res = await fetch("/api/feed", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setBtc((data.btc ?? []).slice(0, 8));
    setEth((data.eth ?? []).slice(0, 8));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <div className="badge">Live BTC activity</div>
        <div style={{ height: 10 }} />
        {btc.map((t) => (
          <div key={t.hash} className="kv" style={{ alignItems: "baseline" }}>
            <div className="k">
              <Link href={`/btc/${t.hash}`}>{shortHash(t.hash)}</Link>
            </div>
            <div className="small">{t.feeRateSatVb ? `${t.feeRateSatVb} sat/vB` : "—"}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="badge">Live ETH activity</div>
        <div style={{ height: 10 }} />
        {eth.map((t) => (
          <div key={t.hash} className="kv" style={{ alignItems: "baseline" }}>
            <div className="k">
              <Link href={`/eth/${t.hash}`}>{shortHash(t.hash)}</Link>
            </div>
            <div className="small">{weiToEth(t.valueWei)} ETH</div>
          </div>
        ))}
      </div>
    </div>
  );
}

