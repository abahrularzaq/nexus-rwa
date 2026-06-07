import type { MiddlewareHandler, Context } from 'hono';
import { getAddress, isHex } from 'viem';
import {
  getEndpointAccessConfig,
  type EndpointAccessConfig,
  TIER_PLANS,
} from './x402/pricer.js';
import { logger } from '../lib/logger.js';
import {
  grantTierSession,
  hasTierAccess,
  normalizeWallet,
} from '../lib/x402-session.js';
import {
  hasAccessTier,
  resolveApiKeyEntitlement,
} from '../lib/api-key-entitlement.js';

const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const DEFAULT_FACILITATOR_URL = 'https://x402.org/facilitator';

type PaymentRequirement = {
  scheme: 'exact';
  network: 'base' | 'base-sepolia';
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: Record<string, unknown>;
};

type FacilitatorResult = {
  ok: boolean;
  payer?: string;
  txHash?: string;
  raw: unknown;
  error?: string;
  facilitatorUrl?: string;
  cause?: unknown;
};

function readPaymentRecipientEnv(): string {
  return (
    process.env.PAYMENT_RECIPIENT?.trim() ||
    process.env.X402_RECEIVING_ADDRESS?.trim() ||
    ''
  );
}

function facilitatorUrl(): string {
  return (
    process.env.X402_FACILITATOR_URL?.trim() ||
    process.env.FACILITATOR_URL?.trim() ||
    DEFAULT_FACILITATOR_URL
  ).replace(/\/+$/u, '');
}

function describeError(value: unknown): Record<string, unknown> {
  if (!(value instanceof Error)) {
    return { value: String(value) };
  }
  const cause = (value as Error & { cause?: unknown }).cause;
  const out: Record<string, unknown> = {
    name: value.name,
    message: value.message,
  };
  if (cause instanceof Error) {
    out.cause = {
      name: cause.name,
      message: cause.message,
      code: (cause as Error & { code?: unknown }).code,
      errno: (cause as Error & { errno?: unknown }).errno,
      syscall: (cause as Error & { syscall?: unknown }).syscall,
      hostname: (cause as Error & { hostname?: unknown }).hostname,
      address: (cause as Error & { address?: unknown }).address,
      port: (cause as Error & { port?: unknown }).port,
    };
  } else if (cause !== undefined) {
    out.cause = cause;
  }
  return out;
}

export function assertX402Env(): void {
  const raw = process.env.X402_NETWORK?.trim();
  if (!raw) {
    throw new Error(
      'X402_NETWORK is required. Set to "base" (mainnet) or "base-sepolia" (testnet).',
    );
  }
  if (raw !== 'base' && raw !== 'base-sepolia') {
    throw new Error(
      `X402_NETWORK must be "base" or "base-sepolia", got: "${raw}"`,
    );
  }

  const recipient = readPaymentRecipientEnv();
  if (!recipient) {
    throw new Error(
      'PAYMENT_RECIPIENT or X402_RECEIVING_ADDRESS is required for x402 USDC payments.',
    );
  }
  try {
    getAddress(recipient);
  } catch {
    throw new Error(
      `PAYMENT_RECIPIENT / X402_RECEIVING_ADDRESS must be a valid EVM address, got: "${recipient}"`,
    );
  }
}

export function getX402Network(): 'base' | 'base-sepolia' {
  const raw = process.env.X402_NETWORK?.trim();
  if (raw !== 'base' && raw !== 'base-sepolia') {
    throw new Error('X402_NETWORK invalid or unset — call assertX402Env() at startup.');
  }
  return raw;
}

function getChainId(): 8453 | 84532 {
  return getX402Network() === 'base' ? 8453 : 84532;
}

function x402Meta() {
  return {
    network: process.env.X402_NETWORK,
    chainId: getChainId(),
  };
}

function getReceivingAddress(): string {
  return getAddress(readPaymentRecipientEnv());
}

function getUsdcAddress(): string {
  return getX402Network() === 'base' ? USDC_MAINNET : USDC_SEPOLIA;
}

export type VerifyPaymentResult = {
  verified: boolean;
  blockNumber: number;
  timestamp: number;
  from?: string;
};

/** Deprecated native-ETH verifier kept for compatibility with older imports. */
export async function verifyPayment(
  txHash: string,
  _expectedAmount: string,
  _recipient: string,
): Promise<VerifyPaymentResult> {
  if (!isHex(txHash) || txHash.length !== 66) {
    return { verified: false, blockNumber: 0, timestamp: 0 };
  }
  return { verified: false, blockNumber: 0, timestamp: 0 };
}

function tierPayload(config: EndpointAccessConfig) {
  if (config.tier === 'free') return null;
  return {
    tier: config.tier,
    label: config.label,
    price: config.priceUsdc,
    priceUsd: config.priceUsd,
    priceUsdc: config.priceUsdc,
    priceUsdcAtomic: config.priceUsdcAtomic,
    settlementCurrency: config.settlementCurrency,
    settlementDecimals: config.settlementDecimals,
    displayPrice: config.displayPrice,
    duration: config.duration,
  };
}

function buildPaymentRequirement(
  path: string,
  config: EndpointAccessConfig,
): PaymentRequirement {
  const plan = TIER_PLANS[config.tier];
  return {
    scheme: 'exact',
    network: getX402Network(),
    maxAmountRequired: config.priceUsdcAtomic,
    resource: path,
    description: plan.description,
    mimeType: 'application/json',
    payTo: getReceivingAddress(),
    maxTimeoutSeconds: 300,
    asset: getUsdcAddress(),
    extra: {
      name: 'USD Coin',
      version: '2',
      decimals: config.settlementDecimals,
      tier: config.tier,
      label: config.label,
      priceUsd: config.priceUsd,
      priceUsdc: config.priceUsdc,
      displayPrice: config.displayPrice,
      duration: config.duration,
    },
  };
}

function paymentRequiredJson(path: string, config: EndpointAccessConfig) {
  const tierInfo = tierPayload(config);
  const requirement = buildPaymentRequirement(path, config);

  return {
    ...x402Meta(),
    x402Version: 1,
    error: 'Payment required',
    ...(tierInfo ? { tier: tierInfo } : {}),
    pricing: {
      tier: config.tier,
      label: config.label,
      displayPrice: config.displayPrice,
      priceUsd: config.priceUsd,
      priceUsdc: config.priceUsdc,
      priceUsdcAtomic: config.priceUsdcAtomic,
      settlementCurrency: config.settlementCurrency,
      settlementDecimals: config.settlementDecimals,
      duration: config.duration || undefined,
      description: config.description,
    },
    x402: {
      price: config.priceUsdc,
      amount: config.priceUsdcAtomic,
      currency: config.settlementCurrency,
      decimals: config.settlementDecimals,
      network: getX402Network(),
      recipient: getReceivingAddress(),
      endpoint: path,
      tier: config.tier,
      duration: config.duration || undefined,
      asset: getUsdcAddress(),
    },
    accepts: [requirement],
  };
}

function walletFromContext(c: Context): string | null {
  const header = c.req.header('X-Wallet-Address')?.trim();
  if (header) return normalizeWallet(header);
  return null;
}

async function tryApiKeyBypass(
  c: Context,
  config: EndpointAccessConfig,
  next: () => Promise<void>,
): Promise<boolean> {
  const entitlement = await resolveApiKeyEntitlement(c);
  if (!entitlement) return false;
  if (!hasAccessTier(entitlement.accessTier, config.tier)) return false;

  c.header('X-Payment-Status', 'api-key');
  c.header('X-Payment-Tier', entitlement.accessTier);
  c.header('X-Api-Key-Prefix', entitlement.prefix);
  await next();
  return true;
}

async function trySessionBypass(
  c: Context,
  config: EndpointAccessConfig,
  next: () => Promise<void>,
): Promise<boolean> {
  const wallet = walletFromContext(c);
  if (!wallet) return false;

  const allowed = await hasTierAccess(wallet, config.tier);
  if (!allowed) return false;

  c.header('X-Payment-Status', 'session');
  c.header('X-Payment-Tier', config.tier);
  c.header('X-Wallet-Address', wallet);
  await next();
  return true;
}

function decodePaymentHeader(header: string): unknown {
  const raw = header.trim();
  if (raw.startsWith('{')) return JSON.parse(raw);

  const decoded = Buffer.from(raw, 'base64').toString('utf8');
  if (decoded.startsWith('{')) return JSON.parse(decoded);

  return raw;
}

function recordValue(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function extractPayer(...values: unknown[]): string | undefined {
  for (const value of values) {
    const candidates = [
      recordValue(value, ['payer']),
      recordValue(value, ['from']),
      recordValue(value, ['payload', 'authorization', 'from']),
      recordValue(value, ['paymentPayload', 'payload', 'authorization', 'from']),
    ];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const normalized = normalizeWallet(candidate);
      if (normalized) return normalized;
    }
  }
  return undefined;
}

function extractTxHash(...values: unknown[]): string | undefined {
  for (const value of values) {
    const candidates = [
      recordValue(value, ['txHash']),
      recordValue(value, ['transactionHash']),
      recordValue(value, ['tx']),
      recordValue(value, ['transaction']),
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length > 0) return candidate;
    }
  }
  return undefined;
}

function isFacilitatorOk(body: unknown): boolean {
  const candidates = [
    recordValue(body, ['isValid']),
    recordValue(body, ['valid']),
    recordValue(body, ['success']),
    recordValue(body, ['settled']),
  ];
  return candidates.some((v) => v === true);
}

async function callFacilitator(
  action: 'verify' | 'settle',
  paymentPayload: unknown,
  paymentRequirements: PaymentRequirement,
): Promise<FacilitatorResult> {
  const url = `${facilitatorUrl()}/${action}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload,
        paymentRequirements,
      }),
    });

    const raw = await res.json().catch(() => null);
    const ok = res.ok && isFacilitatorOk(raw);
    return {
      ok,
      payer: extractPayer(raw, paymentPayload),
      txHash: extractTxHash(raw),
      raw,
      facilitatorUrl: url,
      error:
        typeof recordValue(raw, ['error']) === 'string'
          ? String(recordValue(raw, ['error']))
          : typeof recordValue(raw, ['invalidReason']) === 'string'
            ? String(recordValue(raw, ['invalidReason']))
            : res.ok
              ? undefined
              : `Facilitator ${action} failed with HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      raw: null,
      facilitatorUrl: url,
      error: err instanceof Error ? err.message : `Facilitator ${action} request failed`,
      cause: describeError(err),
    };
  }
}

async function tryFacilitatorPayment(
  c: Context,
  config: EndpointAccessConfig,
  next: () => Promise<void>,
): Promise<'bypassed' | 'rejected' | 'none'> {
  const paymentHeader =
    c.req.header('X-Payment')?.trim() ||
    c.req.header('X-Payment-Tx')?.trim();
  if (!paymentHeader) return 'none';

  const path = c.req.path;
  const requirement = buildPaymentRequirement(path, config);

  let paymentPayload: unknown;
  try {
    paymentPayload = decodePaymentHeader(paymentHeader);
  } catch (err) {
    logger.warn({ err }, 'Invalid x402 payment header');
    return 'rejected';
  }

  const verify = await callFacilitator('verify', paymentPayload, requirement);
  if (!verify.ok) {
    logger.warn(
      {
        error: verify.error,
        cause: verify.cause,
        facilitatorUrl: verify.facilitatorUrl,
        raw: verify.raw,
      },
      'x402 facilitator verify rejected payment',
    );
    return 'rejected';
  }

  const settle = await callFacilitator('settle', paymentPayload, requirement);
  if (!settle.ok) {
    logger.warn(
      {
        error: settle.error,
        cause: settle.cause,
        facilitatorUrl: settle.facilitatorUrl,
        raw: settle.raw,
      },
      'x402 facilitator settle rejected payment',
    );
    return 'rejected';
  }

  const wallet =
    walletFromContext(c) ??
    settle.payer ??
    verify.payer ??
    extractPayer(paymentPayload);

  if (!wallet) {
    logger.warn('x402 facilitator settled payment but payer wallet was not resolved');
    return 'rejected';
  }

  if (config.tier === 'pro' || config.tier === 'enterprise') {
    await grantTierSession(wallet, config.tier);
  }

  c.header('X-Payment-Verified', 'true');
  c.header('X-Payment-Status', 'settled');
  c.header('X-Payment-Tier', config.tier);
  c.header('X-Wallet-Address', wallet);
  const txHash = settle.txHash ?? verify.txHash;
  if (txHash) c.header('X-Payment-TxHash', txHash);

  await next();
  return 'bypassed';
}

function paymentRejectedJson(path: string, config: EndpointAccessConfig) {
  return {
    ...paymentRequiredJson(path, config),
    error: 'PAYMENT_VERIFICATION_FAILED',
    message:
      'USDC x402 payment could not be verified and settled by the facilitator. Please sign a fresh payment authorization and try again.',
  };
}

export function createNexusX402Middleware(): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      const method = c.req.method;
      const path = c.req.path;
      const config = getEndpointAccessConfig(method, path);

      if (config.isFree) {
        await next();
        return;
      }

      if (await tryApiKeyBypass(c, config, next)) {
        return;
      }

      if (await trySessionBypass(c, config, next)) {
        return;
      }

      const paymentBypass = await tryFacilitatorPayment(c, config, next);
      if (paymentBypass === 'bypassed') return;
      if (paymentBypass === 'rejected') {
        return c.json(paymentRejectedJson(path, config), 402);
      }

      return c.json(paymentRequiredJson(path, config), 402);
    } catch (error) {
      logger.error({ error }, 'X402 middleware unexpected error');
      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Terjadi kesalahan internal',
          },
        },
        500,
      );
    }
  };
}

export function createGatedTxPaymentMiddleware(): MiddlewareHandler {
  return async (c: Context, next) => {
    if (c.req.method === 'OPTIONS') {
      await next();
      return;
    }
    try {
      const path = c.req.path;
      const config = getEndpointAccessConfig(c.req.method, path);

      if (await tryApiKeyBypass(c, config, next)) {
        return;
      }

      if (await trySessionBypass(c, config, next)) {
        return;
      }

      const paymentBypass = await tryFacilitatorPayment(c, config, next);
      if (paymentBypass === 'bypassed') return;
      if (paymentBypass === 'rejected') {
        return c.json(paymentRejectedJson(path, config), 402);
      }

      return c.json(paymentRequiredJson(path, config), 402);
    } catch (error) {
      logger.error({ error }, 'Gated X402 middleware unexpected error');
      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Terjadi kesalahan internal',
          },
        },
        500,
      );
    }
  };
}

export function createFreePassMiddleware(): MiddlewareHandler {
  return async (_c: Context, next) => {
    await next();
  };
}
