"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { EthMvpResult } from "@/lib/eth/types";

export default function EthResultPage() {
  const params = useParams<{ txhash: string }>();
  const txhash = (params?.txhash || "").toString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EthMvpResult | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError(null);
        setResult(null);

        const res = await fetch(`/api/eth/tx/${txhash}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Request failed.");
          return;
        }
        setResult(data as EthMvpResult);
      } catch (e: any) {
        setError(e?.message || "Network error.");
      } finally {
        setLoading(false);
      }
    }
    if (txhash) run();
  }, [txhash]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  }

  return (
    <>
      <div className="card">
        <div className="badge">Ethereum transaction</div>
        <div style={{ height: 10 }} />
        <div style={{ fontWeight: 900 }}>Hash</div>
        <div style={{ wordBreak: "break-word" }}><code>{txhash}</code></div>

        <div style={{ height: 12 }} />
        <div className="row">
          <button className="button" onClick={copyLink}>Copy link</button>
          <a className="button secondary" href={`https://eth.blockscout.com/tx/${txhash}`} target="_blank" rel="noreferrer">
            Open in explorer
          </a>
        </div>
      </div>

      <div style={{ height: 14 }} />

      {loading && <div className="card"><div className="badge">Loading…</div></div>}
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
            <div className="badge">Explanation</div>
            <div style={{ height: 10 }} />
            <div style={{ fontSize: 20, fontWeight: 900 }}>{result.diagnosis.title}</div>
            <div style={{ height: 8 }} />
            <div className="p" style={{ margin: 0 }}>{result.diagnosis.summary}</div>

            <div style={{ height: 10 }} />
            <div style={{ fontWeight: 900 }}>What you can do next</div>
            <ul>
              {result.diagnosis.actions.map((a, i) => (
                <li key={i}><b>{a.label}:</b> {a.detail}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="badge">Key facts</div>
            <div className="kv"><div className="k">Confirmed</div><div>{String(result.confirmed)}</div></div>
            <div className="kv"><div className="k">Block</div><div>{result.blockNumber ?? "—"}</div></div>
            <div className="kv"><div className="k">From</div><div className="small">{result.from ?? "—"}</div></div>
            <div className="kv"><div className="k">To</div><div className="small">{result.to ?? "—"}</div></div>
            <div className="kv"><div className="k">Value</div><div className="small">{result.valueWei ?? "—"} wei</div></div>

            <div style={{ height: 10 }} />
            <details>
              <summary className="badge" style={{ cursor: "pointer" }}>Raw data</summary>
              <div style={{ height: 10 }} />
              <pre className="small">{JSON.stringify(result.raw, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
