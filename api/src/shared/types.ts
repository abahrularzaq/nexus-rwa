// ============================================
// CORE TYPES — Nexus RWA
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AssetCategory =
  | 'TREASURY'
  | 'CREDIT'
  | 'REAL_ESTATE'
  | 'COMMODITIES'
  | 'EQUITY';

export type Chain = 'ethereum' | 'base' | 'polygon' | 'arbitrum';

// --- Asset ---
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  category: AssetCategory;
  chain: Chain;
  contractAddress: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Snapshot (data point per waktu) ---
export interface AssetSnapshot {
  id: string;
  assetId: string;
  tvl: number;
  yieldRate: number;
  holderCount: number;
  riskScore: RiskLevel;
  price: number;
  timestamp: Date;
}

// --- Yield Data ---
export interface YieldData {
  assetId: string;
  currentYield: number;
  avgYield7d: number;
  avgYield30d: number;
  avgYield90d: number;
  history: YieldPoint[];
}

export interface YieldPoint {
  date: string;
  yield: number;
}

// --- Risk Data ---
export interface RiskData {
  assetId: string;
  overallScore: RiskLevel;
  liquidityScore: number;
  concentrationScore: number;
  protocolAgeScore: number;
  volatilityScore: number;
  calculatedAt: Date;
}

// --- Holder Data ---
export interface HolderData {
  assetId: string;
  totalHolders: number;
  top10Concentration: number;
  whaleCount: number;
  retailCount: number;
  updatedAt: Date;
}

// --- Market Overview ---
export interface MarketOverview {
  totalTvl: number;
  totalAssets: number;
  avgYieldRate: number;
  totalHolders: number;
  topGainers: AssetSummary[];
  topLosers: AssetSummary[];
  updatedAt: Date;
}

export interface AssetSummary {
  id: string;
  name: string;
  symbol: string;
  /** Populated on paginated list / search rows from full asset record. */
  protocol?: string;
  category?: AssetCategory;
  chain?: Chain;
  tvl: number;
  yieldRate: number;
  riskScore: RiskLevel;
  change7d: number;
  holderCount?: number;
}

// ============================================
// API TYPES
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  cached: boolean;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// X402 TYPES
// ============================================

export interface X402PaymentRequirement {
  scheme: 'exact';
  network: 'base' | 'base-sepolia';
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
}

export interface X402PaymentProof {
  from: string;
  txHash: string;
  network: string;
  amount: string;
}
