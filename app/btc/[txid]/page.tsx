"use client";

import { useEffect, useMemo, useState } from "react";
import type { BtcMvpResult } from "@/lib/btc/types";
import { isLikelyTxid } from "@/lib/btc/validate";

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(n);
}

function Progress({ confirmed }: { confirmed: boolean }) {
  const stepStyle = (on: boolean) => ({
    width: 12,
    height: 12,
    borderRadius: 999,
    background: on ? "white" : "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.35)",
  });

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="badge">Where it is (BTC)</div>
      <div style={{ height: 10 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={stepStyle(true)} />
        <div className="small">Broadcasted</div>
        <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.15)" }} />
        <div style={stepStyle(!confirmed)} />
        <div className="small">In mempool</div>
        <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.15)" }} />
        <div style={stepStyle(confirmed)} />
        <div className="small">Confirmed</div>
      </div>
    </div>
  );
}

export default function BtcTxPage({ params }: { params: { txid: string } }) {
  const txid = params.txid ?? "";
  const ok = useMemo(() => isLikelyTxid(txid), [txid]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BtcMvpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/btc/tx/${txid}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Request failed.");
        setResult(null);
      } else {
        setResult(data as BtcMvpResult);
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
  }, [txid, ok]);

  if (!ok) {
    return (
      <div className="card">
        <div className="badge">Invalid BTC txid</div>
        <div style={{ height: 8 }} />
        <div className="small">A BTC txid is 64 hex characters (no 0x).</div>
      </div>
    );
  }

  const confirmed = Boolean(result?.status?.confirmed ?? result?.tx?.status?.confirmed);
  const observed = Boolean(result?.tx || result?.status);
  const hasFeeComparison = result?.feerateSatVb != null && result?.fees?.hourFee != null;

  return (
    <>
      <div className="h1">Bitcoin transaction explained</div>
      <p className="p">Your transaction status, what the blockchain knows, and what to do next.</p>
      <div className="small">
        Auto-refreshing every ~15 seconds.{" "}
        <button className="button" style={{ padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh now"}
        </button>
      </div>

      <div style={{ height: 12 }} />

      {observed && <Progress confirmed={confirmed} />}

      <div style={{ height: 12 }} />

      {loading && !result && <div className="card" role="status">Checking the Bitcoin network and preparing your explanation…</div>}
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
              <div className="badge">Your transaction explained</div>
              <div className="badge">Provider: {result.provider}</div>
            </div>

            <div style={{ height: 10 }} />
            <div style={{ fontSize: 20, fontWeight: 800 }}>{result.diagnosis.title}</div>
            <div style={{ height: 8 }} />
            <div className="p" style={{ margin: 0 }}>
              {result.diagnosis.summary}
            </div>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 800 }}>What the numbers mean</div>
            <p className="p" style={{ marginTop: 10 }}>{confirmed ? "A miner included this transaction in a Bitcoin block. The receiving service may require additional confirmations." : !observed ? "Our provider has not observed this transaction, so we cannot yet tell whether it was broadcast." : hasFeeComparison ? `This transaction pays ${result.feerateSatVb} sat/vB, compared with a current roughly one-hour fee recommendation of ${result.fees!.hourFee} sat/vB. That is a network estimate, not a promise of confirmation time.` : "Bitcoin miners usually prioritize transactions by fee rate, but current fee comparison data is incomplete."}</p>

            <div style={{ height: 10 }} />
            <div style={{ fontWeight: 800 }}>Next steps</div>
            <ul>
              {result.diagnosis.actions.map((a, i) => (
                <li key={i}>
                  <b>{a.label}:</b> {a.detail}
                </li>
              ))}
            </ul>

            <div style={{ height: 12 }} />
            <div className="small">Educational only. No custody, no execution, no financial advice.</div>
          </div>

          <div className="card">
            <div className="badge">Blockchain evidence</div>
            <div style={{ height: 12 }} />
            <div className="kv">
              <div className="k">Transaction ID</div>
              <div>
                <code>{result.txid}</code>
                <button className="button" style={{marginLeft:8,padding:"5px 9px"}} onClick={()=>navigator.clipboard?.writeText(result.txid)}>Copy</button>
              </div>
            </div>

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">Confirmed</div>
              <div>{observed ? (confirmed ? "Yes" : "Not yet") : "Unknown"}</div>
            </div>

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">Fee</div>
              <div>{fmtNum(result.tx?.fee)} sats</div>
            </div>

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">vsize</div>
              <div>{fmtNum(result.tx?.vsize)} vB</div>
            </div>

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">Fee rate</div>
              <div>{result.feerateSatVb ?? "—"} sat/vB</div>
            </div>

            <div style={{ height: 14 }} />
            <a href={`https://mempool.space/tx/${txid}`} target="_blank" rel="noopener noreferrer">Verify on mempool.space ↗</a>
            <div style={{ height: 14 }} />
            <details>
              <summary className="badge" style={{ cursor: "pointer" }}>
                Raw JSON
              </summary>
              <div style={{ height: 10 }} />
              <pre className="small">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
