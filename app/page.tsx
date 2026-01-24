"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isLikelyTxid } from "@/lib/btc/validate";

import PriceStrip from "@/app/components/price-strip";
import ActivityFeed from "@/app/components/activity-feed";

function isLikelyEthHash(s: string) {
  const v = (s || "").trim();
  return /^0x[a-fA-F0-9]{64}$/.test(v);
}

export default function Page() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmed = q.trim();
  const looksBtc = useMemo(() => isLikelyTxid(trimmed), [trimmed]);
  const looksEth = useMemo(() => isLikelyEthHash(trimmed), [trimmed]);
  const canSubmit = looksBtc || looksEth;

  function go() {
    if (!canSubmit) {
      setError("Paste a BTC txid (64 hex) or an ETH tx hash (0x + 64 hex).");
      return;
    }
    setError(null);

    if (looksEth) router.push(`/eth/${trimmed}`);
    else router.push(`/btc/${trimmed}`);
  }

  return (
    <>
      <div className="h1">Pending Tracker</div>
      <p className="p">
        Paste a BTC txid or an ETH transaction hash. You’ll get a plain-English status + what to do next.
      </p>

      <div className="row">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="BTC txid (64 hex) or ETH hash (0x + 64 hex)…"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === "Enter") go();
          }}
        />
        <button className="button" onClick={go} disabled={!canSubmit}>
          Track
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

      <div style={{ height: 14 }} />

      <PriceStrip />
      <div style={{ height: 14 }} />
      <ActivityFeed />
    </>
  );
}
