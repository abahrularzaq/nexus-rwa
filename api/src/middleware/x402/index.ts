import type { MiddlewareHandler, Context } from 'hono';
import { getEndpointPrice } from './pricer.js';
import { logger } from '../../lib/logger.js';

const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function getReceivingAddress(): string {
  return process.env.X402_RECEIVING_ADDRESS
    ?? '0x0000000000000000000000000000000000000001';
}

function getNetwork(): 'base' | 'base-sepolia' {
  return (process.env.X402_NETWORK ?? 'base-sepolia') as 'base' | 'base-sepolia';
}

function getUsdcAddress(): string {
  return getNetwork() === 'base' ? USDC_MAINNET : USDC_SEPOLIA;
}

export function createNexusX402Middleware(): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      const method = c.req.method;
      const path = c.req.path;
      const endpointPrice = getEndpointPrice(method, path);

      // Endpoint gratis — langsung lanjut tanpa cek payment
      if (endpointPrice.isFree) {
        await next();
        return;
      }

      // Cek apakah ada X-Payment header
      const paymentHeader = c.req.header('X-Payment');

      // Tidak ada payment header — return 402 dengan instruksi
      if (!paymentHeader) {
        return c.json({
          x402Version: 1,
          error: 'Payment required',
          accepts: [{
            scheme: 'exact',
            network: getNetwork(),
            maxAmountRequired: String(endpointPrice.price),
            resource: path,
            description: endpointPrice.description,
            mimeType: 'application/json',
            payTo: getReceivingAddress(),
            maxTimeoutSeconds: 300,
            asset: getUsdcAddress(),
            extra: { name: 'USD Coin', version: '2' },
          }],
        }, 402);
      }

      // Ada payment header — parse dan validasi format
      let payment: Record<string, unknown>;
      try {
        payment = JSON.parse(paymentHeader);
      } catch {
        return c.json({
          x402Version: 1,
          error: 'INVALID_PAYMENT_HEADER',
          message: 'X-Payment header harus berupa JSON yang valid',
        }, 400);
      }

      // Validasi field wajib
      if (!payment.txHash || !payment.from) {
        return c.json({
          x402Version: 1,
          error: 'INVALID_PAYMENT_HEADER',
          message: 'X-Payment header harus memiliki field: txHash dan from',
        }, 402);
      }

      // Log payment diterima
      logger.info({
        endpoint: path,
        txHash: payment.txHash,
        from: payment.from,
        amountRequired: endpointPrice.price,
      }, 'X402 payment received');

      // Set response headers
      c.header('X-Payment-Status', 'received');
      c.header('X-Payment-TxHash', String(payment.txHash));

      // Lanjut ke route handler
      await next();
      return;
    } catch (error) {
      logger.error({ error }, 'X402 middleware unexpected error');
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Terjadi kesalahan internal',
        },
      }, 500);
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
    network: getNetwork(),
    usdcAddress: getUsdcAddress(),
  };
}

/*
 * CATATAN PRODUCTION:
 * Middleware ini menerima X-Payment header tanpa verifikasi on-chain.
 * Sebelum deploy ke mainnet, tambahkan verifikasi via viem:
 * - Cek txHash valid di Base network
 * - Verifikasi transfer USDC ke receiving address
 * - Validasi amount sesuai harga endpoint
 */
