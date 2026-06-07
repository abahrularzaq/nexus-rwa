import { formatUnits } from "viem";

export type AccessTier = "free" | "pro" | "enterprise";

/** X402 payment details returned on HTTP 402 from the API. */
export type X402Details = {
  price: string;
  amount?: string;
  currency: string;
  decimals?: number;
  network: string;
  recipient: string;
  endpoint: string;
  asset?: string;
  tier?: AccessTier;
  duration?: string;
};

export type TierInfo = {
  tier: AccessTier;
  price: string;
  duration: string;
};

/** Typical JSON body when the backend responds with 402 Payment Required. */
export type X402ErrorResponse = {
  error: string;
  tier?: TierInfo;
  x402: X402Details;
};

export function isX402ErrorBody(value: unknown): value is X402ErrorResponse {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.x402 && typeof o.x402 === "object") {
    const d = o.x402 as Record<string, unknown>;
    return (
      typeof d.price === "string" &&
      typeof d.network === "string" &&
      typeof d.recipient === "string"
    );
  }
  return false;
}

/** Parse native API 402 (`tier` + `x402` / `accepts`) for USDC x402 exact payment metadata. */
export function parseX402Response(
  body: unknown,
  fallbackEndpoint: string,
): { x402: X402Details; tier?: TierInfo } | null {
  if (isX402ErrorBody(body)) {
    return {
      x402: {
        ...body.x402,
        currency: body.x402.currency ?? "USDC",
        endpoint: body.x402.endpoint ?? fallbackEndpoint,
      },
      tier: body.tier,
    };
  }

  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const tierBlock = o.tier as Record<string, unknown> | undefined;
  const tierInfo: TierInfo | undefined =
    tierBlock &&
    typeof tierBlock.tier === "string" &&
    typeof tierBlock.price === "string"
      ? {
          tier: tierBlock.tier as AccessTier,
          price: String(tierBlock.price),
          duration: String(tierBlock.duration ?? ""),
        }
      : undefined;

  const embedded = o.x402 as Record<string, unknown> | undefined;
  if (embedded && typeof embedded.price === "string") {
    return {
      x402: {
        price: String(embedded.price),
        amount: typeof embedded.amount === "string" ? embedded.amount : undefined,
        currency: String(embedded.currency ?? "USDC"),
        decimals:
          typeof embedded.decimals === "number" ? embedded.decimals : undefined,
        network: String(embedded.network),
        recipient: String(embedded.recipient),
        endpoint: String(embedded.endpoint ?? fallbackEndpoint),
        asset: typeof embedded.asset === "string" ? embedded.asset : undefined,
        tier: embedded.tier as AccessTier | undefined,
        duration: embedded.duration as string | undefined,
      },
      tier: tierInfo,
    };
  }

  const accepts = o.accepts as Array<Record<string, unknown>> | undefined;
  const accept = accepts?.[0];
  if (!accept) return null;

  const extra = accept.extra as Record<string, unknown> | undefined;
  const tierFromExtra = extra?.tier as AccessTier | undefined;
  const decimals = typeof extra?.decimals === "number" ? extra.decimals : 6;
  const maxAmountRequired = accept.maxAmountRequired;

  let price =
    typeof extra?.priceUsdc === "string"
      ? extra.priceUsdc
      : tierInfo?.price ?? "3.00";

  if (typeof maxAmountRequired === "string" && maxAmountRequired !== "0") {
    try {
      price = formatUnits(BigInt(maxAmountRequired), decimals);
    } catch {
      // Keep price from metadata.
    }
  }

  return {
    x402: {
      price,
      amount:
        typeof maxAmountRequired === "string" ? maxAmountRequired : undefined,
      currency: "USDC",
      decimals,
      network: String(accept.network ?? o.network ?? "base-sepolia"),
      recipient: String(accept.payTo ?? ""),
      endpoint: String(accept.resource ?? fallbackEndpoint),
      asset: typeof accept.asset === "string" ? accept.asset : undefined,
      tier: tierFromExtra ?? tierInfo?.tier,
      duration:
        typeof extra?.duration === "string"
          ? extra.duration
          : tierInfo?.duration,
    },
    tier: tierInfo,
  };
}
