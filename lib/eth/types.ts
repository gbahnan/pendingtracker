export type EthDiagnosisCode = "CONFIRMED" | "PENDING" | "NOT_FOUND" | "PROVIDER_ERROR";

export type EthDiagnosis = {
  code: EthDiagnosisCode;
  title: string;
  summary: string;
  actions: { label: string; detail: string }[];
};

export type EthMvpResult = {
  chain: "ETH";
  txhash: string;

  confirmed: boolean;
  blockNumber?: string | null;
  confirmations?: number | null;

  from?: string | null;
  to?: string | null;
  valueWei?: string | null;

  gasUsed?: string | null;
  gasPriceWei?: string | null;
  maxFeePerGasWei?: string | null;
  maxPriorityFeePerGasWei?: string | null;

  provider: string;
  fetchedAtIso: string;

  raw?: any;
  diagnosis: EthDiagnosis;
};
