"use client";

import { useEffect, useMemo, useState } from "react";

function isLikelyEthHash(s: string) {
  return /^0x[a-fA-F0-9]{64}$/.test((s || "").trim());
}

function shortHash(h: string) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

// No BigInt needed
function weiToEth(wei: string) {
  const raw = (wei || "0").toString().replace(/[^\d]/g, "");
  const s = raw.replace(/^0+/, "") || "0";

  if (s.length <= 18) {
    const frac = s.padStart(18, "0").slice(0, 4);
    return `0.${frac}`;
  }

  const whole = s.slice(0, -18);
  const frac = s.slice(-18).padEnd(18, "0").slice(0, 4);
  return `${whole}.${frac}`;
}

export default function EthTxPage({ params }: { params: { hash: string } }) {
  const hash = params.hash ?? "";
  const ok = useMemo(() => isLikelyEthHash(hash), [hash]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eth/tx/${hash}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error || "Request failed.");
        setData(null);
      } else {
        setData(j);
      }
    } catch (e: any) {
      setError(e?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, ok]);

  if (!ok) {
    return (
      <div className="card">
        <div className="badge">Invalid ETH hash</div>
        <div style={{ height: 8 }} />
        <div className="small">An ETH hash looks like 0x + 64 hex characters.</div>
      </div>
    );
  }

  const confirmed = Boolean(data?.confirmed ?? (Number(data?.confirmations ?? 0) > 0));

  return (
    <>
      <div className="h1">ETH Transaction</div>
      <div className="small">
        Auto-refreshing every ~15 seconds.{" "}
        <button className="button" style={{ padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh now"}
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

      {data && (
        <div className="grid">
          <div className="card">
            <div className="badge">Plain-English</div>
            <div style={{ height: 10 }} />
            <div style={{ fontWeight: 800 }}>{confirmed ? "Confirmed on Ethereum" : "Pending on Ethereum"}</div>

            <div style={{ height: 8 }} />
            <ul>
              <li>Ethereum transactions can wait if the network is busy and the fee is low.</li>
              <li>Many wallets have “Speed Up” or “Cancel” options.</li>
              <li>If confirmed, you may still wait for extra confirmations if needed.</li>
            </ul>

            <div style={{ height: 12 }} />
            <div className="small">Educational only. No custody, no execution, no financial advice.</div>
          </div>

          <div className="card">
            <div className="badge">Numbers (for reference)</div>
            <div style={{ height: 12 }} />
            <div className="kv"><div className="k">hash</div><div><code>{shortHash(hash)}</code></div></div>
            <div className="kv"><div className="k">from</div><div className="small">{shortHash(String(data.from ?? ""))}</div></div>
            <div className="kv"><div className="k">to</div><div className="small">{shortHash(String(data.to ?? ""))}</div></div>
            <div className="kv"><div className="k">value</div><div>{weiToEth(String(data.value ?? "0"))} ETH</div></div>
            <div className="kv"><div className="k">confirmations</div><div>{String(data.confirmations ?? (confirmed ? 1 : 0))}</div></div>
          </div>
        </div>
      )}
    </>
  );
}
