import type { MiddlewareHandler, Context } from 'hono';
import { getAddress, isHex, parseEther, type Hex } from 'viem';
import { getEndpointPrice } from './pricer.js';
import { logger } from '../../lib/logger.js';
import { getPublicClient } from '../../lib/blockchain.js';
import { redis } from '../../lib/redis.js';

const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

/** Call once at process startup (after dotenv). */
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

function getExpectedPaymentWeiString(): string {
  const raw = (process.env.PAYMENT_AMOUNT_ETH ?? '0').trim();
  return parseEther(raw === '' ? '0' : raw).toString();
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
};

/**
 * Verifies a native ETH transfer on the configured X402 network.
 * Positive results are cached in Redis (Upstash-compatible) for 1 hour under `verified:${txHash}`.
 */
export async function verifyPayment(
  txHash: string,
  expectedAmount: string,
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
    expectedWei = BigInt(expectedAmount);
  } catch {
    return empty;
  }

  const network = getX402Network();
  const cacheKey = `verified:${txHash}`;

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
    // Redis optional — continue without cache
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
    };

    try {
      const clientRedis = redis();
      await clientRedis.setex(cacheKey, 3600, JSON.stringify(result));
    } catch {
      // ignore cache write errors
    }

    return result;
  } catch (err) {
    logger.warn({ err, txHash }, 'verifyPayment: chain query failed');
    return empty;
  }
}

function paymentRequiredJson(path: string, endpointPrice: ReturnType<typeof getEndpointPrice>) {
  return {
    ...x402Meta(),
    x402Version: 1,
    error: 'Payment required',
    accepts: [
      {
        scheme: 'exact',
        network: getX402Network(),
        maxAmountRequired: String(endpointPrice.price),
        resource: path,
        description: endpointPrice.description,
        mimeType: 'application/json',
        payTo: getReceivingAddress(),
        maxTimeoutSeconds: 300,
        asset: getUsdcAddress(),
        extra: { name: 'USD Coin', version: '2' },
      },
    ],
  };
}

async function tryBypassWithVerifiedTx(
  c: Context,
  next: () => Promise<void>,
): Promise<'bypassed' | 'rejected' | 'none'> {
  const txHeader = c.req.header('X-Payment-Tx')?.trim();
  if (!txHeader) return 'none';

  const recipient = getVerifyRecipient();
  if (!recipient) {
    logger.error('PAYMENT_RECIPIENT / X402_RECEIVING_ADDRESS required for X-Payment-Tx verification');
    return 'rejected';
  }

  const expectedWei = getExpectedPaymentWeiString();
  const v = await verifyPayment(txHeader, expectedWei, recipient);
  if (!v.verified) {
    return 'rejected';
  }

  c.header('X-Payment-Verified', 'true');
  c.header('X-Payment-Status', 'verified');
  c.header('X-Payment-TxHash', txHeader);
  await next();
  return 'bypassed';
}

export function createNexusX402Middleware(): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      const method = c.req.method;
      const path = c.req.path;
      const endpointPrice = getEndpointPrice(method, path);

      if (endpointPrice.isFree) {
        await next();
        return;
      }

      const txBypass = await tryBypassWithVerifiedTx(c, next);
      if (txBypass === 'bypassed') return;
      if (txBypass === 'rejected') {
        return c.json(
          {
            ...x402Meta(),
            x402Version: 1,
            error: 'PAYMENT_VERIFICATION_FAILED',
            message: 'X-Payment-Tx did not satisfy amount, recipient, or confirmation requirements.',
          },
          402,
        );
      }

      const paymentHeader = c.req.header('X-Payment');

      if (!paymentHeader) {
        return c.json(paymentRequiredJson(path, endpointPrice), 402);
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
            message: 'X-Payment header harus berupa JSON yang valid',
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
            message: 'X-Payment header harus memiliki field: txHash dan from',
          },
          402,
        );
      }

      logger.info(
        {
          endpoint: path,
          txHash: payment.txHash,
          from: payment.from,
          amountRequired: endpointPrice.price,
        },
        'X402 payment received',
      );

      c.header('X-Payment-Status', 'received');
      c.header('X-Payment-TxHash', String(payment.txHash));

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

/** All routes require a verified `X-Payment-Tx` (native ETH) or 402. */
export function createGatedTxPaymentMiddleware(): MiddlewareHandler {
  return async (c: Context, next) => {
    if (c.req.method === 'OPTIONS') {
      await next();
      return;
    }
    try {
      const path = c.req.path;
      const endpointPrice = getEndpointPrice(c.req.method, path);

      const txBypass = await tryBypassWithVerifiedTx(c, next);
      if (txBypass === 'bypassed') return;
      if (txBypass === 'rejected') {
        return c.json(
          {
            ...x402Meta(),
            x402Version: 1,
            error: 'PAYMENT_VERIFICATION_FAILED',
            message: 'X-Payment-Tx did not satisfy amount, recipient, or confirmation requirements.',
          },
          402,
        );
      }

      return c.json(paymentRequiredJson(path, endpointPrice), 402);
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

export function getX402Config() {
  return {
    receivingAddress: getReceivingAddress(),
    network: getX402Network(),
    usdcAddress: getUsdcAddress(),
  };
}
