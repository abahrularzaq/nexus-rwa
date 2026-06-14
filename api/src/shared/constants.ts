// ============================================
// CONSTANTS — Nexus RWA
// ============================================

// X402 Pricing (dalam USDC micro units, 6 decimals)
// $0.001 USDC = 1000 units
export const X402_PRICING = {
  MARKET_OVERVIEW: 0, // Gratis
  ASSETS_LIST: 500, // $0.0005
  ASSET_DETAIL: 1000, // $0.001
  ASSET_YIELD: 5000, // $0.005
  ASSET_HOLDERS: 5000, // $0.005
  ASSET_RISK: 3000, // $0.003
  SEARCH: 1000, // $0.001
  STREAM_PER_MIN: 10000, // $0.01/menit
} as const;

// Cache TTL (detik)
export const CACHE_TTL = {
  MARKET_OVERVIEW: 60,
  ASSETS_LIST: 120,
  ASSET_DETAIL: 300,
  YIELD_DATA: 600,
  HOLDER_DATA: 600,
  RISK_DATA: 900,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// API versions
export const API_VERSION = 'v1' as const;

// Base Network
export const NETWORKS = {
  MAINNET: 'base',
  TESTNET: 'base-sepolia',
} as const;

// USDC contract di Base
export const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Error codes
export const ERROR_CODES = {
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_INVALID: 'PAYMENT_INVALID',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATA_NOT_AVAILABLE: 'DATA_NOT_AVAILABLE',
} as const;
