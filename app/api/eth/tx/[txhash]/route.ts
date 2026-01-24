import { NextResponse } from "next/server";
import { getEthMvpResult } from "@/lib/eth/getResult";

export async function GET(_req: Request, { params }: { params: { txhash: string } }) {
  const r = await getEthMvpResult(params?.txhash || "");
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r.data, { status: 200 });
}
