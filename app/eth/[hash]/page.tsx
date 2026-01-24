"use client";

import { useEffect, useMemo, useState } from "react";

function isLikelyEthHash(s: string) {
  return /^0x[a-fA-F0-9]{64}$/.test((s || "").trim());
}

function shortHash(h: string) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

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
        <div className="small">An ETH transaction hash looks like 0x + 64 hex characters.</div>
      </div>
    );
  }

  const confirmed = Boolean(data?.confirmed ?? (Number(data?.confirmations ?? 0) > 0));

  return (
    <>
      <div className="h1">Ethereum Transaction</div>
      <p className="p">
        This page auto-refreshes every ~15 seconds.{" "}
        <button className="button" style={{ padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh now"}
        </button>
      </p>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="badge">Status</div>
          <div className="badge">{confirmed ? "Confirmed" : "Pending"}</div>
        </div>

        <div style={{ height: 10 }} />
        <div className="small">
          Hash: <code>{hash}</code>
        </div>

        <div style={{ height: 10 }} />
        <div className="small">
          Explorer:{" "}
          <a href={`https://eth.blockscout.com/tx/${hash}`} target="_blank" rel="noreferrer">
            Blockscout
          </a>{" "}
          ·{" "}
          <a href={`https://etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">
            Etherscan
