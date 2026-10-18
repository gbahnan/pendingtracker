"use client";

import { FormEvent, useState } from "react";

type Source = { available: boolean; data?: unknown; status?: number };
type ResponseData = { txid: string; provider: string; mode: string; sources: Record<string, Source> };
const NAMES: Record<string, string> = {
  transaction: "Transaction details", status: "Confirmation status",
  outspends: "Output spending", cpfp: "CPFP and transaction dependencies",
  rbf: "Replacement history", merkleProof: "Merkle proof (confirmed transactions)",
};
export default function MempoolCoreExperiment() {
  const [txid, setTxid] = useState("");
  const [data, setData] = useState<ResponseData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function search(event: FormEvent) {
    event.preventDefault();
    setError(""); setData(null);
    if (!/^[0-9a-fA-F]{64}$/.test(txid.trim())) { setError("Enter a 64-character Bitcoin transaction ID."); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/experiments/mempool-core/tx/${txid.trim()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Lookup failed");
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Lookup failed"); }
    finally { setLoading(false); }
  }
  return <main style={{ maxWidth: 900, margin: "40px auto", padding: 24, color: "#eee" }}>
    <p style={{ color: "#d8a847", letterSpacing: 2 }}>BITCOIN · ISOLATED EXPERIMENT</p>
    <h1 style={{ fontSize: 32, marginBottom: 12 }}>Mempool core — one-page test</h1>
    <p>This experimental page retrieves multiple Mempool API capabilities in one request. It does not run Mempool’s self-hosted backend or replace Pending Tracker’s existing transaction page.</p>
    <form onSubmit={search} style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
      <input aria-label="Bitcoin transaction ID" value={txid} onChange={e => setTxid(e.target.value)} placeholder="Paste a Bitcoin transaction ID" style={{ flex: "1 1 280px", padding: 12, color: "#111", borderRadius: 8 }} />
      <button disabled={loading} style={{ padding: "12px 20px", background: "#d8a847", color: "#151515", borderRadius: 8 }}>{loading ? "Checking…" : "Check data"}</button>
    </form>
    {error && <p role="alert" style={{ color: "#ff9b9b", marginTop: 16 }}>{error}</p>}
    {data && <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 22 }}>Available Bitcoin information</h2>
      <p style={{ overflowWrap: "anywhere", opacity: .8 }}>{data.txid}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginTop: 20 }}>
        {Object.entries(data.sources).map(([key, source]) => <div key={key} style={{ border: "1px solid #50442c", borderRadius: 12, padding: 16, background: "#191919" }}>
          <strong>{NAMES[key] || key}</strong>
          <p style={{ color: source.available ? "#b8e1bd" : "#d9c9a6" }}>{source.available ? "Available" : "Unavailable / not applicable"}</p>
          {source.available && <details><summary>Inspect provider data</summary><pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 11 }}>{JSON.stringify(source.data, null, 2)}</pre></details>}
        </div>)}
      </div>
      <p style={{ marginTop: 24, opacity: .75 }}>Availability is not a guarantee of accuracy or completeness. Some sources apply only to pending or confirmed transactions.</p>
    </section>}
  </main>;
}
