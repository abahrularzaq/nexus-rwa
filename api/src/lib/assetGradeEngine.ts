export type AssetGradeLevel = 'research' | 'analytics' | 'institutional';

export type GradingProfile =
  | 'asset_backed'
  | 'commodity_backed'
  | 'credit_pool'
  | 'real_estate_claim'
  | 'governance_protocol';

export type FieldApplicability = 'available' | 'missing' | 'not_applicable';

export type GradeProfileScores = Record<string, number | null>;

export type GradeApplicability = Record<string, FieldApplicability>;

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
  reserveScore: number | null;
  liquidityScore: number;
  riskScore: number;
  blockers: string[];
  warnings: string[];
  gradingProfile?: GradingProfile;
  assetClass?: string | null;
  instrumentType?: string | null;
  claimType?: string | null;
  publicSegment?: string | null;
  gradeContext?: string;
  profileScores?: GradeProfileScores;
  applicability?: GradeApplicability;
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

function getClassification(input: GradeInput): Record<string, any> {
  return input.institutional?.metadata?.classification ?? input.institutional?.metadata ?? {};
}

function isGradingProfile(value: any): value is GradingProfile {
  return (
    value === 'asset_backed' ||
    value === 'commodity_backed' ||
    value === 'credit_pool' ||
    value === 'real_estate_claim' ||
    value === 'governance_protocol'
  );
}

function getGradingProfile(input: GradeInput): GradingProfile {
  const classification = getClassification(input);
  const profile = classification?.gradingProfile ?? input.institutional?.metadata?.gradingProfile;

  if (isGradingProfile(profile)) return profile;

  return 'asset_backed';
}

function getGradeContext(grade: AssetGradeLevel, gradingProfile: GradingProfile): string {
  const gradeLabel = grade.charAt(0).toUpperCase() + grade.slice(1);
  const profileLabel: Record<GradingProfile, string> = {
    asset_backed: 'Asset-backed Profile',
    commodity_backed: 'Commodity-backed Profile',
    credit_pool: 'Credit Pool Profile',
    real_estate_claim: 'Real Estate Claim Profile',
    governance_protocol: 'Governance Protocol Profile',
  };

  return `${gradeLabel} — ${profileLabel[gradingProfile]}`;
}

function commonClassificationOutput(input: GradeInput, gradingProfile: GradingProfile, grade: AssetGradeLevel) {
  const classification = getClassification(input);

  return {
    gradingProfile,
    assetClass: classification.assetClass ?? null,
    instrumentType: classification.instrumentType ?? null,
    claimType: classification.claimType ?? null,
    publicSegment: classification.publicSegment ?? null,
    gradeContext: getGradeContext(grade, gradingProfile),
  };
}

function resolveGrade(
  score: number,
  blockers: string[],
  requirements: {
    sourceScore?: number;
    legalScore?: number;
    reserveScore?: number;
    liquidityScore?: number;
    riskScore?: number;
  } = {},
): AssetGradeLevel {
  const {
    sourceScore = 0,
    legalScore = 0,
    reserveScore = 0,
    liquidityScore = 0,
    riskScore = 0,
  } = requirements;

  if (
    score >= 85 &&
    sourceScore >= 90 &&
    legalScore >= 80 &&
    reserveScore >= 80 &&
    liquidityScore >= 70 &&
    riskScore >= 75 &&
    blockers.length === 0
  ) {
    return 'institutional';
  }

  if (score >= 65) return 'analytics';

  return 'research';
}

function resolveProtocolGrade(
  score: number,
  blockers: string[],
  requirements: {
    sourceScore?: number;
    protocolScore?: number;
    governanceScore?: number;
    liquidityScore?: number;
    riskScore?: number;
  } = {},
): AssetGradeLevel {
  const {
    sourceScore = 0,
    protocolScore = 0,
    governanceScore = 0,
    liquidityScore = 0,
    riskScore = 0,
  } = requirements;

  if (
    score >= 85 &&
    sourceScore >= 90 &&
    protocolScore >= 80 &&
    governanceScore >= 75 &&
    liquidityScore >= 70 &&
    riskScore >= 75 &&
    blockers.length === 0
  ) {
    return 'institutional';
  }

  if (score >= 65) return 'analytics';

  return 'research';
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

function calculateProtocolCompleteness(input: GradeInput): number {
  const checks = [
    input.identity?.name,
    input.identity?.symbol,
    input.identity?.category,
    input.identity?.websiteUrl,
    input.identity?.docsUrl,
    input.identity?.twitterUrl,

    input.market?.price,
    input.market?.marketCap,
    input.market?.volume24h,
    input.market?.circulatingSupply,
    input.market?.totalSupply,
    input.market?.holderCount,
    input.market?.tvl,

    input.institutional?.issuerName,
    input.institutional?.issuerType,
    input.institutional?.legalStructure,
    input.institutional?.targetInvestors,

    input.blockchain?.[0]?.chain,
    input.blockchain?.[0]?.contractAddress,
    input.blockchain?.[0]?.explorerUrl,
    input.blockchain?.[0]?.isVerified,

    input.compliance?.regulatoryStatus,

    input.liquidity?.liquidityScore,
    input.liquidity?.onchainLiquidity,

    input.risk?.overallScore,
  ];

  const filled = checks.filter(hasValue).length;
  return clamp((filled / checks.length) * 100);
}

function calculateSourceScore(
  input: GradeInput,
  required: Array<[string, string]> = [
    ['identity', 'websiteUrl'],
    ['identity', 'docsUrl'],
    ['reserve', 'backingType'],
    ['reserve', 'custodian'],
    ['institutional', 'issuerName'],
    ['institutional', 'legalStructure'],
    ['compliance', 'regulatoryStatus'],
    ['blockchain', 'contractAddress'],
    ['liquidity', 'redemptionType'],
  ],
): number {
  const sources = input.sources ?? [];
  if (sources.length === 0) return 0;

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

function calculateCustodyScore(input: GradeInput, blockers: string[], warnings: string[]): number {
  let score = 0;

  if (hasValue(input.reserve?.custodian)) score += 30;
  else blockers.push('Missing commodity custodian or vaulting provider');

  if (hasValue(input.reserve?.custodianUrl)) score += 15;
  else warnings.push('Missing custodian URL');

  if (hasValue(input.reserve?.lastAuditUrl)) score += 20;
  else warnings.push('Missing commodity reserve attestation/report URL');

  if (hasValue(input.reserve?.auditor)) score += 15;
  else warnings.push('Missing reserve auditor');

  if (input.reserve?.hasProofOfReserves === true) score += 10;
  else warnings.push('No proof-of-reserves confirmed');

  if (hasValue(input.reserve?.reserveBreakdown)) score += 10;
  else warnings.push('Missing reserve breakdown');

  return clamp(score);
}

function calculateCollateralScore(input: GradeInput, blockers: string[], warnings: string[]): number {
  let score = 0;

  if (hasValue(input.reserve?.backingType)) score += 20;
  else warnings.push('Missing pool collateral/backing type');

  if (hasValue(input.reserve?.backingDescription)) score += 20;
  else blockers.push('Missing pool collateral/backing description');

  if (hasValue(input.reserve?.reserveBreakdown)) score += 20;
  else warnings.push('Missing pool composition or reserve breakdown');

  if (hasValue(input.yield?.currentYield)) score += 10;
  else warnings.push('Missing pool yield');

  if (hasValue(input.liquidity?.redemptionType)) score += 10;
  else warnings.push('Missing pool redemption type');

  if (hasValue(input.liquidity?.redemptionPeriodDays)) score += 10;
  else warnings.push('Missing pool redemption period');

  if (hasValue(input.reserve?.lastAuditUrl)) score += 10;
  else warnings.push('Missing pool audit/report URL');

  return clamp(score);
}

function calculateBorrowerScore(input: GradeInput, warnings: string[]): number {
  let score = 0;

  if (hasValue(input.institutional?.issuerName)) score += 20;
  else warnings.push('Missing issuer/originator name');

  if (hasValue(input.institutional?.issuerType)) score += 15;
  else warnings.push('Missing issuer/originator type');

  if (hasValue(input.institutional?.legalStructure)) score += 20;
  else warnings.push('Missing pool legal structure');

  if (hasValue(input.reserve?.reserveBreakdown)) score += 20;
  else warnings.push('Missing borrower, loan book, or pool composition details');

  if (hasValue(input.risk?.counterpartyRisk)) score += 15;
  else warnings.push('Missing counterparty risk assessment');

  if (hasValue(input.risk?.riskFactors)) score += 10;
  else warnings.push('Missing borrower/pool risk factors');

  return clamp(score);
}

function calculateProtocolScore(input: GradeInput, blockers: string[], warnings: string[]): number {
  let score = 0;

  if (hasValue(input.identity?.websiteUrl)) score += 15;
  else blockers.push('Missing protocol website');

  if (hasValue(input.identity?.docsUrl)) score += 20;
  else blockers.push('Missing protocol documentation');

  if (hasValue(input.blockchain?.[0]?.contractAddress)) score += 20;
  else blockers.push('Missing governance/protocol token contract address');

  if (input.blockchain?.some((item) => item?.isVerified === true)) score += 15;
  else warnings.push('Token contract verification is not confirmed');

  if (hasValue(input.market?.tvl) || hasValue(input.market?.aumUsd)) score += 15;
  else warnings.push('Missing protocol TVL/AUM/adoption metric');

  if (hasValue(input.compliance?.regulatoryStatus)) score += 15;
  else warnings.push('Missing protocol regulatory/compliance status');

  return clamp(score);
}

function calculateTokenomicsScore(input: GradeInput, warnings: string[]): number {
  let score = 0;

  if (hasValue(input.market?.circulatingSupply)) score += 20;
  else warnings.push('Missing circulating supply');

  if (hasValue(input.market?.totalSupply)) score += 20;
  else warnings.push('Missing total supply');

  if (hasValue(input.market?.marketCap)) score += 15;
  else warnings.push('Missing market cap');

  if (hasValue(input.market?.volume24h)) score += 15;
  else warnings.push('Missing 24h volume');

  if (hasValue(input.market?.holderCount)) score += 15;
  else warnings.push('Missing holder count');

  if (hasValue(input.risk?.concentrationRisk)) score += 15;
  else warnings.push('Missing concentration risk assessment');

  return clamp(score);
}

function calculateGovernanceScore(input: GradeInput, warnings: string[]): number {
  let score = 0;

  if (hasValue(input.institutional?.issuerName)) score += 20;
  else warnings.push('Missing protocol steward / issuer name');

  if (hasValue(input.institutional?.issuerType)) score += 15;
  else warnings.push('Missing protocol steward / issuer type');

  if (hasValue(input.institutional?.legalStructure)) score += 20;
  else warnings.push('Missing protocol legal/governance structure');

  if (hasValue(input.institutional?.metadata?.governanceNote)) score += 15;
  else warnings.push('Missing governance note');

  if (hasValue(input.risk?.regulatoryRisk)) score += 15;
  else warnings.push('Missing regulatory risk score');

  if (hasValue(input.risk?.smartContractRisk)) score += 15;
  else warnings.push('Missing smart contract risk score');

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

function calculateTokenLiquidityScore(input: GradeInput, warnings: string[]): number {
  let score = 0;

  if (hasValue(input.market?.volume24h)) score += 20;
  else warnings.push('Missing token trading volume');

  if (hasValue(input.market?.marketCap)) score += 15;
  else warnings.push('Missing token market cap');

  if (hasValue(input.liquidity?.liquidityScore)) score += input.liquidity.liquidityScore * 0.4;
  else warnings.push('Missing token liquidity score');

  if (hasValue(input.liquidity?.onchainLiquidity)) score += 15;
  else warnings.push('Missing token on-chain liquidity');

  if (hasValue(input.market?.holderCount)) score += 10;
  else warnings.push('Missing token holder count');

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

function calculateAssetBackedGrade(input: GradeInput, gradingProfile: GradingProfile): GradeResult {
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

  const grade = resolveGrade(score, blockers, {
    sourceScore,
    legalScore,
    reserveScore,
    liquidityScore,
    riskScore,
  });

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
    ...commonClassificationOutput(input, gradingProfile, grade),
    applicability: {
      reserve: hasValue(input.reserve?.backingDescription) ? 'available' : 'missing',
      custody: hasValue(input.reserve?.custodian) ? 'available' : 'missing',
      redemption: hasValue(input.reserve?.redemptionAsset) ? 'available' : 'missing',
      proofOfReserves: input.reserve?.hasProofOfReserves === true ? 'available' : 'missing',
    },
    profileScores: {
      completenessScore,
      sourceScore,
      legalScore,
      reserveScore,
      liquidityScore,
      riskScore,
    },
  };
}

function calculateCommodityBackedGrade(input: GradeInput, gradingProfile: GradingProfile): GradeResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const sourceScore = calculateSourceScore(input, [
    ['identity', 'websiteUrl'],
    ['identity', 'docsUrl'],
    ['reserve', 'backingType'],
    ['reserve', 'custodian'],
    ['reserve', 'lastAuditUrl'],
    ['reserve', 'redemptionAsset'],
    ['compliance', 'regulatoryStatus'],
    ['blockchain', 'contractAddress'],
    ['liquidity', 'redemptionType'],
  ]);
  const legalScore = calculateLegalScore(input, blockers, warnings);
  const reserveScore = calculateReserveScore(input, blockers, warnings);
  const custodyScore = calculateCustodyScore(input, blockers, warnings);
  const liquidityScore = calculateLiquidityScore(input, blockers, warnings);
  const riskScore = calculateRiskScore(input, warnings);

  const score = clamp(
    sourceScore * 0.2 +
    legalScore * 0.2 +
    reserveScore * 0.3 +
    custodyScore * 0.15 +
    liquidityScore * 0.1 +
    riskScore * 0.05,
  );

  const grade = resolveGrade(score, blockers, {
    sourceScore,
    legalScore,
    reserveScore,
    liquidityScore,
    riskScore,
  });

  return {
    grade,
    score,
    completenessScore: custodyScore,
    sourceScore,
    legalScore,
    reserveScore,
    liquidityScore,
    riskScore,
    blockers,
    warnings,
    ...commonClassificationOutput(input, gradingProfile, grade),
    applicability: {
      reserve: hasValue(input.reserve?.backingDescription) ? 'available' : 'missing',
      custody: hasValue(input.reserve?.custodian) ? 'available' : 'missing',
      redemption: hasValue(input.reserve?.redemptionAsset) ? 'available' : 'missing',
      proofOfReserves: input.reserve?.hasProofOfReserves === true ? 'available' : 'missing',
    },
    profileScores: {
      sourceScore,
      legalScore,
      reserveScore,
      custodyScore,
      liquidityScore,
      riskScore,
    },
  };
}

function calculateCreditPoolGrade(input: GradeInput, gradingProfile: GradingProfile): GradeResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const sourceScore = calculateSourceScore(input, [
    ['identity', 'websiteUrl'],
    ['identity', 'docsUrl'],
    ['reserve', 'backingType'],
    ['reserve', 'backingDescription'],
    ['institutional', 'issuerName'],
    ['institutional', 'legalStructure'],
    ['compliance', 'regulatoryStatus'],
    ['blockchain', 'contractAddress'],
    ['liquidity', 'redemptionType'],
  ]);
  const legalScore = calculateLegalScore(input, blockers, warnings);
  const collateralScore = calculateCollateralScore(input, blockers, warnings);
  const borrowerScore = calculateBorrowerScore(input, warnings);
  const liquidityScore = calculateLiquidityScore(input, blockers, warnings);
  const riskScore = calculateRiskScore(input, warnings);

  const score = clamp(
    sourceScore * 0.2 +
    legalScore * 0.15 +
    collateralScore * 0.2 +
    borrowerScore * 0.15 +
    liquidityScore * 0.15 +
    riskScore * 0.15,
  );

  const grade = resolveGrade(score, blockers, {
    sourceScore,
    legalScore,
    reserveScore: collateralScore,
    liquidityScore,
    riskScore,
  });

  return {
    grade,
    score,
    completenessScore: borrowerScore,
    sourceScore,
    legalScore,
    reserveScore: collateralScore,
    liquidityScore,
    riskScore,
    blockers,
    warnings,
    ...commonClassificationOutput(input, gradingProfile, grade),
    applicability: {
      reserve: hasValue(input.reserve?.backingDescription) ? 'available' : 'missing',
      collateral: hasValue(input.reserve?.backingDescription) ? 'available' : 'missing',
      borrower: hasValue(input.institutional?.issuerName) ? 'available' : 'missing',
      redemption: hasValue(input.liquidity?.redemptionType) ? 'available' : 'missing',
      proofOfReserves: 'not_applicable',
    },
    profileScores: {
      sourceScore,
      legalScore,
      collateralScore,
      borrowerScore,
      liquidityScore,
      riskScore,
    },
  };
}

function calculateGovernanceProtocolGrade(input: GradeInput, gradingProfile: GradingProfile): GradeResult {
  const blockers: string[] = [];
  const warnings: string[] = [
    'Reserve, custodian, redemption asset, and proof-of-reserves fields are not applicable for governance_protocol grading.',
  ];

  const sourceScore = calculateSourceScore(input, [
    ['identity', 'websiteUrl'],
    ['identity', 'docsUrl'],
    ['institutional', 'issuerName'],
    ['institutional', 'legalStructure'],
    ['compliance', 'regulatoryStatus'],
    ['blockchain', 'contractAddress'],
    ['market', 'marketCap'],
    ['market', 'volume24h'],
    ['market', 'holderCount'],
  ]);
  const protocolScore = calculateProtocolScore(input, blockers, warnings);
  const tokenomicsScore = calculateTokenomicsScore(input, warnings);
  const governanceScore = calculateGovernanceScore(input, warnings);
  const liquidityScore = calculateTokenLiquidityScore(input, warnings);
  const riskScore = calculateRiskScore(input, warnings);

  const score = clamp(
    sourceScore * 0.2 +
    protocolScore * 0.2 +
    tokenomicsScore * 0.15 +
    governanceScore * 0.15 +
    liquidityScore * 0.15 +
    riskScore * 0.15,
  );

  const grade = resolveProtocolGrade(score, blockers, {
    sourceScore,
    protocolScore,
    governanceScore,
    liquidityScore,
    riskScore,
  });

  return {
    grade,
    score,
    completenessScore: calculateProtocolCompleteness(input),
    sourceScore,
    legalScore: governanceScore,
    reserveScore: null,
    liquidityScore,
    riskScore,
    blockers,
    warnings,
    ...commonClassificationOutput(input, gradingProfile, grade),
    applicability: {
      reserve: 'not_applicable',
      custody: 'not_applicable',
      redemption: 'not_applicable',
      proofOfReserves: 'not_applicable',
      protocol: hasValue(input.identity?.docsUrl) ? 'available' : 'missing',
      tokenomics: hasValue(input.market?.circulatingSupply) && hasValue(input.market?.totalSupply) ? 'available' : 'missing',
      governance: hasValue(input.institutional?.metadata?.governanceNote) ? 'available' : 'missing',
    },
    profileScores: {
      sourceScore,
      protocolScore,
      tokenomicsScore,
      governanceScore,
      liquidityScore,
      riskScore,
      reserveScore: null,
    },
  };
}

export function calculateAssetGrade(input: GradeInput): GradeResult {
  const gradingProfile = getGradingProfile(input);

  if (gradingProfile === 'commodity_backed') {
    return calculateCommodityBackedGrade(input, gradingProfile);
  }

  if (gradingProfile === 'credit_pool') {
    return calculateCreditPoolGrade(input, gradingProfile);
  }

  if (gradingProfile === 'governance_protocol') {
    return calculateGovernanceProtocolGrade(input, gradingProfile);
  }

  return calculateAssetBackedGrade(input, gradingProfile);
}
