import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_TVL_USD = 100_000_000_000; // $100B
const TVL_REL_CHANGE_ERROR = 0.5; // 50% within 1h
const TVL_REL_CHANGE_WARN = 0.2; // 20% within 1h
const MAX_YIELD_APY = 100; // percent points, e.g. 12.5 = 12.5% APY
const YIELD_HIGH_RWA_WARN = 20;
const YIELD_ABS_CHANGE_WARN_PP = 5; // percentage points within 1h
const HOLDER_DROP_ERROR = 0.3; // 30% within 1h

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export type AssetSnapshotInput = {
  assetId: string;
  tvl: number;
  yieldRate: number;
  holderCount: number;
};

/**
 * Validates snapshot fields and compares to the latest DB row when it is within the last hour.
 */
export async function validateAssetSnapshot(data: AssetSnapshotInput): Promise<ValidationResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!Number.isFinite(data.tvl) || data.tvl <= 0) {
    errors.push('TVL must be greater than 0');
  }
  if (Number.isFinite(data.tvl) && data.tvl >= MAX_TVL_USD) {
    errors.push(`TVL must be less than $100B (got ${data.tvl})`);
  }

  if (!Number.isFinite(data.yieldRate) || data.yieldRate < 0) {
    errors.push('yieldRate must be >= 0');
  }
  if (Number.isFinite(data.yieldRate) && data.yieldRate >= MAX_YIELD_APY) {
    errors.push(`yieldRate must be below ${MAX_YIELD_APY}% APY (got ${data.yieldRate})`);
  }
  if (Number.isFinite(data.yieldRate) && data.yieldRate > YIELD_HIGH_RWA_WARN && data.yieldRate < MAX_YIELD_APY) {
    warnings.push(`yieldRate ${data.yieldRate}% is high for typical RWA (>${YIELD_HIGH_RWA_WARN}%)`);
  }

  if (!Number.isFinite(data.holderCount) || data.holderCount < 0) {
    errors.push('holderCount must be >= 0');
  }

  const latest = await db.assetSnapshot.findFirst({
    where: { assetId: data.assetId },
    orderBy: { timestamp: 'desc' },
    select: { tvl: true, yieldRate: true, holderCount: true, timestamp: true },
  });

  const now = Date.now();
  const within1h =
    latest !== null && Number.isFinite(now - latest.timestamp.getTime())
      ? now - latest.timestamp.getTime() <= ONE_HOUR_MS
      : false;

  if (latest && within1h) {
    const prevTvl = latest.tvl;
    if (Number.isFinite(prevTvl) && prevTvl > 0 && Number.isFinite(data.tvl) && data.tvl > 0) {
      const rel = Math.abs(data.tvl - prevTvl) / prevTvl;
      if (rel >= TVL_REL_CHANGE_ERROR) {
        errors.push(
          `TVL moved ${(rel * 100).toFixed(1)}% vs prior snapshot within 1h (max ${TVL_REL_CHANGE_ERROR * 100}%)`,
        );
      } else if (rel > TVL_REL_CHANGE_WARN) {
        warnings.push(
          `TVL moved ${(rel * 100).toFixed(1)}% vs prior snapshot within 1h (>${TVL_REL_CHANGE_WARN * 100}% threshold)`,
        );
      }
    }

    if (Number.isFinite(latest.yieldRate) && Number.isFinite(data.yieldRate)) {
      const absDiff = Math.abs(data.yieldRate - latest.yieldRate);
      if (absDiff > YIELD_ABS_CHANGE_WARN_PP) {
        warnings.push(
          `yieldRate changed by ${absDiff.toFixed(2)}pp vs prior snapshot within 1h (>${YIELD_ABS_CHANGE_WARN_PP}pp)`,
        );
      }
    }

    const prevH = latest.holderCount;
    if (Number.isFinite(prevH) && prevH > 0 && Number.isFinite(data.holderCount)) {
      const drop = (prevH - data.holderCount) / prevH;
      if (drop > HOLDER_DROP_ERROR) {
        errors.push(
          `holderCount dropped ${(drop * 100).toFixed(1)}% vs prior snapshot within 1h (max ${HOLDER_DROP_ERROR * 100}% drop)`,
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

export function logValidationWarnings(assetId: string, result: ValidationResult): void {
  if (result.errors.length > 0) {
    logger.error(
      { assetId, errors: result.errors, warnings: result.warnings },
      'AssetSnapshot validation failed — save skipped',
    );
  }
  if (result.warnings.length > 0) {
    logger.warn({ assetId, warnings: result.warnings }, 'AssetSnapshot validation warnings — save allowed');
  }
}
