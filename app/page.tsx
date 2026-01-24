"use client";

import { useMemo, useState } from "react";
import type { BtcMvpResult } from "@/lib/btc/types";
import { isLikelyTxid } from "@/lib/btc/validate";

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(n);
}

export default function Page() {
  const [txid, setTxid] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BtcMvpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => isLikelyTxid(txid), [txid]);

  async function lookup() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/btc/tx/${txid.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Request failed.");
        setLoading(false);
        return;
      }
      setResult(data as BtcMvpResult);
    } catch (e: any) {
      setError(e?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="h1">Pending Tracker (BTC MVP)</div>
      <p className="p">
        Paste a Bitcoin txid. You’ll get a plain-English explanation of why it’s pending, an ETA band, and the next best action (RBF / CPFP / wait).
      </p>

      <div className="row">
        <input
          className="input"
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="Bitcoin transaction id (64 hex characters)…"
          spellCheck={false}
        />
        <button className="button" onClick={lookup} disabled={!canSubmit || loading}>
          {loading ? "Checking…" : "Explain"}
        </button>
      </div>

      <div style={{ height: 14 }} />

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

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">Confidence</div>
              <div>{result.diagnosis.confidence}</div>
            </div>

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
            <div className="small">
              Educational only. No custody, no execution, and no financial advice.
            </div>
          </div>

          <div className="card">
            <div className="badge">On-chain facts</div>
            <div style={{ height: 12 }} />
            <div className="kv">
              <div className="k">txid</div>
              <div><code>{result.txid}</code></div>
            </div>

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">Confirmed</div>
              <div>{String(result.status?.confirmed ?? result.tx?.status?.confirmed ?? false)}</div>
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
            <div style={{ fontWeight: 800 }}>Recommended fees (sat/vB)</div>
            <div style={{ height: 8 }} />
            <div className="kv"><div className="k">Fastest</div><div>{fmtNum(result.fees?.fastestFee)}</div></div>
            <div className="kv"><div className="k">~30 min</div><div>{fmtNum(result.fees?.halfHourFee)}</div></div>
            <div className="kv"><div className="k">~1 hour</div><div>{fmtNum(result.fees?.hourFee)}</div></div>
            <div className="kv"><div className="k">Economy</div><div>{fmtNum(result.fees?.economyFee)}</div></div>
            <div className="kv"><div className="k">Minimum</div><div>{fmtNum(result.fees?.minimumFee)}</div></div>

            <div style={{ height: 14 }} />
            <details>
              <summary className="badge" style={{ cursor: "pointer" }}>Raw JSON</summary>
              <div style={{ height: 10 }} />
              <pre className="small">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
