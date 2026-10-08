import { NextResponse } from "next/server";
export const runtime = "edge";
const valid = (s: string) => /^0x[a-f0-9]{64}$/i.test(s);

export async function GET(_req: Request, { params }: { params: { txhash: string } }) {
  const txhash = (params?.txhash || "").trim();
  if (!valid(txhash)) return NextResponse.json({ error: "Enter a valid Ethereum transaction hash (0x plus 64 hexadecimal characters)." }, { status: 400 });
  try {
    const res = await fetch(`https://eth.blockscout.com/api/v2/transactions/${txhash}`, { next: { revalidate: 10 }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return NextResponse.json({ error: "This transaction was not found by Blockscout. It may not have been broadcast, may have been replaced, or may not yet be visible to this provider." }, { status: 404 });
    if (!res.ok) return NextResponse.json({ error: "Ethereum data is temporarily unavailable. Please retry." }, { status: 502 });
    const raw = await res.json();
    const blockNumber = raw.block_number ?? raw.blockNumber ?? (typeof raw.block === "object" ? raw.block?.number : raw.block) ?? null;
    const confirmed = blockNumber !== null && Number(blockNumber) > 0;
    const status = String(raw.status ?? "").toLowerCase();
    const failed = confirmed && (status === "error" || status === "failed" || status === "0" || status === "0x0");
    const from = typeof raw.from === "object" ? raw.from?.hash : raw.from;
    const to = typeof raw.to === "object" ? raw.to?.hash : raw.to;
    const gasUsed = raw.gas_used ?? raw.gasUsed ?? null;
    const gasPriceWei = raw.gas_price ?? raw.gasPrice ?? null;
    const feeWei = raw.fee?.value ?? (gasUsed != null && gasPriceWei != null ? (BigInt(gasUsed) * BigInt(gasPriceWei)).toString() : null);
    const diagnosis = failed ? {
      code: "FAILED", title: "Your transaction was processed but failed",
      summary: "Ethereum included this transaction in a block, but the requested operation did not succeed. Gas fees may still have been charged.",
      actions: [{label:"Check the error",detail:"Open the technical details to inspect the transaction's revert reason, if available."},{label:"Review before retrying",detail:"Check contract inputs, balances, and gas settings before sending another transaction."}]
    } : confirmed ? {
      code:"CONFIRMED",title:"Your transaction is confirmed",
      summary:"Ethereum included your transaction in a block. If an exchange or application has not updated, it may still be processing the deposit or waiting for additional confirmations.",
      actions:[{label:"Check the recipient",detail:"Verify the destination address and whether the receiving service has credited the transaction."}]
    } : {
      code:"PENDING",title:"Your transaction is waiting",
      summary:"This transaction is visible to the explorer but is not yet included in a block. Fee settings, network demand, or an earlier transaction from the same sender may affect when it confirms. The exact cause cannot be determined from this record alone.",
      actions:[{label:"Check your wallet",detail:"If your wallet supports speed-up, it may allow a replacement with a higher fee."},{label:"Avoid duplicate payments",detail:"Do not resend funds as a separate transaction without first checking the pending transaction's status."}]
    };
    return NextResponse.json({
      chain:"ETH",txhash,provider:"Blockscout",fetchedAtIso:new Date().toISOString(),
      confirmed,failed,blockNumber,confirmations:raw.confirmations ?? null,
      from:from ?? null,to:to ?? null,valueWei:String(raw.value ?? "0"),
      gasUsed,gasPriceWei,feeWei,diagnosis,raw
    }, { headers: { "Cache-Control":"public, s-maxage=10, stale-while-revalidate=30" } });
  } catch {
    return NextResponse.json({ error:"Unable to reach the Ethereum data provider right now. Please retry." }, { status:502 });
  }
}
