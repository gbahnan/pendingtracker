import { NextResponse } from "next/server";

export const runtime = "edge";

function isLikelyEthTxHash(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test((s || "").trim());
}

function hexToInt(hex?: string | null): number | null {
  if (!hex) return null;
  try {
    return parseInt(hex, 16);
  } catch {
    return null;
  }
}

function makeDiagnosis(confirmed: boolean, seen: boolean) {
  if (confirmed) {
    return {
      code: "CONFIRMED",
      title: "Confirmed",
      summary: "This Ethereum transaction is confirmed on-chain.",
      actions: [
        { label: "If you’re waiting on an exchange", detail: "They may require more confirmations before crediting." },
        { label: "Keep this link", detail: "You can share this page with support or the recipient." },
      ],
    };
  }
  if (seen) {
    return {
      code: "PENDING",
      title: "Pending",
      summary: "This transaction exists, but it hasn’t been included in a block yet.",
      actions: [
        { label: "Wait a bit", detail: "Many pending transactions confirm as network conditions change." },
        { label: "Speed up (if your wallet allows)", detail: "Some wallets can ‘speed up’ by resending with a higher fee. Exchanges usually do not." },
      ],
    };
  }
  return {
    code: "NOT_FOUND",
    title: "Not found (yet)",
    summary: "We couldn’t find this transaction on our sources right now.",
    actions: [
      { label: "Double-check the hash", detail: "Ethereum tx hashes start with 0x and are 66 characters long." },
      { label: "If sent from an exchange", detail: "They may not have broadcast it yet — you may need to wait." },
    ],
  };
}

async function blockscoutGetTxInfo(txhash: string) {
  // Docs: https://eth.blockscout.com/api?module=transaction&action=gettxinfo&txhash=...
  const url = `https://eth.blockscout.com/api?module=transaction&action=gettxinfo&txhash=${encodeURIComponent(txhash)}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error("Blockscout request failed");
  if (!json || json.status === "0") return null;
  return json.result;
}

async function etherscanProxy(txhash: string, apiKey: string) {
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

export async function GET(_req: Request, { params }: { params: { txhash: string } }) {
  const txhash = (params?.txhash || "").trim();

  if (!isLikelyEthTxHash(txhash)) {
    return NextResponse.json(
      { error: "Invalid ETH tx hash. Expected 0x + 64 hex characters." },
      { status: 400 }
    );
  }

  // 1) Blockscout (no key)
  try {
    const info = await blockscoutGetTxInfo(txhash);
    if (info) {
      const confirmed = !!info.blockNumber && info.blockNumber !== "0";

      const payload = {
        chain: "ETH",
        txhash,
        provider: "Blockscout",
        fetchedAtIso: new Date().toISOString(),

        confirmed,
        blockNumber: info.blockNumber ?? null,
        confirmations: info.confirmations ? Number(info.confirmations) : null,

        from: info.from ?? null,
        to: info.to ?? null,
        valueWei: info.value ?? null,

        gasUsed: info.gasUsed ?? null,
        gasPriceWei: info.gasPrice ?? null,

        diagnosis: makeDiagnosis(confirmed, true),

        raw: info,
      };

      return NextResponse.json(payload, { status: 200 });
    }
  } catch {
    // fall through to
