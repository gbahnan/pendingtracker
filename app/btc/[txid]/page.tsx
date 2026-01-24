import Link from "next/link";
import { headers } from "next/headers";
import CopyLinkButton from "./copy-link-button";
import type { BtcMvpResult } from "@/lib/btc/types";
import { isLikelyTxid } from "@/lib/btc/validate";

export const dynamic = "force-dynamic";

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(n);
}

async function getBaseUrl() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  // fallback (rare)
  return "https://pendingtracker.com";
}

export default async function BtcTxPage({ params }: { params: { txid: string } }) {
  const txid = (params?.txid || "").trim();

  if (!isLikelyTxid(txid)) {
    return (
      <div className="card">
        <div className="badge">Error</div>
        <div style={{ height: 8 }} />
        <div>That doesn’t look like a Bitcoin txid (it should be 64 characters).</div>
        <div style={{ height: 12 }} />
        <Link className="button secondary" href="/">Go back</Link>
      </div>
    );
  }

  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/btc/tx/${txid}`, { cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return (
      <div className="card">
        <div className="badge">Error</div>
        <div style={{ height: 8 }} />
        <div>{data?.error || `Request failed (${res.status}).`}</div>
        <div style={{ height: 12 }} />
        <div className="row">
          <Link className="button secondary" href="/">Try another</Link>
          <a className="button secondary" href={`https://mempool.space/tx/${txid}`} target="_blank" rel="noreferrer">
            Open in explorer
          </a>
        </div>
      </div>
    );
  }

  const result = data as BtcMvpResult;

  return (
    <>
      <div className="h1">Pending Tracker — Bitcoin</div>
      <p className="p">This page is shareable. Send this link to anyone.</p>

      <div className="row">
        <Link className="button secondary" href="/">Search another</Link>
        <CopyLinkButton />
        <a className="button secondary" href={`https://mempool.space/tx/${txid}`} target="_blank" rel="noreferrer">
          Open in explorer
        </a>
      </div>

      <div style={{ height: 14 }} />

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
              <li key={i}><b>{a.label}:</b> {a.detail}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="badge">On-chain facts</div>

          <div style={{ height: 12 }} />
          <div className="kv"><div className="k">txid</div><div><code>{result.txid}</code></div></div>
          <div className="kv"><div className="k">Confirmed</div><div>{String(result.status?.confirmed ?? result.tx?.status?.confirmed ?? false)}</div></div>
          <div className="kv"><div className="k">Fee</div><div>{fmtNum(result.tx?.fee)} sats</div></div>
          <div className="kv"><div className="k">vsize</div><div>{fmtNum(result.tx?.vsize)} vB</div></div>
          <div className="kv"><div className="k">Fee rate</div><div>{result.feerateSatVb ?? "—"} sat/vB</div></div>
        </div>
      </div>
    </>
  );
}
