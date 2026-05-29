import { parseEther } from 'viem';
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
  'assets',
  'search',
  'yield',
  'holders',
  'risk',
  'history',
  'insight',
  'ask',
  'analytics',
  'bulk',
  'export',
]);

export type AccessTier = 'free' | 'pro' | 'enterprise';

export interface TierPlan {
  tier: AccessTier;
  /** Display ETH amount, e.g. `"0.001"`. */
  priceEth: string;
  /** Human duration label for 402 payloads, e.g. `"24h"`. */
  duration: string;
  /** Redis session TTL in seconds. */
  ttlSeconds: number;
  description: string;
}

export const TIER_PLANS: Readonly<Record<AccessTier, TierPlan>> = {
  free: {
    tier: 'free',
    priceEth: '0',
    duration: '',
    ttlSeconds: 0,
    description: 'Public tier — TVL, basic yield, risk level, asset list.',
  },
  pro: {
    tier: 'pro',
    priceEth: '0.001',
    duration: '24h',
    ttlSeconds: 86_400,
    description: 'Pro session — yield history, risk detail, holder intel (24h).',
  },
  enterprise: {
    tier: 'enterprise',
    priceEth: '0.01',
    duration: '7d',
    ttlSeconds: 604_800,
    description: 'Enterprise session — raw API, bulk export, all assets, priority RPC (7d).',
  },
} as const;

/**
 * Maps `METHOD:normalizedPath` to required access tier.
 * Paths may be listed with or without the `/api` prefix (normalized away).
 */
export const ENDPOINT_TIERS: Readonly<Record<string, AccessTier>> = {
  'GET:/v1/assets/:id/history': 'pro',
  'GET:/v1/assets/:id/risk': 'pro',
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
  priceEth: string;
  priceWei: string;
  duration: string;
  ttlSeconds: number;
}

export const DEFAULT_ENDPOINT_PRICE: EndpointPrice = {
  price: '$0.001',
  description: 'Standard rate for routes not listed in the X402 Nexus RWA price catalog.',
  isFree: false,
} as const;

export const ENDPOINT_PRICING: Readonly<Record<string, Readonly<EndpointPrice>>> = {
  'GET:/v1/market/overview': {
    price: '$0.00',
    description: 'Public market overview snapshot.',
    isFree: true,
  },
  'GET:/v1/assets': {
    price: '$0.00',
    description: 'Paginated list of tokenized real-world assets.',
    isFree: true,
  },
  'GET:/v1/assets/:id': {
    price: '$0.00',
    description: 'Single asset profile and metadata.',
    isFree: true,
  },
  'GET:/v1/assets/:id/yield': {
    price: '$0.00',
    description: 'Current yield snapshot for one asset.',
    isFree: true,
  },
  'GET:/v1/assets/:id/history': {
    price: '$0.001',
    description: 'Time-series yield and TVL history for one asset (Pro).',
    isFree: false,
  },
  'GET:/v1/assets/:id/holders': {
    price: '$0.001',
    description: 'Holder distribution and concentration metrics (Pro).',
    isFree: false,
  },
  'GET:/v1/assets/:id/risk': {
    price: '$0.001',
    description: 'Risk scoring, factor breakdown, and category benchmark (Pro).',
    isFree: false,
  },
  'GET:/v1/assets/:id/insight': {
    price: '$0.001',
    description: 'Claude-generated RWA insight: outlook, opportunities, risks (Pro).',
    isFree: false,
  },
  'GET:/v1/search': {
    price: '$0.00',
    description: 'Full-text and faceted search across catalog fields.',
    isFree: true,
  },
  'GET:/v1/analytics/bulk': {
    price: '$0.01',
    description: 'Bulk analytics export across all assets (Enterprise).',
    isFree: false,
  },
  'GET:/v1/export': {
    price: '$0.01',
    description: 'Full dataset bulk export (Enterprise).',
    isFree: false,
  },
  'POST:/v1/ask': {
    price: '$0.01',
    description: 'Natural-language Q&A over RWA data with streaming (Enterprise).',
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
  const key = lookupKey(method, path);
  const tier = getEndpointTier(method, path);
  const plan = TIER_PLANS[tier];
  const priced = getEndpointPrice(method, path);

  const priceEth = tier === 'free' ? '0' : plan.priceEth;
  const priceWei =
    tier === 'free' ? '0' : parseEther(plan.priceEth).toString();

  return {
    tier,
    priceEth,
    priceWei,
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
