import type { MiddlewareHandler, Context } from 'hono';
import { getAddress, isHex, type Hex } from 'viem';
import {
  getEndpointAccessConfig,
  type EndpointAccessConfig,
  TIER_PLANS,
} from './x402/pricer.js';
import { logger } from '../lib/logger.js';
import { getPublicClient } from '../lib/blockchain.js';
import { redis } from '../lib/redis.js';
import {
  grantTierSession,
  hasTierAccess,
  normalizeWallet,
} from '../lib/x402-session.js';

const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

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
  return (
    process.env.PAYMENT_RECIPIENT?.trim() ||
    process.env.X402_RECEIVING_ADDRESS?.trim() ||
    '0x0000000000000000000000000000000000000001'
  );
}

function getUsdcAddress(): string {
  return getX402Network() === 'base' ? USDC_MAINNET : USDC_SEPOLIA;
}

function getVerifyRecipient(): string {
  return (
    process.env.PAYMENT_RECIPIENT?.trim() ||
    process.env.X402_RECEIVING_ADDRESS?.trim() ||
    ''
  );
}

export type VerifyPaymentResult = {
  verified: boolean;
  blockNumber: number;
  timestamp: number;
  from?: string;
};

/**
 * Verifies a native ETH transfer: recipient match and amount >= expected for the tier.
 */
export async function verifyPayment(
  txHash: string,
  expectedAmountWei: string,
  recipient: string,
): Promise<VerifyPaymentResult> {
  const empty: VerifyPaymentResult = { verified: false, blockNumber: 0, timestamp: 0 };

  if (!isHex(txHash) || txHash.length !== 66) {
    return empty;
  }
  const hash = txHash as Hex;

  if (!recipient) {
    logger.warn('verifyPayment: recipient empty');
    return empty;
  }

  let recipientChecksummed: string;
  try {
    recipientChecksummed = getAddress(recipient);
  } catch {
    return empty;
  }

  let expectedWei: bigint;
  try {
    expectedWei = BigInt(expectedAmountWei);
  } catch {
    return empty;
  }

  const network = getX402Network();
  const cacheKey = `verified:${txHash}:${expectedAmountWei}`;

  try {
    const clientRedis = redis();
    const cached = await clientRedis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as VerifyPaymentResult;
      if (parsed && typeof parsed.verified === 'boolean') {
        return parsed;
      }
    }
  } catch {
    // Redis optional
  }

  try {
    const client = getPublicClient(network);
    const [receipt, tx] = await Promise.all([
      client.getTransactionReceipt({ hash }),
      client.getTransaction({ hash }),
    ]);

    if (!receipt || receipt.status !== 'success' || !tx || tx.to === null) {
      return empty;
    }

    if (getAddress(tx.to) !== recipientChecksummed) {
      return empty;
    }
    if (tx.value < expectedWei) {
      return empty;
    }

    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    const result: VerifyPaymentResult = {
      verified: true,
      blockNumber: Number(receipt.blockNumber),
      timestamp: Number(block.timestamp),
      from: tx.from ? getAddress(tx.from) : undefined,
    };

    try {
      const clientRedis = redis();
      await clientRedis.setex(cacheKey, 3600, JSON.stringify(result));
    } catch {
      // ignore
    }

    return result;
  } catch (err) {
    logger.warn({ err, txHash }, 'verifyPayment: chain query failed');
    return empty;
  }
}

function tierPayload(config: EndpointAccessConfig) {
  if (config.tier === 'free') return null;
  return {
    tier: config.tier,
    label: config.label,
    price: config.priceEth,
    priceEth: config.priceEth,
    priceUsd: config.priceUsd,
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
      priceEth: config.priceEth,
      duration: config.duration || undefined,
      description: config.description,
    },
    x402: {
      price: config.priceEth,
      currency: 'ETH',
      network: getX402Network(),
      recipient: getReceivingAddress(),
      endpoint: path,
      tier: config.tier,
      duration: config.duration || undefined,
    },
    accepts: [
      {
        scheme: 'exact',
        network: getX402Network(),
        maxAmountRequired: config.priceWei,
        resource: path,
        description: plan.description,
        mimeType: 'application/json',
        payTo: getReceivingAddress(),
        maxTimeoutSeconds: 300,
        asset: getUsdcAddress(),
        extra: {
          name: 'USD Coin',
          version: '2',
          tier: config.tier,
          label: config.label,
          priceEth: config.priceEth,
          priceUsd: config.priceUsd,
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

async function tryBypassWithVerifiedTx(
  c: Context,
  config: EndpointAccessConfig,
  next: () => Promise<void>,
): Promise<'bypassed' | 'rejected' | 'none'> {
  const txHeader = c.req.header('X-Payment-Tx')?.trim();
  if (!txHeader) return 'none';

  const recipient = getVerifyRecipient();
  if (!recipient) {
    logger.error('PAYMENT_RECIPIENT required for X-Payment-Tx verification');
    return 'rejected';
  }

  const v = await verifyPayment(txHeader, config.priceWei, recipient);
  if (!v.verified) {
    return 'rejected';
  }

  const wallet =
    walletFromContext(c) ?? (v.from ? normalizeWallet(v.from) : null);

  if (wallet && (config.tier === 'pro' || config.tier === 'enterprise')) {
    await grantTierSession(wallet, config.tier);
  }

  c.header('X-Payment-Verified', 'true');
  c.header('X-Payment-Status', 'verified');
  c.header('X-Payment-TxHash', txHeader);
  c.header('X-Payment-Tier', config.tier);
  if (wallet) c.header('X-Wallet-Address', wallet);

  await next();
  return 'bypassed';
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

      if (await trySessionBypass(c, config, next)) {
        return;
      }

      const txBypass = await tryBypassWithVerifiedTx(c, config, next);
      if (txBypass === 'bypassed') return;
      if (txBypass === 'rejected') {
        return c.json(
          {
            ...x402Meta(),
            x402Version: 1,
            error: 'PAYMENT_VERIFICATION_FAILED',
            message:
              'X-Payment-Tx did not satisfy tier amount, recipient, or confirmation requirements.',
            tier: tierPayload(config),
          },
          402,
        );
      }

      const paymentHeader = c.req.header('X-Payment');

      if (!paymentHeader) {
        return c.json(paymentRequiredJson(path, config), 402);
      }

      let payment: Record<string, unknown>;
      try {
        payment = JSON.parse(paymentHeader);
      } catch {
        return c.json(
          {
            ...x402Meta(),
            x402Version: 1,
            error: 'INVALID_PAYMENT_HEADER',
            message: 'X-Payment header must be valid JSON',
          },
          400,
        );
      }

      if (!payment.txHash || !payment.from) {
        return c.json(
          {
            ...x402Meta(),
            x402Version: 1,
            error: 'INVALID_PAYMENT_HEADER',
            message: 'X-Payment header must include txHash and from',
            tier: tierPayload(config),
          },
          402,
        );
      }

      logger.info(
        {
          endpoint: path,
          tier: config.tier,
          txHash: payment.txHash,
          from: payment.from,
          amountRequiredWei: config.priceWei,
        },
        'X402 payment received',
      );

      c.header('X-Payment-Status', 'received');
      c.header('X-Payment-TxHash', String(payment.txHash));
      c.header('X-Payment-Tier', config.tier);

      await next();
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

      if (await trySessionBypass(c, config, next)) {
        return;
      }

      const txBypass = await tryBypassWithVerifiedTx(c, config, next);
      if (txBypass === 'bypassed') return;
      if (txBypass === 'rejected') {
        return c.json(
          {
            ...x402Meta(),
            x402Version: 1,
            error: 'PAYMENT_VERIFICATION_FAILED',
            message:
              'X-Payment-Tx did not satisfy tier amount, recipient, or confirmation requirements.',
            tier: tierPayload(config),
          },
          402,
        );
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
