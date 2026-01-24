"use client";

import { useMemo, useState } from "react";
import { isLikelyTxid } from "@/lib/btc/validate";

function isLikelyEthTxHash(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test((s || "").trim());
}

export default function Page() {
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clean = q.trim();
  const isBtc = useMemo(() => isLikelyTxid(clean), [clean]);
  const isEth = useMemo(() => isLikelyEthTxHash(clean), [clean]);

  function go() {
    if (isEth) return (window.location.href = `/eth/${clean}`);
    if (isBtc) return (window.location.href = `/btc/${clean}`);
    setError("Paste a BTC txid (64 chars) or an ETH tx hash (starts with 0x, 66 chars).");
  }

  return (
    <>
      <div className="h1">Pending Tracker</div>
      <p className="p">Paste a Bitcoin txid or an Ethereum transaction hash. We’ll explain what’s happening in plain English.</p>

      <div className="row">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="BTC txid (64 chars) OR ETH tx hash (0x…)"
          spellCheck={false}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
        <button className="button" onClick={go} disabled={!clean}>
          Explain
        </button>
      </div>

      <div style={{ height: 12 }} />
      {error && (
        <div className="card">
          <div className="badge">Error</div>
          <div style={{ height: 8 }} />
          <div>{error}</div>
        </div>
      )}
    </>
  );
}
