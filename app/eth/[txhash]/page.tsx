"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EthTxPage() {
  const params = useParams<{ txhash: string }>();
  const txhash = (params?.txhash || "").toString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

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
        setResult(data);
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
      <div className="h1">Pending Tracker — Ethereum</div>
      <p className="p">Shareable link: this page is the result for that transaction.</p>

      <div className="card">
        <div className="badge">TX HASH</div>
        <div style={{ height: 8 }} />
        <code style={{ wordBreak: "break-word" }}>{txhash}</code>

        <div style={{ height: 12 }} />
        <div className="row">
          <button className="button" onClick={copyLink}>Copy link</button>
          <a className="button" href={`https://eth.blockscout.com/tx/${txhash}`} target="_blank" rel="noreferrer">
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
            <div style={{ fontSize: 20, fontWeight: 800 }}>{result?.diagnosis?.title}</div>
            <div style={{ height: 8 }} />
            <div className="p" style={{ margin: 0 }}>{result?.diagnosis?.summary}</div>

            <div style={{ height: 10 }} />
            <div style={{ fontWeight: 800 }}>Next steps</div>
            <ul>
              {(result?.diagnosis?.actions || []).map((a: any, i: number) => (
                <li key={i}><b>{a.label}:</b> {a.detail}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="badge">Details</div>
            <div style={{ height: 10 }} />
            <div className="kv"><div className="k">Provider</div><div>{result.provider}</div></div>
            <div className="kv"><div className="k">Confirmed</div><div>{String(result.confirmed)}</div></div>

            <div style={{ height: 12 }} />
            <details>
              <summary className="badge" style={{ cursor: "pointer" }}>Raw JSON</summary>
              <div style={{ height: 10 }} />
              <pre className="small">{JSON.stringify(result.raw, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
