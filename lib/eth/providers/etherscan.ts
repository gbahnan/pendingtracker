function etherscanUrl(params: Record<string, string>) {
  const u = new URL("https://api.etherscan.io/api");
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

export async function etherscanGetTxAndReceipt(txhash: string, apiKey: string) {
  const txUrl = etherscanUrl({
    module: "proxy",
    action: "eth_getTransactionByHash",
    txhash,
    apikey: apiKey,
    chainid: "1",
  });

  const receiptUrl = etherscanUrl({
    module: "proxy",
    action: "eth_getTransactionReceipt",
    txhash,
    apikey: apiKey,
    chainid: "1",
  });

  const [txRes, rcRes] = await Promise.all([fetch(txUrl), fetch(receiptUrl)]);
  const txJson = await txRes.json();
  const rcJson = await rcRes.json();

  const tx = txJson?.result ?? null;
  const receipt = rcJson?.result ?? null;

  return { tx, receipt };
}
