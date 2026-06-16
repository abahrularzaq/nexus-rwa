import { createHash, randomUUID } from 'node:crypto';
import { PaymentStatus } from '@prisma/client';
import { db } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';

export interface PaymentLogEntry {
  requestId: string;
  endpoint: string;
  method: string;
  ipAddress: string | null;
  userAgent: string | null;
  amountRequired: number;
  paymentTxHash: string | null;
  paymentFrom: string | null;
  paymentStatus: 'NONE' | 'PAID' | 'FAILED';
  failureReason: string | null;
  responseCode: number;
  durationMs: number;
}

function anonymizeIpAddress(ipAddress: string | null): string | undefined {
  const value = ipAddress?.trim();
  if (!value) return undefined;

  const salt = process.env.IP_HASH_SALT?.trim() || 'nexus-rwa-default-ip-salt';
  return `sha256:${createHash('sha256').update(`${salt}:${value}`).digest('hex')}`;
}

function toPrismaPaymentStatus(status: PaymentLogEntry['paymentStatus']): PaymentStatus {
  switch (status) {
    case 'PAID':
      return PaymentStatus.PAID;
    case 'FAILED':
      return PaymentStatus.FAILED;
    case 'NONE':
    default:
      return PaymentStatus.NONE;
  }
}

/**
 * Menyimpan satu baris audit pembayaran / permintaan ke ApiRequest.
 * Kegagalan DB tidak boleh mengganggu request — hanya warning ke log aplikasi.
 */
export async function logPaymentRequest(entry: PaymentLogEntry): Promise<void> {
  try {
    await db.apiRequest.create({
      data: {
        requestId: entry.requestId,
        endpoint: entry.endpoint,
        method: entry.method,
        ipAddress: anonymizeIpAddress(entry.ipAddress),
        userAgent: entry.userAgent ?? undefined,
        paymentAmount: entry.amountRequired,
        paymentTxHash: entry.paymentTxHash ?? undefined,
        paymentFrom: entry.paymentFrom ?? undefined,
        failureReason: entry.failureReason ?? undefined,
        paymentStatus: toPrismaPaymentStatus(entry.paymentStatus),
        responseCode: entry.responseCode,
        durationMs: entry.durationMs,
      },
    });
  } catch (err) {
    logger.warn({ err, requestId: entry.requestId, endpoint: entry.endpoint }, 'logPaymentRequest failed (non-fatal)');
  }
}

/**
 * ID permintaan stabil untuk korelasi log/DB: prefiks + 20 karakter heksa dari {@link randomUUID}.
 */
export function createRequestId(): string {
  const hex = randomUUID().replace(/-/g, '');
  return `req_${hex.slice(0, 20)}`;
}
