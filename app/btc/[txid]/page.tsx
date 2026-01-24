"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function BtcResultPage() {
  const params = useParams<{ txid: string }>();
  const txid = (params?.txid || "").toString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/btc/tx/${txid}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Could not load that transaction.");
          setResult(null);
          return;
        }

        setResult(data);
      } catch (e: any) {
        setError(e?.message || "Network error.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    }

    if (txid) run();
  }, [txid]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  }

  return (
    <>
      <div className="card">
        <div className="badge">Bitcoin transaction result</div>
        <div style={{ height: 10 }} />

        <div style={{ fontWeight: 900, fontSize: 18 }}>TXID</div>
        <div style={{ marginTop: 6, wordBreak: "break-word" }}>
          <code>{txid}</code>
        </div>

        <div style={{ height: 12 }} />
        <div className="row">
          <button className="button" onClick={copyLink}>Copy link</button>
          <a
            className="button"
            style={{ textDecoration: "none" }}
            href={`https://mempool.space/tx/${txid}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in explorer
          </a>
        </div>
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
            <div className="badge">Explanation</div>
            <div style={{ height: 10 }} />
            <div style={{ fontSize: 20, fontWeight: 900 }}>
              {result?.diagnosis?.title || "Result"}
            </div>
            <div style={{ height: 8 }} />
            <div className="p" style={{ margin: 0 }}>
              {result?.diagnosis?.summary}
            </div>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 900 }}>What you can do next</div>
            <ul>
              {(result?.diagnosis?.actions || []).map((a: any, i: number) => (
                <li key={i}>
                  <b>{a.label}:</b> {a.detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="badge">Key facts</div>

            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">Confirmed</div>
              <div>{String(result?.status?.confirmed ?? result?.tx?.status?.confirmed ?? false)}</div>
            </div>

            <div className="kv">
              <div className="k">Fee</div>
              <div>{result?.tx?.fee ?? "—"} sats</div>
            </div>

            <div className="kv">
              <div className="k">Fee rate</div>
              <div>{result?.feerateSatVb ?? "—"} sat/vB</div>
            </div>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 900 }}>Recommended fees</div>
            <div className="kv"><div className="k">Fastest</div><div>{result?.fees?.fastestFee ?? "—"}</div></div>
            <div className="kv"><div className="k">~30 min</div><div>{result?.fees?.halfHourFee ?? "—"}</div></div>
            <div className="kv"><div className="k">~1 hour</div><div>{result?.fees?.hourFee ?? "—"}</div></div>
            <div className="kv"><div className="k">Economy</div><div>{result?.fees?.economyFee ?? "—"}</div></div>
          </div>
        </div>
      )}
    </>
  );
}
