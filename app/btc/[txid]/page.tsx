"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { BtcMvpResult } from "@/lib/btc/types";
import { isLikelyTxid } from "@/lib/btc/validate";

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(n);
}

export default function BtcTxPage() {
  const params = useParams<{ txid: string }>();
  const routeTxid = (params?.txid || "").toString();

  const [txid, setTxid] = useState(routeTxid);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<BtcMvpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => isLikelyTxid(txid), [txid]);

  useEffect(() => {
    setTxid(routeTxid);
  }, [routeTxid]);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError(null);
        setResult(null);

        if (!isLikelyTxid(routeTxid)) {
          setError("Invalid txid. Expected 64 hex characters.");
          return;
        }

        const res = await fetch(`/api/btc/tx/${routeTxid}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Request failed.");
          return;
        }
        setResult(data as BtcMvpResult);
      } catch (e: any) {
        setError(e?.message || "Network error.");
      } finally {
        setLoading(false);
      }
    }

    if (routeTxid) run();
  }, [routeTxid]);

  function go() {
    const clean = txid.trim();
    if (!isLikelyTxid(clean)) {
      setError("That doesn’t look like a Bitcoin txid (64 characters).");
      return;
    }
    window.location.href = `/btc/${clean}`;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  }

  return (
    <>
      <div className="h1">Pending Tracker — Bitcoin</div>
      <p className="p">Paste a Bitcoin transaction ID (txid) and get a plain-English explanation + next steps.</p>

      <div className="row">
        <input
          className="input"
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="Bitcoin transaction id (64 hex characters)…"
          spellCheck={false}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
        <button className="button" onClick={go} disabled={!canSubmit}>
          Explain
        </button>
        <button className="button" onClick={copyLink}>
          Copy link
        </button>
        <a className="button" href={`https://mempool.space/tx/${routeTxid}`} target="_blank" rel="noreferrer">
          Open in explorer
        </a>
      </div>

      <div style={{ height: 14 }} />

      {loading && (
        <div className="card">
          <div className="badge">Loading…</div>
          <div style={{ height: 8 }} />
          <div>Checking the network…</div>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="badge">Error</div>
          <div style={{ height: 8 }} />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="grid">
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className="badge">Diagnosis</div>
              <div className="badge">Provider: {result.provider}</div>
            </div>

            <div style={{ height: 10 }} />
            <div style={{ fontSize: 20, fontWeight: 800 }}>{result.diagnosis.title}</div>
            <div style={{ height: 8 }} />
            <div className="p" style={{ margin: 0 }}>{result.diagnosis.summary}</div>

            {result.diagnosis.eta && (
              <>
                <div style={{ height: 10 }} />
                <div className="kv">
                  <div className="k">ETA</div>
                  <div>
                    {result.diagnosis.eta.minMinutes === 0 && result.diagnosis.eta.maxMinutes === 0
                      ? "Already confirmed"
                      : `${result.diagnosis.eta.minMinutes}–${result.diagnosis.eta.maxMinutes} minutes`}
                    {result.diagnosis.eta.note ? <div className="small">{result.diagnosis.eta.note}</div> : null}
                  </div>
                </div>
              </>
            )}
