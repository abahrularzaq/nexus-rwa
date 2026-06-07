import type { MiddlewareHandler, Context } from 'hono';
import { getAddress, isHex, type Hex } from 'viem';
import {
  getEndpointAccessConfig,
  type EndpointAccessConfig,
  TIER_PLANS,
} from './x402/pricer.js';
import { logger } from '../lib/logger.js';
import {
  hasTierAccess,
  normalizeWallet,
} from '../lib/x402-session.js';
import {
  hasAccessTier,
  resolveApiKeyEntitlement,
} from '../lib/api-key-entitlement.js';

const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function readPaymentRecipientEnv(): string {
  return (
    process.env.PAYMENT_RECIPIENT?.trim() ||
    process.env.X402_RECEIVING_ADDRESS?.trim() ||
    ''
  );
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

/**
 * Deprecated native-ETH verifier kept for compatibility with older imports.
 * USDC x402 exact settlement will be verified through the facilitator in the next step.
 */
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

function paymentRequiredJson(path: string, config: EndpointAccessConfig) {
  const tierInfo = tierPayload(config);
  const plan = TIER_PLANS[config.tier];

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
    accepts: [
      {
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
      },
    ],
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

function paymentVerificationPendingJson(config: EndpointAccessConfig) {
  return {
    ...x402Meta(),
    x402Version: 1,
    error: 'USDC_X402_FACILITATOR_NOT_CONFIGURED',
    message:
      'USDC pricing is active, but facilitator-based x402 verification is not wired yet. Complete the facilitator integration before accepting USDC payments.',
    tier: tierPayload(config),
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

      const txHeader = c.req.header('X-Payment-Tx')?.trim();
      const paymentHeader = c.req.header('X-Payment')?.trim();
      if (txHeader || paymentHeader) {
        return c.json(paymentVerificationPendingJson(config), 402);
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

      const txHeader = c.req.header('X-Payment-Tx')?.trim();
      const paymentHeader = c.req.header('X-Payment')?.trim();
      if (txHeader || paymentHeader) {
        return c.json(paymentVerificationPendingJson(config), 402);
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
