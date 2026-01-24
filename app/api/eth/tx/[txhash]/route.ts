import { NextResponse } from "next/server";

function isLikelyEthTxHash(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test((s || "").trim());
}

async function blockscoutGetTxInfo(txhash: string) {
  // Blockscout docs: module=transaction&action=gettxinfo&txhash=... :contentReference[oaicite:2]{index=2}
  const url = `https://eth.blockscout.com/api?module=transaction&action=gettxinfo&txhash=${encodeURIComponent(txhash)}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) throw new Error("Blockscout request failed");
  if (!json || json.status === "0") return null;
  return json.result;
}

async function etherscanProxy(txhash: string, apiKey: string) {
  const u1 = new URL("https://api.etherscan.io/api");
  u1.searchParams.set("module", "proxy");
  u1.searchParams.set("action", "eth_getTransactionByHash");
  u1.searchParams.set("txhash", txhash);
  u1.searchParams.set("apikey", apiKey);

  const u2 = new URL("https://api.etherscan.io/api");
  u2.searchParams.set("module", "proxy");
  u2.searchParams.set("action", "eth_getTransactionReceipt");
  u2.searchParams.set("txhash", txhash);
  u2.searchParams.set("apikey", apiKey);

  const [r1, r2] = await Promise.all([fetch(u1.toString()), fetch(u2.toString())]);
  const j1 = await r1.json();
  const j2 = await r2.json();

  return { tx: j1?.result ?? null, receipt: j2?.result ?? null };
}

export const runtime = "edge";

export async function GET(_req: Request, { params }: { params: { txhash: string } }) {
  const txhash = (params?.txhash || "").trim();

  if (!isLikelyEthTxHash(txhash)) {
    return NextResponse.json({ error: "Invalid ETH tx hash. Expected 0x + 64 hex chars." }, { status: 400 });
  }

  // 1) Blockscout (no key)
  try {
    const info = await blockscoutGetTxInfo(txhash);
    if (info) {
      const confirmed = !!info.blockNumber && info.blockNumber !== "0";
      return NextResponse.json(
        {
          chain: "ETH",
          txhash,
          confirmed,
          provider: "Blockscout",
          fetchedAtIso: new Date().toISOString(),
          raw: info,
          diagnosis: {
            title: confirmed ? "Confirmed" : "Pending",
            summary: confirmed
              ? "This Ethereum transaction is confirmed on-chain."
              : "This transaction exists, but it hasn’t been included in a block yet.",
            actions: confirmed
              ? [{ label: "If you’re waiting on an exchange", detail: "They may require more confirmations before crediting." }]
              : [{ label: "Wait or use your wallet’s speed-up", detail: "Some wallets can speed up by resending with a higher fee." }],
          },
        },
        { status: 200 }
      );
    }
  } catch {
    // fall through
  }

  // 2) Etherscan fallback (free key; rate-limited) :contentReference[oaicite:3]{index=3}
  const key = process.env.ETHERSCAN_API_KEY;
  if (key) {
    try {
      const { tx, receipt } = await etherscanProxy(txhash, key);
      const confirmed = !!receipt?.blockNumber;

      return NextResponse.json(
        {
          chain: "ETH",
          txhash,
          confirmed,
          provider: "Etherscan",
          fetchedAtIso: new Date().toISOString(),
          raw: { tx, receipt },
          diagnosis: {
            title: confirmed ? "Confirmed" : tx ? "Pending" : "Not found (yet)",
            summary: confirmed
              ? "This Ethereum transaction is confirmed on-chain."
              : tx
                ? "This transaction exists, but it hasn’t been included in a block yet."
                : "We couldn’t find this transaction on our sources right now.",
            actions: confirmed
              ? [{ label: "If you’re waiting on an exchange", detail: "They may require more confirmations before crediting." }]
              : [{ label: "Double-check the hash", detail: "It should start with 0x and be 66 characters long." }],
          },
        },
        { status: 200 }
      );
    } catch {
      // fall through
    }
  }

  return NextResponse.json({ error: "Transaction not found on our free sources right now." }, { status: 404 });
}
