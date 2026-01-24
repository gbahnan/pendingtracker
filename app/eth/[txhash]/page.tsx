import Link from "next/link";
import { headers } from "next/headers";
import CopyLinkButton from "./copy-link-button";

export const dynamic = "force-dynamic";

function fmtMaybe(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

async function getBaseUrl() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://pendingtracker.com";
}

export default async function EthTxPage({ params }: { params: { txhash: string } }) {
  const txhash = (params?.txhash || "").trim();

  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/eth/tx/${txhash}`, { cache: "no-store" });
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
          <a className="button secondary" href={`https://eth.blockscout.com/tx/${txhash}`} target="_blank" rel="noreferrer">
            Open in Blockscout
          </a>
          <a className="button secondary" href={`https://etherscan.io/tx/${txhash}`} target="_blank" rel="noreferrer">
            Open in Etherscan
          </a>
        </div>
      </div>
    );
  }

  const r = data as any;

  return (
    <>
      <div className="h1">Pending Tracker — Ethereum</div>
      <p className="p">This page is shareable. Send this link to anyone.</p>

      <div className="row">
        <Link className="button secondary" href="/">Search another</Link>
        <CopyLinkButton />
        <a className="button secondary" href={`https://eth.blockscout.com/tx/${txhash}`} target="_blank" rel="noreferrer">
          Open in Blockscout
        </a>
        <a className="button secondary" href={`https://etherscan.io/tx/${txhash}`} target="_blank" rel="noreferrer">
          Open in Etherscan
        </a>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="badge">Diagnosis</div>
            <div className="badge">Provider: {r.provider}</div>
          </div>

          <div style={{ height: 10 }} />
          <div style={{ fontSize: 20, fontWeight: 800 }}>{r?.diagnosis?.title}</div>
          <div style={{ height: 8 }} />
          <div className="p" style={{ margin: 0 }}>{r?.diagnosis?.summary}</div>

          <div style={{ height: 12 }} />
          <div style={{ fontWeight: 800 }}>Next steps</div>
          <ul>
            {(r?.diagnosis?.actions || []).map((a: any, i: number) => (
              <li key={i}><b>{a.label}:</b> {a.detail}</li>
            ))}
          </ul>

          {r.provider === "Etherscan" && (
            <div className="small" style={{ marginTop: 10 }}>
              Data from Etherscan (attribution required on free tier).
            </div>
          )}
        </div>

        <div className="card">
          <div className="badge">On-chain facts</div>

          <div style={{ height: 12 }} />
          <div className="kv"><div className="k">tx hash</div><div><code>{txhash}</code></div></div>
          <div className="kv"><div className="k">confirmed</div><div>{fmtMaybe(r.confirmed)}</div></div>
          <div className="kv"><div className="k">block</div><div>{fmtMaybe(r.blockNumber)}</div></div>
          <div className="kv"><div className="k">from</div><div className="small">{fmtMaybe(r.from)}</div></div>
          <div className="kv"><div className="k">to</div><div className="small">{fmtMaybe(r.to)}</div></div>
          <div className="kv"><div className="k">value</div><div className="small">{fmtMaybe(r.valueWei)} wei</div></div>
          <div className="kv"><div className="k">gas used</div><div>{fmtMaybe(r.gasUsed)}</div></div>
          <div className="kv"><div className="k">gas price</div><div className="small">{fmtMaybe(r.gasPriceWei)} wei</div></div>

          <div style={{ height: 14 }} />
          <details>
            <summary className="badge" style={{ cursor: "pointer" }}>Raw JSON</summary>
            <div style={{ height: 10 }} />
            <pre className="small">{JSON.stringify(r.raw, null, 2)}</pre>
          </details>
        </div>
      </div>
    </>
  );
}
