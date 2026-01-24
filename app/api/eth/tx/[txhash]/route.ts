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

export async function GET(_req: Request, { params }: { params: { txhash: string } }) {
  const txhash = (params?.txhash || "").trim();

  if (!isLikelyEthTxHash(txhash)) {
    return NextResponse.json(
      { error: "Invalid ETH tx hash. Expected 0x + 64 hex characters." },
      { status: 400 }
    );
  }

  // 1) Blockscout first (free)
  try {
    const info = await blockscoutGetTxInfo(txhash);
    if (info) {
      const confirmed = !!info.blockNumber && info.blockNumber !== "0";

      return NextResponse.json(
        {
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
          raw: info,
        },
        { status: 200 }
      );
    }
  } catch {
    // fall through to optional etherscan
  }

  // 2) Etherscan fallback (optional)
  const key = process.env.ETHERSCAN_API_KEY;
  if (key) {
    try {
      const { tx, receipt } = await etherscanProxy(txhash, key);
      const seen = !!tx;
      const confirmed = !!receipt?.blockNumber;

      if (seen) {
        return NextResponse.json(
          {
            chain: "ETH",
            txhash,
            provider: "Etherscan",
            fetchedAtIso: new Date().toISOString(),
            confirmed,
            blockNumber: receipt?.blockNumber ?? null,
            confirmations: null,
            from: tx?.from ?? null,
            to: tx?.to ?? null,
            valueWei: tx?.value ?? null,
            gasUsed: receipt?.gasUsed ?? null,
            gasPriceWei: tx?.gasPrice ?? null,
            raw: { tx, receipt },
          },
          { status: 200 }
        );
      }
    } catch {
      // ignore and fall through
    }
  }

  return NextResponse.json({ error: "Transaction not found on our sources right now." }, { status: 404 });
}
