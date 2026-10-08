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

  const whole = s.length > 18 ? s.slice(0, -18) : "0";
  const fraction = s.slice(-18).padStart(18, "0").slice(0, 8).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export default function EthTxPage({ params }: { params: { hash: string } }) {
  const hash = params.hash ?? "";
  const ok = useMemo(() => isLikelyEthHash(hash), [hash]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  async function explainWithAi() {
    if (!data || aiLoading) return;
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: "eth", facts: {
          confirmed: Boolean(data.confirmed ?? (Number(data.confirmations ?? 0) > 0)),
          failed: Boolean(data.failed),
          confirmations: Number(data.confirmations ?? 0),
          valueEth: weiToEth(String(data.valueWei ?? data.value ?? "0")),
          summary: data.diagnosis?.summary ?? null
        } })
      });
      const result = await response.json();
      setAiSummary(response.ok && typeof result.summary === "string" ? result.summary : "AI is temporarily unavailable. The blockchain summary above still works.");
    } catch { setAiSummary("AI is temporarily unavailable. The blockchain summary above still works."); }
    finally { setAiLoading(false); }
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
      <div className="h1">Ethereum transaction explained</div>
      <p className="p">
        This page auto-refreshes every ~15 seconds.{" "}
        <button className="button" style={{ padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh now"}
        </button>
      </p>

      {data && <section className="pt-tx-quick">
        <div className="pt-eyebrow">YOUR ETHEREUM TRANSACTION · QUICK SUMMARY</div>
        <div className="pt-tx-quick-head"><strong>{failed?"Transaction failed":confirmed?"Transaction confirmed":"Waiting for confirmation"}</strong><span className={confirmed&&!failed?"pt-status-confirmed":"pt-status-pending"}>{failed?"● Failed":confirmed?"● Confirmed":"● Pending"}</span></div>
        <p>{failed?"Ethereum processed this transaction, but the requested operation failed. Gas may still have been charged.":diagnosis?.summary??"We're checking what the Ethereum network reports about this transaction."}</p>
        <div className="pt-tx-quick-stats"><div><small>Amount</small><b>{weiToEth(String(data.valueWei??data.value??"0"))} ETH</b></div><div><small>Confirmations</small><b>{String(data.confirmations??(confirmed?1:0))}</b></div><div><small>Next step</small><b>{failed?"Review failure details":confirmed?"Review receipt":"Check pending status"}</b></div></div>
        <div style={{height:12}} />
        <button className="button" disabled={aiLoading} onClick={explainWithAi}>{aiLoading?"Translating…":"✨ Translate this with AI"}</button>
        {aiSummary && <p role="status">{aiSummary}</p>}
        <div style={{height:10}} />
        <small>Based on available blockchain records and transparent explanation rules, not generative AI.</small>
      </section>}
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
            <div className="badge">Your transaction explained</div>
            <div style={{ height: 10 }} />
            <div style={{ fontWeight: 800 }}>{failed ? "The transaction was included but failed." : diagnosis?.title ?? (confirmed ? "It’s confirmed." : "It’s waiting to be confirmed.")}</div>
            <p className="p" style={{marginTop:10}}>{failed ? "Ethereum processed this transaction, but the operation did not succeed. Network fees may still have been charged." : diagnosis?.summary ?? "We could not generate a specific explanation from the available data."}</p>
            <div style={{ height: 8 }} />
            <ul>
              <li>
                Think of Ethereum like a line at a busy store. Transactions paying higher fees usually get processed
                sooner.
              </li>
              <li>{confirmed ? "The transaction has been included in a block." : "If your wallet supports it, you may be able to increase the fee on a pending transaction."}</li>
              <li>{failed ? "A failed transaction may still cost gas." : confirmed ? "Some receiving services wait for additional confirmations." : "Never send a second payment until you know whether the original was replaced or canceled."}</li>
            </ul>

            <div style={{ height: 10 }} />
            <button className="button" onClick={()=>navigator.clipboard?.writeText(`Ethereum transaction: ${hash}\n${diagnosis?.title ?? "Transaction status"}\n${diagnosis?.summary ?? ""}\nVerify: https://eth.blockscout.com/tx/${hash}`)}>Copy explanation</button>
            <div style={{ height: 10 }} />
            <div className="small">Explanations are based on blockchain records and transparent rules. Educational only; not financial advice.</div>
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
