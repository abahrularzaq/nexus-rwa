import { randomUUID } from 'crypto';
import type { ResponseMeta, PaginationParams, PaginatedResponse } from '../types';

// Generate standard response meta
export function createMeta(cached = false): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: `req_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    cached,
  };
}

// Build paginated response
export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

// Format angka besar → "892.4M", "1.2B"
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// Format yield rate → "5.42%"
export function formatYield(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

// Truncate wallet address → "0x742d...8f3a"
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}