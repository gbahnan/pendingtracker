import { NextResponse } from "next/server";

export const runtime = "edge";

function isLikelyEthTxHash(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test((s || "").trim());
}

export async function GET(_req: Request, { params }: { params: { txhash: string } }) {
  const txhash = (params?.txhash || "").trim();

  if (!isLikelyEthTxHash(txhash)) {
    return NextResponse.json(
      { error: "Invalid ETH tx hash. Expected 0x + 64 hex characters." },
      { status: 400 }
    );
  }

  // Blockscout v2 endpoint (no API key)
  const url = `https://eth.blockscout.com/api/v2/transactions/${encodeURIComponent(txhash)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 404) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: "ETH provider error." }, { status: 502 });
    }

    const raw: any = await res.json();

    // Normalize a few fields (Blockscout sometimes returns nested objects)
    const from = raw?.from?.hash ?? raw?.from ?? null;
    const to = raw?.to?.hash ?? raw?.to ?? null;

    // On Blockscout v2, "value" is typically a string in wei
    const valueWei = String(raw?.value ?? "0");

    const blockNumber =
      raw?.block_number ?? raw?.blockNumber ?? raw?.block ?? raw?.block?.number ?? null;

    const confirmations =
      raw?.confirmations ?? raw?.confirmation_count ?? raw?.confirmations_count ?? null;

    const confirmed = blockNumber !== null && String(blockNumber) !== "0";

    const out = NextResponse.json(
      {
        chain: "ETH",
        txhash,
        provider: "Blockscout",
        fetchedAtIso: new Date().toISOString(),
        confirmed,
        blockNumber,
        confirmations,
        from,
        to,
        valueWei,
        raw,
      },
      { status: 200 }
    );

    out.headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    return out;
  } catch {
    return NextResponse.json({ error: "Network error fetching ETH tx." }, { status: 502 });
  }
}
