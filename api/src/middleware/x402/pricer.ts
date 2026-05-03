import type { Price } from "@x402/core/types";

/**
 * Regex for detecting a dynamic resource id token (alphanumeric run of 8+, optional kebab suffixes).
 * Used per path segment after excluding reserved route literals.
 */
export const ID_SEGMENT_REGEX: RegExp = /^[a-zA-Z0-9]{8,}(-[a-zA-Z0-9]+)*$/;

/**
 * Static path segments that must never be replaced with `:id` (includes literals that would otherwise match {@link ID_SEGMENT_REGEX}).
 */
export const RESERVED_PATH_SEGMENTS: ReadonlySet<string> = new Set([
  "",
  "v1",
  "market",
  "overview",
  "assets",
  "search",
  "yield",
  "holders",
  "risk",
]);

/**
 * Human-facing catalog entry for a priced HTTP route pattern (`METHOD:path`).
 */
export interface EndpointPrice {
  /** Dollar-denominated charge, e.g. `"$0.005"` (aligned with x402 {@link Price} string form). */
  price: string;
  /** Short explanation for documentation and 402 responses. */
  description: string;
  /** True when no payment is required for this pattern. */
  isFree: boolean;
}

/**
 * Default {@link EndpointPrice} when no explicit pattern exists in {@link ENDPOINT_PRICING}.
 */
export const DEFAULT_ENDPOINT_PRICE: EndpointPrice = {
  price: "$0.001",
  description: "Standard rate for routes not listed in the X402 Nexus RWA price catalog.",
  isFree: false,
} as const;

/**
 * Maps each `METHOD:normalizedPath` key to its catalog entry for X402 Nexus RWA.
 */
export const ENDPOINT_PRICING: Readonly<Record<string, Readonly<EndpointPrice>>> = {
  "GET:/v1/market/overview": {
    price: "$0.00",
    description: "Public market overview snapshot.",
    isFree: true,
  },
  "GET:/v1/assets": {
    price: "$0.00",
    description: "Paginated list of tokenized real-world assets.",
    isFree: true,
  },
  "GET:/v1/assets/:id": {
    price: "$0.00",
    description: "Single asset profile and metadata.",
    isFree: true,
  },
  "GET:/v1/assets/:id/yield": {
    price: "$0.005",
    description: "Historical and projected yield for one asset.",
    isFree: false,
  },
  "GET:/v1/assets/:id/holders": {
    price: "$0.005",
    description: "Holder distribution and concentration metrics.",
    isFree: false,
  },
  "GET:/v1/assets/:id/risk": {
    price: "$0.003",
    description: "Risk scoring and factor breakdown for one asset.",
    isFree: false,
  },
  "GET:/v1/search": {
    price: "$0.00",
    description: "Full-text and faceted search across catalog fields.",
    isFree: true,
  },
} as const;

/**
 * Returns whether a single URL path segment should be collapsed to `:id` for pricing keys.
 */
function isDynamicIdSegment(segment: string): boolean {
  if (!segment || RESERVED_PATH_SEGMENTS.has(segment)) {
    return false;
  }
  if (ID_SEGMENT_REGEX.test(segment)) {
    return true;
  }
  // Kebab-case slugs like `ondo-usdy` (8+ alphanumeric total) that do not start with an 8+ plain run.
  if (/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)+$/u.test(segment)) {
    const alphanumericOnly: string = segment.replace(/-/g, "");
    return alphanumericOnly.length >= 8 && /^[a-zA-Z0-9]+$/u.test(alphanumericOnly);
  }
  return false;
}

/**
 * Normalizes an HTTP path by replacing dynamic id segments with the literal `:id` for catalog lookup.
 */
export function normalizePath(path: string): string {
  const withLeadingSlash: string = path.startsWith("/") ? path : `/${path}`;
  const segments: string[] = withLeadingSlash.split("/");
  const normalized: string[] = segments.map((segment: string): string => {
    if (segment === "") {
      return "";
    }
    return isDynamicIdSegment(segment) ? ":id" : segment;
  });
  return normalized.join("/");
}

/**
 * Resolves the catalog {@link EndpointPrice} for an HTTP method and raw path, using normalized pattern keys.
 */
export function getEndpointPrice(method: string, path: string): EndpointPrice {
  const normalizedPath: string = normalizePath(path);
  const lookupKey: string = `${method.toUpperCase()}:${normalizedPath}`;
  const hit: Readonly<EndpointPrice> | undefined = ENDPOINT_PRICING[lookupKey];
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

/**
 * Narrows a Nexus catalog dollar string to the x402 {@link Price} type for scheme configuration.
 */
export function toX402Price(price: string): Price {
  return price as Price;
}
