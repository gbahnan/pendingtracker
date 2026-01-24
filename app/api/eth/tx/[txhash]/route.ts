import { NextResponse } from "next/server";

export const runtime = "edge";

function isLikelyEthTxHash(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test((s || "").trim());
}

async function blockscoutGetTxInfo(txhash: string) {
  // Blockscout “gettxinfo” (no API key)
  const url = `https://eth.blockscout.com/api?module=transaction&action=gettxinfo&txhash=${encodeURIComponent(
    txhash
  )}`;

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) throw new Error("Blockscout request failed");
  if (!json || json.status === "0") return null;

  return json.result;
}

async function etherscanProxy(txhash: string, apiKey: string) {
  // Optional fallback if you add ETHERSCAN_API_KEY in Vercel env vars
  const txUrl = new URL("https://api.etherscan.io/api");
  txUrl.searchParams.set("module", "proxy");
  txUrl.searchParams.set("action", "eth_getTransactionByHash");
  txUrl.searchParams.set("txhash", txhash);
  txUrl.searchParams.set("chainid", "1");
  txUrl.searchParams.set("apikey", apiKey);

  const rcUrl = new URL("https://api.etherscan.io/api");
  rcUrl.searchParams.set("module", "proxy");
  rcUrl.searchParams.set("action", "eth_getTransactionReceipt");
  rcUrl.searchParams.set("txhash", txhash);
  rcUrl.searchParams.set("chainid", "1");
  rcUrl.searchParams.set("apikey", apiKey);

  const [r1, r2] = await Promise.all([fetch(txUrl.toString()), fetch(rcUrl.toString())]);
  const j1 = await r1.json();
  const j2 = await r2.json();

  return { tx: j1?.result ?? null, receipt: j2?.result ?? null };
}

export async function GET(_req_
