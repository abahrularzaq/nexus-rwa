export type AssetGradeLevel = 'research' | 'analytics' | 'institutional';

export interface GradeInput {
  identity?: any;
  market?: any;
  risk?: any;
  reserve?: any;
  yield?: any;
  institutional?: any;
  blockchain?: any[];
  compliance?: any;
  liquidity?: any;
  sources?: any[];
}

export interface GradeResult {
  grade: AssetGradeLevel;
  score: number;
  completenessScore: number;
  sourceScore: number;
  legalScore: number;
  reserveScore: number;
  liquidityScore: number;
  riskScore: number;
  blockers: string[];
  warnings: string[];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function sourceExists(sources: any[], layer: string, field?: string): boolean {
  return sources.some((s) => {
    if (s.layer !== layer) return false;
    if (field && s.field !== field) return false;
    return hasValue(s.sourceUrl);
  });
}

function calculateCompleteness(input: GradeInput): number {
  const checks = [
    input.identity?.name,
    input.identity?.symbol,
    input.identity?.category,
    input.identity?.websiteUrl,
    input.identity?.docsUrl,

    input.market?.tvl,
    input.market?.aumUsd,
    input.market?.holderCount,

    input.reserve?.backingType,
    input.reserve?.backingDescription,
    input.reserve?.custodian,
    input.reserve?.redemptionAsset,

    input.yield?.currentYield,
    input.yield?.yieldType,

    input.institutional?.issuerName,
    input.institutional?.issuerCountry,
    input.institutional?.legalStructure,
    input.institutional?.targetInvestors,

    input.blockchain?.[0]?.chain,
    input.blockchain?.[0]?.contractAddress,
    input.blockchain?.[0]?.explorerUrl,

    input.compliance?.regulatoryStatus,
    input.compliance?.kycRequired,
    input.compliance?.primaryRegulator,

    input.liquidity?.redemptionType,
    input.liquidity?.redemptionPeriodDays,
    input.liquidity?.liquidityScore,
  ];

  const filled = checks.filter(hasValue).length;
  return clamp((filled / checks.length) * 100);
}

function calculateSourceScore(input: GradeInput): number {
  const sources = input.sources ?? [];
  if (sources.length === 0) return 0;

  const required = [
    ['identity', 'websiteUrl'],
    ['identity', 'docsUrl'],
    ['reserve', 'backingType'],
    ['reserve', 'custodian'],
    ['institutional', 'issuerName'],
    ['institutional', 'legalStructure'],
    ['compliance', 'regulatoryStatus'],
    ['blockchain', 'contractAddress'],
    ['liquidity', 'redemptionType'],
  ];

  const covered = required.filter(([layer, field]) =>
    sourceExists(sources, layer, field),
  ).length;

  const reliabilityAvg =
    sources.reduce((sum, s) => sum + (s.reliability ?? 0), 0) / sources.length;

  return clamp((covered / required.length) * 70 + reliabilityAvg * 0.3);
}

function calculateLegalScore(input: GradeInput, blockers: string[], warnings: string[]): number {
  let score = 0;

  if (hasValue(input.institutional?.issuerName)) score += 20;
  else blockers.push('Missing issuer name');

  if (hasValue(input.institutional?.legalStructure)) score += 20;
  else blockers.push('Missing legal structure');

  if (hasValue(input.compliance?.regulatoryStatus)) score += 20;
  else blockers.push('Missing regulatory status');

  if (hasValue(input.compliance?.primaryRegulator)) score += 15;
  else warnings.push('Missing primary regulator');

  if (input.compliance?.kycRequired === true) score += 10;
  else warnings.push('KYC requirement is not confirmed');

  if (hasValue(input.compliance?.legalOpinionUrl)) score += 15;
  else warnings.push('Missing legal opinion or legal document URL');

  return clamp(score);
}

function calculateReserveScore(input: GradeInput, blockers: string[], warnings: string[]): number {
  let score = 0;

  if (hasValue(input.reserve?.backingType)) score += 20;
  else blockers.push('Missing backing type');

  if (hasValue(input.reserve?.backingDescription)) score += 15;
  else blockers.push('Missing backing description');

  if (hasValue(input.reserve?.custodian)) score += 20;
  else blockers.push('Missing custodian');

  if (hasValue(input.reserve?.reserveBreakdown)) score += 15;
  else warnings.push('Missing reserve breakdown');

  if (input.reserve?.hasProofOfReserves === true) score += 10;
  else warnings.push('No proof-of-reserves confirmed');

  if (hasValue(input.reserve?.lastAuditUrl)) score += 10;
  else warnings.push('Missing audit/report URL');

  if (hasValue(input.reserve?.redemptionAsset)) score += 10;
  else blockers.push('Missing redemption asset');

  return clamp(score);
}

function calculateLiquidityScore(input: GradeInput, blockers: string[], warnings: string[]): number {
  let score = 0;

  if (hasValue(input.liquidity?.redemptionType)) score += 25;
  else blockers.push('Missing redemption type');

  if (hasValue(input.liquidity?.redemptionPeriodDays)) score += 20;
  else warnings.push('Missing redemption period');

  if (hasValue(input.liquidity?.liquidityScore)) score += input.liquidity.liquidityScore * 0.35;
  else warnings.push('Missing liquidity score');

  if (hasValue(input.liquidity?.onchainLiquidity)) score += 10;
  else warnings.push('Missing on-chain liquidity');

  if (hasValue(input.liquidity?.lockupPeriodDays)) score += 10;

  return clamp(score);
}

function calculateRiskScore(input: GradeInput, warnings: string[]): number {
  if (hasValue(input.risk?.overallScore)) return clamp(input.risk.overallScore);

  const scores = [
    input.risk?.smartContractRisk,
    input.risk?.counterpartyRisk,
    input.risk?.liquidityRisk,
    input.risk?.regulatoryRisk,
    input.risk?.marketRisk,
    input.risk?.concentrationRisk,
  ].filter(hasValue);

  if (scores.length === 0) {
    warnings.push('Risk score is missing');
    return 0;
  }

  return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateAssetGrade(input: GradeInput): GradeResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const completenessScore = calculateCompleteness(input);
  const sourceScore = calculateSourceScore(input);
  const legalScore = calculateLegalScore(input, blockers, warnings);
  const reserveScore = calculateReserveScore(input, blockers, warnings);
  const liquidityScore = calculateLiquidityScore(input, blockers, warnings);
  const riskScore = calculateRiskScore(input, warnings);

  const score = clamp(
    completenessScore * 0.2 +
    sourceScore * 0.2 +
    legalScore * 0.2 +
    reserveScore * 0.2 +
    liquidityScore * 0.1 +
    riskScore * 0.1,
  );

  let grade: AssetGradeLevel = 'research';

  if (
    score >= 85 &&
    sourceScore >= 90 &&
    legalScore >= 80 &&
    reserveScore >= 80 &&
    liquidityScore >= 70 &&
    riskScore >= 75 &&
    blockers.length === 0
  ) {
    grade = 'institutional';
  } else if (score >= 65) {
    grade = 'analytics';
  }

  return {
    grade,
    score,
    completenessScore,
    sourceScore,
    legalScore,
    reserveScore,
    liquidityScore,
    riskScore,
    blockers,
    warnings,
  };
}
