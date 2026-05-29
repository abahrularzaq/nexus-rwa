export type RiskLevelLabel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Inputs for a single risk calculation (numeric fields use percent where noted). */
export interface AssetRiskInput {
  tvl: number;
  /** TVL change over 7 days, in percent (e.g. -12.5 = −12.5%). */
  tvl7dChange: number;
  /** Current yield APY in percent (e.g. 5.2 = 5.2%). */
  yield: number;
  /** 30-day average yield APY in percent. */
  yieldAvg30d: number;
  holderCount: number;
  protocolAgeMonths: number;
}

/** Asset row key for batch scoring. */
export interface AssetData extends AssetRiskInput {
  id: string;
}

export interface RiskResult {
  /** 0–100; higher = safer / lower risk. */
  score: number;
  level: RiskLevelLabel;
  factors: string[];
}

const TVL_VOLATILE_THRESHOLD_PCT = 10;
const YIELD_SUSPICIOUS_THRESHOLD_PCT = 15;
const MIN_HOLDERS_SAFE = 100;
const MIN_PROTOCOL_AGE_MONTHS = 6;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreTvlStability(tvl7dChange: number, factors: string[]): number {
  const abs = Math.abs(tvl7dChange);
  if (abs > TVL_VOLATILE_THRESHOLD_PCT) {
    factors.push('TVL moved more than 10% in the last 7 days');
    return 5;
  }
  if (abs > 5) {
    factors.push('Moderate TVL movement over 7 days');
    return 15;
  }
  return 25;
}

function scoreYieldSustainability(
  yieldPct: number,
  yieldAvg30d: number,
  factors: string[],
): number {
  if (yieldPct > YIELD_SUSPICIOUS_THRESHOLD_PCT) {
    factors.push('Yield unusually high (>15%)');
    return 8;
  }
  if (
    yieldAvg30d > 0 &&
    yieldPct > yieldAvg30d * 1.3
  ) {
    factors.push('Current yield above 30-day average');
  }
  if (yieldPct > 12) {
    return 18;
  }
  return 25;
}

function scoreHolderConcentration(holderCount: number, factors: string[]): number {
  if (holderCount < MIN_HOLDERS_SAFE) {
    factors.push('Low holder count (<100)');
    return 0;
  }
  if (holderCount >= 1000) {
    return 25;
  }
  if (holderCount >= 500) {
    return 20;
  }
  return 12;
}

function scoreProtocolMaturity(protocolAgeMonths: number, factors: string[]): number {
  if (protocolAgeMonths < MIN_PROTOCOL_AGE_MONTHS) {
    factors.push('Protocol younger than 6 months');
    return 0;
  }
  if (protocolAgeMonths >= 24) {
    return 25;
  }
  if (protocolAgeMonths >= 12) {
    return 20;
  }
  return 12;
}

function resolveLevel(score: number, input: AssetRiskInput): RiskLevelLabel {
  const hardHigh =
    input.holderCount < MIN_HOLDERS_SAFE ||
    input.protocolAgeMonths < MIN_PROTOCOL_AGE_MONTHS;

  if (hardHigh || score < 45) {
    return 'HIGH';
  }
  if (score < 70) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Computes a 0–100 risk score (higher = safer) from TVL, yield, holders, and protocol age signals.
 */
export function calculateRiskScore(input: AssetRiskInput): RiskResult {
  const factors: string[] = [];

  const tvlPts = scoreTvlStability(input.tvl7dChange, factors);
  const yieldPts = scoreYieldSustainability(input.yield, input.yieldAvg30d, factors);
  const holderPts = scoreHolderConcentration(input.holderCount, factors);
  const maturityPts = scoreProtocolMaturity(input.protocolAgeMonths, factors);

  const raw = tvlPts + yieldPts + holderPts + maturityPts;
  const score = clampScore(raw);
  const level = resolveLevel(score, input);

  if (!Number.isFinite(input.tvl) || input.tvl <= 0) {
    factors.push('TVL data unavailable or zero');
  }

  return { score, level, factors };
}

/** Batch risk scoring keyed by asset id. */
export function batchCalculateRisk(assets: AssetData[]): Map<string, RiskResult> {
  const results = new Map<string, RiskResult>();
  for (const asset of assets) {
    results.set(asset.id, calculateRiskScore(asset));
  }
  return results;
}
