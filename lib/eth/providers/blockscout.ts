export async function blockscoutGetTxInfo(txhash: string) {
  const url =
    `https://eth.blockscout.com/api?module=transaction&action=gettxinfo&txhash=${encodeURIComponent(txhash)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  // Blockscout is Etherscan-like: { status, message, result }
  if (!res.ok) throw new Error("Blockscout request failed");
  if (!data || data.status === "0") return null;

  return data.result;
}
