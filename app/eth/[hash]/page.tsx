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
  const failed = Boolean(data?.failed);
  const diagnosis = data?.diagnosis;

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
          <div className="badge">{failed ? "Failed" : confirmed ? "Confirmed" : "Pending"}</div>
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
          </a>
        </div>
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
            <div style={{ fontWeight: 800 }}>{failed ? "The transaction was included but failed." : diagnosis?.title ?? (confirmed ? "It’s confirmed." : "It’s waiting to be confirmed.")}</div>
            <p className="p" style={{marginTop:10}}>{failed ? "Ethereum processed this transaction, but the operation did not succeed. Network fees may still have been charged." : diagnosis?.summary ?? "We could not generate a specific explanation from the available data."}</p>
            <div style={{ height: 8 }} />
            <ul>
              <li>
                Think of Ethereum like a line at a busy store. Transactions paying higher fees usually get processed
                sooner.
              </li>
              <li>If it’s pending, your wallet may have a “Speed Up” option.</li>
              <li>If it’s confirmed, you may just be waiting for more confirmations.</li>
            </ul>

            <div style={{ height: 10 }} />
            <div className="small">Educational only. No custody, no execution, no financial advice.</div>
          </div>

          <div className="card">
            <div className="badge">Details</div>
            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">from</div>
              <div className="small">{shortHash(String(data.from ?? ""))}</div>
            </div>
            <div className="kv">
              <div className="k">to</div>
              <div className="small">{shortHash(String(data.to ?? ""))}</div>
            </div>
            <div className="kv">
              <div className="k">value</div>
              <div>{weiToEth(String(data.valueWei ?? data.value ?? "0"))} ETH</div>
            </div>
            <div className="kv">
              <div className="k">confirmations</div>
              <div>{String(data.confirmations ?? (confirmed ? 1 : 0))}</div>
            </div>

            <div style={{ height: 12 }} />
            <details>
              <summary className="badge" style={{ cursor: "pointer" }}>
                Raw JSON
              </summary>
              <div style={{ height: 10 }} />
              <pre className="small">{JSON.stringify(data, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
