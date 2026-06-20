// web/src/lib/shared.ts
// Types, constants, dan utils (mirror @nexus-rwa/shared) untuk build Vercel tanpa workspace package.

// ============================================
// CORE TYPES — Nexus RWA
// ============================================

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AssetCategory =
  | "TREASURY"
  | "CREDIT"
  | "REAL_ESTATE"
  | "COMMODITIES"
  | "EQUITY";

export type Chain = "ethereum" | "base" | "polygon" | "arbitrum";

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

export type YieldHistoryPeriod = "7d" | "30d" | "90d";

export interface YieldHistoryPoint {
  timestamp: string;
  yield: number;
  tvl: number;
  riskScore?: number;
  methodologyVersion?: string;
}

export interface YieldHistoryResponse {
  assetId: string;
  period: YieldHistoryPeriod;
  limited_history: boolean;
  history: YieldHistoryPoint[];
  _meta: AssetDataMeta;
}

export type ComputedRiskLevel = "LOW" | "MEDIUM" | "HIGH";

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

export type MarketBriefRiskTone = "elevated" | "stable" | "improving";

/** AI-generated market-wide narrative for dashboard overview. */
export interface MarketBrief {
  headline: string;
  summary: string;
  whatChanged: string[];
  watchList: string[];
  riskTone: MarketBriefRiskTone;
  generatedAt: string;
}

export type DataConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface AssetDataMeta {
  sources: string[];
  lastUpdated: string;
  confidence: DataConfidence;
  methodology: string;
}

export type AssetGradeBand =
  | "research"
  | "analytics"
  | "institutional"
  | string;

export interface AssetGradeSummary {
  grade: AssetGradeBand;
  score: number;
  completenessScore: number;
  sourceScore: number;
  legalScore: number;
  reserveScore: number | null;
  liquidityScore: number;
  riskScore: number;
  blockers: string[];
  warnings: string[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  updatedAt?: string | null;
  gradingProfile?: string | null;
  assetClass?: string | null;
  instrumentType?: string | null;
  claimType?: string | null;
  publicSegment?: string | null;
  gradeContext?: string | null;
  profileScores?: Record<string, number | null>;
  applicability?: Record<string, string>;
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
  /** Risk level used for heatmaps and risk badges. */
  riskScore: RiskLevel;
  /** Numeric grading output from AssetGrade / grade-baseline; independent from risk level. */
  grade?: AssetGradeSummary | null;
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

export type InsightOutlook = "bullish" | "neutral" | "bearish";
export type InsightConfidence = "high" | "medium" | "low";

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
  /** Required non-advice disclaimer shown with every AI-generated insight. */
  disclaimer?: string;
  /** Data sources available to the AI when generating this insight. */
  sources?: string[];
  /** Number of unique sources available to the AI. */
  sourceCount?: number;
  /** AI model identifier or local fallback identifier used for generation. */
  modelVersion?: string;
  /** Internal prompt/version policy used for generation. */
  promptVersion?: string;
}

// ============================================
// X402 TYPES
// ============================================

export interface X402PaymentRequirement {
  scheme: "exact";
  network: "base" | "base-sepolia";
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

export const API_VERSION = "v1" as const;

export const NETWORKS = {
  ETHEREUM: "ethereum",
  BASE: "base",
  POLYGON: "polygon",
  ARBITRUM: "arbitrum",
} as const;

// ============================================
// UTILS
// ============================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatYield(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}
