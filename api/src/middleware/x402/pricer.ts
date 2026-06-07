import { parseUnits } from 'viem';
import type { Price } from '@x402/core/types';

/**
 * Regex for detecting a dynamic resource id token (alphanumeric run of 8+, optional kebab suffixes).
 */
export const ID_SEGMENT_REGEX: RegExp = /^[a-zA-Z0-9]{8,}(-[a-zA-Z0-9]+)*$/;

export const RESERVED_PATH_SEGMENTS: ReadonlySet<string> = new Set([
  '',
  'v1',
  'api',
  'market',
  'overview',
  'brief',
  'assets',
  'search',
  'yield',
  'holders',
  'risk',
  'history',
  'events',
  'full',
  'sources',
  'insight',
  'admin',
  'ask',
  'analytics',
  'bulk',
  'export',
]);

export type AccessTier = 'free' | 'pro' | 'enterprise';
export type SettlementCurrency = 'USDC';

export const SETTLEMENT_CURRENCY: SettlementCurrency = 'USDC';
export const SETTLEMENT_DECIMALS = 6;

export interface TierPlan {
  tier: AccessTier;
  label: string;
  /** User-facing USD price for product/UI copy. */
  priceUsd: string;
  /** x402 settlement amount in USDC. */
  priceUsdc: string;
  /** User-facing display price for product/UI copy. */
  displayPrice: string;
  /** Human duration label for 402 payloads, e.g. `"24h"`. */
  duration: string;
  /** Redis session TTL in seconds. */
  ttlSeconds: number;
  description: string;
}

export const TIER_PLANS: Readonly<Record<AccessTier, TierPlan>> = {
  free: {
    tier: 'free',
    label: 'Free',
    priceUsd: '0.00',
    priceUsdc: '0.00',
    displayPrice: '$0',
    duration: '',
    ttlSeconds: 0,
    description: 'Public discovery tier — asset catalog, public market snapshot, current yield, risk level, and grade label.',
  },
  pro: {
    tier: 'pro',
    label: 'Pro 24h Pass',
    priceUsd: '3.00',
    priceUsdc: '3.00',
    displayPrice: '$3 / 24h',
    duration: '24h',
    ttlSeconds: 86_400,
    description: 'Pro analyst pass — full asset profile, risk breakdown, reserve, compliance, liquidity, source trail, history, and AI insight for 24h.',
  },
  enterprise: {
    tier: 'enterprise',
    label: 'Enterprise 7d Pass',
    priceUsd: '29.00',
    priceUsdc: '29.00',
    displayPrice: '$29 / 7d',
    duration: '7d',
    ttlSeconds: 604_800,
    description: 'Enterprise API pass — full raw dataset, bulk export, Ask Nexus, commercial API workflows, and machine-readable access for 7d.',
  },
} as const;

/**
 * Product pricing copy. Subscription packages remain roadmap-only; x402 settlement uses USDC access passes above.
 */
export const PRODUCT_PRICING = {
  free: {
    label: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'Public RWA discovery dashboard.',
  },
  proPass: {
    label: 'Pro 24h Pass',
    price: '$3',
    cadence: '24h',
    description: 'Full analyst-grade asset profiles for individual researchers.',
  },
  enterprisePass: {
    label: 'Enterprise 7d Pass',
    price: '$29',
    cadence: '7d',
    description: 'Machine-readable RWA dataset access for builders and AI agents.',
  },
  enterprise: {
    label: 'Enterprise Custom',
    price: 'Custom',
    cadence: 'contract',
    description: 'Custom data licensing, higher rate limits, and priority asset coverage.',
  },
} as const;

/**
 * Maps `METHOD:normalizedPath` to required access tier.
 * Paths may be listed with or without the `/api` prefix (normalized away).
 */
export const ENDPOINT_TIERS: Readonly<Record<string, AccessTier>> = {
  'GET:/v1/assets/:id/full': 'pro',
  'GET:/v1/assets/:id/history': 'pro',
  'GET:/v1/assets/:id/risk': 'pro',
  'GET:/v1/assets/:id/sources': 'pro',
  'GET:/v1/assets/:id/holders': 'pro',
  'GET:/v1/assets/:id/insight': 'pro',
  'GET:/v1/analytics/bulk': 'enterprise',
  'GET:/v1/export': 'enterprise',
  'POST:/v1/ask': 'enterprise',
} as const;

export interface EndpointPrice {
  price: string;
  description: string;
  isFree: boolean;
}

export interface EndpointAccessConfig extends EndpointPrice {
  tier: AccessTier;
  label: string;
  priceUsd: string;
  displayPrice: string;
  priceUsdc: string;
  priceUsdcAtomic: string;
  settlementCurrency: SettlementCurrency;
  settlementDecimals: number;
  duration: string;
  ttlSeconds: number;
}

export const DEFAULT_ENDPOINT_PRICE: EndpointPrice = {
  price: '$3 / 24h',
  description: 'Standard Pro analyst access for routes not listed in the Nexus RWA price catalog.',
  isFree: false,
} as const;

export const ENDPOINT_PRICING: Readonly<Record<string, Readonly<EndpointPrice>>> = {
  'GET:/v1/market/overview': {
    price: '$0',
    description: 'Public market overview snapshot.',
    isFree: true,
  },
  'GET:/v1/market/brief': {
    price: '$0',
    description: 'Public market brief: headline, summary, 7d changes, and watch list.',
    isFree: true,
  },
  'GET:/v1/assets': {
    price: '$0',
    description: 'Public paginated catalog of tokenized real-world assets.',
    isFree: true,
  },
  'GET:/v1/assets/:id': {
    price: '$0',
    description: 'Public asset profile with market summary, current yield, risk level, grade label, and public events.',
    isFree: true,
  },
  'GET:/v1/assets/:id/yield': {
    price: '$0',
    description: 'Current yield snapshot for one asset.',
    isFree: true,
  },
  'GET:/v1/assets/:id/events': {
    price: '$0',
    description: 'Public asset events timeline such as launches, audits, and incidents.',
    isFree: true,
  },
  'GET:/v1/assets/:id/full': {
    price: '$3 / 24h',
    description: 'Full Pro asset profile with reserve, compliance, liquidity, risk, sources, history, and AI narrative.',
    isFree: false,
  },
  'GET:/v1/assets/:id/history': {
    price: '$3 / 24h',
    description: 'Pro time-series yield, TVL, holder, and risk history for one asset.',
    isFree: false,
  },
  'GET:/v1/assets/:id/holders': {
    price: '$3 / 24h',
    description: 'Pro holder distribution and concentration metrics.',
    isFree: false,
  },
  'GET:/v1/assets/:id/risk': {
    price: '$3 / 24h',
    description: 'Pro risk scoring, factor breakdown, mitigants, and grade context.',
    isFree: false,
  },
  'GET:/v1/assets/:id/sources': {
    price: '$3 / 24h',
    description: 'Pro field-level source trail and reliability metadata.',
    isFree: false,
  },
  'GET:/v1/assets/:id/insight': {
    price: '$3 / 24h',
    description: 'Pro AI-generated RWA insight with outlook, opportunities, risks, and watch list.',
    isFree: false,
  },
  'GET:/v1/search': {
    price: '$0',
    description: 'Public full-text and faceted search across catalog fields.',
    isFree: true,
  },
  'GET:/v1/analytics/bulk': {
    price: '$29 / 7d',
    description: 'Enterprise bulk analytics snapshot across all assets.',
    isFree: false,
  },
  'GET:/v1/export': {
    price: '$29 / 7d',
    description: 'Enterprise full dataset export for machine-readable workflows.',
    isFree: false,
  },
  'POST:/v1/ask': {
    price: '$29 / 7d',
    description: 'Enterprise natural-language Q&A over RWA data with streaming.',
    isFree: false,
  },
} as const;

function isDynamicIdSegment(segment: string): boolean {
  if (!segment || RESERVED_PATH_SEGMENTS.has(segment)) {
    return false;
  }
  if (ID_SEGMENT_REGEX.test(segment)) {
    return true;
  }
  if (/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)+$/u.test(segment)) {
    const alphanumericOnly: string = segment.replace(/-/g, '');
    return alphanumericOnly.length >= 8 && /^[a-zA-Z0-9]+$/u.test(alphanumericOnly);
  }
  return false;
}

/** Strips optional `/api` prefix so `/api/v1/...` and `/v1/...` share catalog keys. */
export function normalizePath(path: string): string {
  const withLeadingSlash: string = path.startsWith('/') ? path : `/${path}`;
  const segments: string[] = withLeadingSlash.split('/');
  const stripped =
    segments[1] === 'api' ? ['', ...segments.slice(2)] : segments;
  const normalized: string[] = stripped.map((segment: string): string => {
    if (segment === '') {
      return '';
    }
    return isDynamicIdSegment(segment) ? ':id' : segment;
  });
  return normalized.join('/');
}

function lookupKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${normalizePath(path)}`;
}

export function getEndpointTier(method: string, path: string): AccessTier {
  const key = lookupKey(method, path);
  const explicit = ENDPOINT_TIERS[key];
  if (explicit) return explicit;
  return 'free';
}

export function getEndpointPrice(method: string, path: string): EndpointPrice {
  const key = lookupKey(method, path);
  const hit = ENDPOINT_PRICING[key];
  if (hit !== undefined) {
    return {
      price: hit.price,
      description: hit.description,
      isFree: hit.isFree,
    };
  }
  return {
    price: DEFAULT_ENDPOINT_PRICE.price,
    description: DEFAULT_ENDPOINT_PRICE.description,
    isFree: DEFAULT_ENDPOINT_PRICE.isFree,
  };
}

/** Full tier + pricing config for middleware (tier from {@link ENDPOINT_TIERS}, not hardcoded). */
export function getEndpointAccessConfig(method: string, path: string): EndpointAccessConfig {
  const tier = getEndpointTier(method, path);
  const plan = TIER_PLANS[tier];
  const priced = getEndpointPrice(method, path);

  const priceUsdc = tier === 'free' ? '0.00' : plan.priceUsdc;
  const priceUsdcAtomic =
    tier === 'free' ? '0' : parseUnits(plan.priceUsdc, SETTLEMENT_DECIMALS).toString();

  return {
    tier,
    label: plan.label,
    priceUsd: plan.priceUsd,
    displayPrice: plan.displayPrice,
    priceUsdc,
    priceUsdcAtomic,
    settlementCurrency: SETTLEMENT_CURRENCY,
    settlementDecimals: SETTLEMENT_DECIMALS,
    duration: plan.duration,
    ttlSeconds: plan.ttlSeconds,
    price: priced.price,
    description: priced.description,
    isFree: tier === 'free',
  };
}

export function toX402Price(price: string): Price {
  return price as Price;
}
