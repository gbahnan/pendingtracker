export type FeeRecommendations = {
  fastestFee?: number;    // sat/vB
  halfHourFee?: number;   // sat/vB
  hourFee?: number;       // sat/vB
  economyFee?: number;    // sat/vB
  minimumFee?: number;    // sat/vB
};

export type TxStatus = {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number; // unix seconds
};

export type TxOutput = { scriptpubkey_address?: string; value?: number; scriptpubkey_type?: string; };\n\nexport type Vin = {
  txid?: string;
  vout?: number;
  sequence?: number;\n  prevout?: TxOutput;\n  is_coinbase?: boolean;
};

export type MempoolTx = {
  txid: string;
  fee?: number;     // sats
  vsize?: number;   // vbytes
  weight?: number;  // weight units
  status?: TxStatus;
  vin?: Vin[];\n  vout?: TxOutput[];\n  size?: number;\n  version?: number;\n  locktime?: number;
  // mempool.space often includes an "rbf" boolean; we treat it as optional to keep compatibility.
  rbf?: boolean;
};

export type DiagnosisCode =
  | "CONFIRMED"
  | "PENDING_OK"
  | "LOW_FEE"
  | "VERY_LOW_FEE"
  | "RBF_AVAILABLE"
  | "RBF_NOT_AVAILABLE"
  | "NOT_SEEN"
  | "PROVIDER_ERROR";

export type Diagnosis = {
  code: DiagnosisCode;
  title: string;
  summary: string;
  eta?: { minMinutes: number; maxMinutes: number; note?: string };
  confidence: "high" | "medium" | "low";
  actions: Array<{ label: string; detail: string }>;
  debug?: Record<string, unknown>;
};

export type BtcMvpResult = {
  txid: string;
  tx?: MempoolTx | null;
  status?: TxStatus | null;
  fees?: FeeRecommendations | null;
  feerateSatVb?: number | null;
  diagnosis: Diagnosis;
  provider: "mempool.space";
  fetchedAtIso: string;
};
