// web/src/lib/shared.ts
// Types, constants, dan utils (mirror @nexus-rwa/shared) untuk build Vercel tanpa workspace package.

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

export interface YieldData {
  assetId: string;
  currentYield: number;
  avgYield7d: number;
  avgYield30d: number;
  avgYield90d: number;
  history: YieldPoint[];
  _meta: AssetDataMeta;
}

export interface YieldPoint {
  date: string;
  yield: number;
}

export type YieldHistoryPeriod = '7d' | '30d' | '90d';

export interface YieldHistoryPoint {
  timestamp: string;
  yield: number;
  tvl: number;
}

export interface YieldHistoryResponse {
  assetId: string;
  period: YieldHistoryPeriod;
  limited_history: boolean;
  history: YieldHistoryPoint[];
  _meta: AssetDataMeta;
}

export type ComputedRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskData {
  assetId: string;
  /** 0–100; higher = safer. */
  score: number;
  level: ComputedRiskLevel;
  factors: string[];
  updatedAt: string | Date | null;
  _meta: AssetDataMeta;
}

export interface HolderData {
  assetId: string;
  totalHolders: number;
  top10Concentration: number;
  whaleCount: number;
  retailCount: number;
  updatedAt: Date;
  _meta: AssetDataMeta;
}

export interface MarketOverview {
  totalTvl: number;
  totalAssets: number;
  avgYieldRate: number;
  totalHolders: number;
  topGainers: AssetSummary[];
  topLosers: AssetSummary[];
  updatedAt: Date;
}

export type MarketBriefRiskTone = 'elevated' | 'stable' | 'improving';

/** AI-generated market-wide narrative for dashboard overview. */
export interface MarketBrief {
  headline: string;
  summary: string;
  whatChanged: string[];
  watchList: string[];
  riskTone: MarketBriefRiskTone;
  generatedAt: string;
}

export type DataConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AssetDataMeta {
  sources: string[];
  lastUpdated: string;
  confidence: DataConfidence;
  methodology: string;
}

export interface AssetSummary {
  id: string;
  name: string;
  symbol: string;
  protocol?: string;
  category?: AssetCategory;
  chain?: Chain;
  tvl: number;
  yieldRate: number;
  riskScore: RiskLevel;
  change7d: number;
  holderCount?: number;
  _meta: AssetDataMeta;
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

export type InsightOutlook = 'bullish' | 'neutral' | 'bearish';
export type InsightConfidence = 'high' | 'medium' | 'low';

export interface AssetInsight {
  assetId: string;
  summary: string;
  opportunities: string[];
  risks: string[];
  outlook: InsightOutlook;
  confidence: InsightConfidence;
  /** Recent yield/TVL/risk shifts for this asset (2–3 bullets). */
  whatChanged?: string[];
  /** Items to monitor next (2–3 bullets). */
  watchList?: string[];
  generatedAt: string;
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

// ============================================
// CONSTANTS
// ============================================

export const X402_PRICING = {
  MARKET_OVERVIEW: 0,
  ASSETS_LIST: 500,
  ASSET_DETAIL: 1000,
  ASSET_YIELD: 5000,
  ASSET_HOLDERS: 5000,
  ASSET_RISK: 5000,
  SEARCH: 1000,
  STREAM_PER_MIN: 10000,
} as const;

export const CACHE_TTL = {
  MARKET_OVERVIEW: 60,
  MARKET_BRIEF: 8 * 60 * 60,
  ASSETS_LIST: 120,
  ASSET_DETAIL: 300,
  YIELD_DATA: 600,
  HOLDER_DATA: 600,
  RISK_DATA: 900,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const API_VERSION = 'v1' as const;

export const NETWORKS = {
  MAINNET: 'base',
  TESTNET: 'base-sepolia',
} as const;

export const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const ERROR_CODES = {
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_INVALID: 'PAYMENT_INVALID',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATA_NOT_AVAILABLE: 'DATA_NOT_AVAILABLE',
} as const;

// ============================================
// UTILS (Web Crypto — aman di client & server Next.js)
// ============================================

function randomRequestIdSuffix(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID().replace(/-/g, '').slice(0, 20);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.replace(/-/g, '').slice(0, 20);
}

export function createMeta(cached = false): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: `req_${randomRequestIdSuffix()}`,
    cached,
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatYield(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
