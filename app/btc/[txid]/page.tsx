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

  return (
    <>
      <div className="h1">BTC Transaction</div>
      <div className="small">
        Auto-refreshing every ~15 seconds.{" "}
        <button className="button" style={{ padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh now"}
        </button>
      </div>

      <div style={{ height: 12 }} />

      <Progress confirmed={confirmed} />

      <div style={{ height: 12 }} />

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
              <div className="badge">Plain-English</div>
              <div className="badge">Provider: {result.provider}</div>
            </div>

            <div style={{ height: 10 }} />
            <div style={{ fontSize: 20, fontWeight: 800 }}>{result.diagnosis.title}</div>
            <div style={{ height: 8 }} />
            <div className="p" style={{ margin: 0 }}>
              {result.diagnosis.summary}
            </div>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 800 }}>What this means (simple)</div>
            <ul>
              <li>
                Your transaction is like a package in a shipping queue. Miners usually pick the packages that pay the
                best “shipping fee” first.
              </li>
              <li>
                Your fee rate is <b>{result.feerateSatVb ?? "—"} sat/vB</b>. Suggested fees right now are around{" "}
                <b>{fmtNum(result.fees?.hourFee)}</b> sat/vB for ~1 hour.
              </li>
              <li>
                If your fee rate is lower than what most people are paying, it can sit pending longer. That’s normal.
              </li>
            </ul>

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
            <div className="badge">Numbers (for reference)</div>
            <div style={{ height: 12 }} />
            <div className="kv">
              <div className="k">txid</div>
              <div>
                <code>{result.txid}</code>
              </div>
            </div>

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">Confirmed</div>
              <div>{String(confirmed)}</div>
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
