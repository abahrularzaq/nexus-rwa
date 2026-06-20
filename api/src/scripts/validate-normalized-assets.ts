import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_JSON_FILES = [
  'identity.json',
  'market.json',
  'risk.json',
  'reserve.json',
  'yield.json',
  'institutional.json',
  'blockchain.json',
  'compliance.json',
  'liquidity.json',
  'sources.json',
] as const;

const OPTIONAL_FILES = ['source-discovery.md', 'grade-baseline.json', 'monitoring.json'] as const;

const STRICT_MONITORING_FILES = ['grade-baseline.json', 'monitoring.json'] as const;
const VALID_MONITORING_STATUSES = ['active-research', 'active-analytics', 'active-institutional', 'paused', 'deprecated'] as const;
const VALID_MONITORING_PRIORITIES = ['high', 'medium', 'low'] as const;
const REQUIRED_REVIEW_SCHEDULE_FIELDS = [
  'lastManualReview',
  'nextManualReview',
  'manualReviewFrequencyDays',
  'marketRefreshFrequencyHours',
  'liquidityRefreshFrequencyHours',
  'sourceHealthCheckFrequencyDays',
  'legalReviewFrequencyDays',
  'riskReviewFrequencyDays',
] as const;
const REQUIRED_FRESHNESS_POLICY_FIELDS = [
  'marketDataMaxAgeHours',
  'liquidityDataMaxAgeHours',
  'holderDataMaxAgeDays',
  'sourceDataMaxAgeDays',
  'legalDataMaxAgeDays',
  'riskDataMaxAgeDays',
] as const;
const STRICT_EVIDENCE_LAYERS = [
  'identity',
  'blockchain',
  'reserve',
  'institutional',
  'compliance',
  'market',
  'liquidity',
  'risk',
] as const;

type ValidationOptions = {
  strictMonitoring: boolean;
};

type Severity = 'error' | 'warning';

type ValidationIssue = {
  severity: Severity;
  assetSlug: string;
  file: string;
  field?: string;
  message: string;
};

type ValidationResult = {
  assetSlug: string;
  issues: ValidationIssue[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNumberOrNull(value: unknown): boolean {
  return value === null || typeof value === 'number';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function parseDate(value: unknown): Date | null {
  if (!isString(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAssetsDir(): string {
  const candidates = [
    path.join(ROOT, '..', 'data', 'assets'),
    path.join(ROOT, 'data', 'assets'),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`Normalized assets directory not found. Tried: ${candidates.join(', ')}`);
  }

  return found;
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

function listAssetSlugs(assetsDir: string): string[] {
  return fs
    .readdirSync(assetsDir)
    .filter((name) => !name.startsWith('_') && name !== 'README.md')
    .filter((name) => fs.statSync(path.join(assetsDir, name)).isDirectory())
    .sort();
}

function addIssue(
  issues: ValidationIssue[],
  severity: Severity,
  assetSlug: string,
  file: string,
  message: string,
  field?: string,
): void {
  issues.push({ severity, assetSlug, file, field, message });
}

function requireString(
  json: Record<string, unknown>,
  issues: ValidationIssue[],
  assetSlug: string,
  file: string,
  field: string,
): void {
  if (!isString(json[field])) {
    addIssue(issues, 'error', assetSlug, file, `${field} must be a non-empty string`, field);
  }
}

function requireBoolean(
  json: Record<string, unknown>,
  issues: ValidationIssue[],
  assetSlug: string,
  file: string,
  field: string,
): void {
  if (!isBoolean(json[field])) {
    addIssue(issues, 'error', assetSlug, file, `${field} must be boolean`, field);
  }
}


function validateMeta(
  json: Record<string, unknown>,
  issues: ValidationIssue[],
  assetSlug: string,
  file: string,
): void {
  const meta = json._meta;
  if (meta === undefined) {
    addIssue(issues, 'warning', assetSlug, file, 'Missing _meta block', '_meta');
    return;
  }

  if (!isRecord(meta)) {
    addIssue(issues, 'error', assetSlug, file, '_meta must be an object', '_meta');
    return;
  }

  if (!isString(meta.dataOwner)) {
    addIssue(issues, 'warning', assetSlug, file, '_meta.dataOwner is missing', '_meta.dataOwner');
  }

  if (meta.lastManualReview !== undefined && !parseDate(meta.lastManualReview)) {
    addIssue(issues, 'warning', assetSlug, file, '_meta.lastManualReview is not a valid date', '_meta.lastManualReview');
  }

  if (meta.reviewFrequencyDays !== undefined && typeof meta.reviewFrequencyDays !== 'number') {
    addIssue(issues, 'warning', assetSlug, file, '_meta.reviewFrequencyDays should be a number', '_meta.reviewFrequencyDays');
  }
}

function validateIdentity(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'identity.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'identity.json must be an object');
    return;
  }

  for (const field of ['name', 'symbol', 'category'] as const) {
    requireString(json, issues, assetSlug, file, field);
  }

  if (json.tags !== undefined && (!Array.isArray(json.tags) || !json.tags.every((tag) => typeof tag === 'string'))) {
    addIssue(issues, 'error', assetSlug, file, 'tags must be an array of strings', 'tags');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateMarket(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'market.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'market.json must be an object');
    return;
  }

  for (const field of [
    'tvl',
    'tvl7dChange',
    'tvl30dChange',
    'price',
    'priceChange24h',
    'marketCap',
    'volume24h',
    'circulatingSupply',
    'totalSupply',
    'holderCount',
    'holderChange7d',
    'aumUsd',
  ] as const) {
    if (!isNumberOrNull(json[field])) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be number or null`, field);
    }
  }

  if (json.sources !== undefined && (!Array.isArray(json.sources) || !json.sources.every((source) => typeof source === 'string'))) {
    addIssue(issues, 'error', assetSlug, file, 'sources must be an array of source URL strings', 'sources');
  }

  const hasMarketData = ['tvl', 'price', 'marketCap', 'volume24h', 'circulatingSupply', 'totalSupply'].some(
    (field) => typeof json[field] === 'number',
  );
  if (hasMarketData && !parseDate(json.lastUpdated)) {
    addIssue(issues, 'warning', assetSlug, file, 'lastUpdated should be a valid date when market data is populated', 'lastUpdated');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateRisk(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'risk.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'risk.json must be an object');
    return;
  }

  for (const field of [
    'overallScore',
    'smartContractRisk',
    'counterpartyRisk',
    'liquidityRisk',
    'regulatoryRisk',
    'marketRisk',
    'concentrationRisk',
  ] as const) {
    if (!isNumberOrNull(json[field])) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be number or null`, field);
    }
  }

  if (json.overallLevel !== null && json.overallLevel !== undefined) {
    const level = typeof json.overallLevel === 'string' ? json.overallLevel.toUpperCase() : '';
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(level)) {
      addIssue(issues, 'error', assetSlug, file, 'overallLevel must be LOW, MEDIUM, HIGH, or null', 'overallLevel');
    }
  }

  for (const field of ['riskFactors', 'mitigants'] as const) {
    if (!Array.isArray(json[field]) || !json[field].every((item) => typeof item === 'string')) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be an array of strings`, field);
    }
  }

  if (json.lastAssessed !== null && json.lastAssessed !== undefined && !parseDate(json.lastAssessed)) {
    addIssue(issues, 'warning', assetSlug, file, 'lastAssessed should be a valid date or null', 'lastAssessed');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateReserve(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'reserve.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'reserve.json must be an object');
    return;
  }

  if (json.backingType !== null && json.backingType !== undefined && !isString(json.backingType)) {
    addIssue(issues, 'error', assetSlug, file, 'backingType must be a non-empty string or null', 'backingType');
  }
  requireBoolean(json, issues, assetSlug, file, 'hasProofOfReserves');

  if (!isNumberOrNull(json.collateralizationRatio)) {
    addIssue(issues, 'error', assetSlug, file, 'collateralizationRatio must be number or null', 'collateralizationRatio');
  }

  if (json.lastAuditDate !== null && json.lastAuditDate !== undefined && !parseDate(json.lastAuditDate)) {
    addIssue(issues, 'warning', assetSlug, file, 'lastAuditDate should be a valid date or null', 'lastAuditDate');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateYield(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'yield.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'yield.json must be an object');
    return;
  }

  for (const field of [
    'currentYield',
    'yieldVsBenchmark',
    'yieldAvg7d',
    'yieldAvg30d',
    'yieldAvg90d',
    'yieldMin52w',
    'yieldMax52w',
    'yieldStdDev30d',
  ] as const) {
    if (!isNumberOrNull(json[field])) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be number or null`, field);
    }
  }

  if (json.nextYieldDate !== null && json.nextYieldDate !== undefined && !parseDate(json.nextYieldDate)) {
    addIssue(issues, 'warning', assetSlug, file, 'nextYieldDate should be a valid date or null', 'nextYieldDate');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateInstitutional(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'institutional.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'institutional.json must be an object');
    return;
  }

  for (const field of ['minimumInvestment', 'managementFee', 'performanceFee'] as const) {
    if (!isNumberOrNull(json[field])) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be number or null`, field);
    }
  }

  if (json.metadata !== undefined && !isRecord(json.metadata)) {
    addIssue(issues, 'error', assetSlug, file, 'metadata must be an object', 'metadata');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateBlockchain(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'blockchain.json';
  if (!Array.isArray(json)) {
    addIssue(issues, 'error', assetSlug, file, 'blockchain.json must be an array');
    return;
  }

  if (json.length === 0) {
    addIssue(issues, 'warning', assetSlug, file, 'blockchain.json has no chain entries');
  }

  json.forEach((item, index) => {
    if (!isRecord(item)) {
      addIssue(issues, 'error', assetSlug, file, `blockchain[${index}] must be an object`, `blockchain[${index}]`);
      return;
    }

    for (const field of ['chain', 'contractAddress'] as const) {
      if (!isString(item[field])) {
        addIssue(issues, 'error', assetSlug, file, `blockchain[${index}].${field} must be a non-empty string`, `blockchain[${index}].${field}`);
      }
    }

    if (!isNumberOrNull(item.chainId)) {
      addIssue(issues, 'error', assetSlug, file, `blockchain[${index}].chainId must be number or null`, `blockchain[${index}].chainId`);
    }

    for (const field of ['isTransferable', 'hasWhitelist', 'hasTransferRestrictions', 'isVerified'] as const) {
      if (!isBoolean(item[field])) {
        addIssue(issues, 'error', assetSlug, file, `blockchain[${index}].${field} must be boolean`, `blockchain[${index}].${field}`);
      }
    }
  });
}

function validateCompliance(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'compliance.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'compliance.json must be an object');
    return;
  }

  for (const field of ['kycRequired', 'accreditedOnly', 'sanctionsScreening'] as const) {
    requireBoolean(json, issues, assetSlug, file, field);
  }

  for (const field of ['blockedJurisdictions', 'allowedJurisdictions'] as const) {
    if (!Array.isArray(json[field]) || !json[field].every((item) => typeof item === 'string')) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be an array of strings`, field);
    }
  }

  if (json.lastComplianceCheck !== null && json.lastComplianceCheck !== undefined && !parseDate(json.lastComplianceCheck)) {
    addIssue(issues, 'warning', assetSlug, file, 'lastComplianceCheck should be a valid date or null', 'lastComplianceCheck');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateLiquidity(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'liquidity.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'liquidity.json must be an object');
    return;
  }

  for (const field of ['redemptionPeriodDays', 'lockupPeriodDays', 'earlyRedemptionFee', 'minRedemptionAmount', 'onchainLiquidity', 'bidAskSpread', 'liquidityScore'] as const) {
    if (!isNumberOrNull(json[field])) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be number or null`, field);
    }
  }

  if (!Array.isArray(json.dexPairs)) {
    addIssue(issues, 'error', assetSlug, file, 'dexPairs must be an array', 'dexPairs');
  }

  validateMeta(json, issues, assetSlug, file);
}

function validateSources(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'sources.json';
  if (!Array.isArray(json)) {
    addIssue(issues, 'error', assetSlug, file, 'sources.json must be an array');
    return;
  }

  json.forEach((item, index) => {
    if (!isRecord(item)) {
      addIssue(issues, 'error', assetSlug, file, `sources[${index}] must be an object`, `sources[${index}]`);
      return;
    }

    for (const field of ['layer', 'field', 'sourceUrl', 'sourceType'] as const) {
      if (!isString(item[field])) {
        addIssue(issues, 'error', assetSlug, file, `sources[${index}].${field} must be a non-empty string`, `sources[${index}].${field}`);
      }
    }

    if (typeof item.reliability !== 'number') {
      addIssue(issues, 'error', assetSlug, file, `sources[${index}].reliability must be a number`, `sources[${index}].reliability`);
    }

    if (item.checkedBy !== undefined && !isString(item.checkedBy)) {
      addIssue(issues, 'warning', assetSlug, file, `sources[${index}].checkedBy should be a string`, `sources[${index}].checkedBy`);
    }
  });
}

function validateGradeBaseline(json: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'grade-baseline.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'grade-baseline.json must be an object');
    return;
  }

  if (json.slug !== assetSlug) {
    addIssue(issues, 'error', assetSlug, file, `slug must match folder slug "${assetSlug}"`, 'slug');
  }

  for (const field of ['grade', 'status'] as const) {
    requireString(json, issues, assetSlug, file, field);
  }

  for (const field of ['score', 'completenessScore', 'sourceScore', 'legalScore', 'liquidityScore', 'riskScore'] as const) {
    if (typeof json[field] !== 'number') {
      addIssue(issues, 'error', assetSlug, file, `${field} must be a number`, field);
    }
  }

  if (!isNumberOrNull(json.reserveScore)) {
    addIssue(issues, 'error', assetSlug, file, 'reserveScore must be a number or null', 'reserveScore');
  }

  for (const field of ['blockers', 'warnings', 'nextActions'] as const) {
    if (!Array.isArray(json[field]) || !json[field].every((item) => typeof item === 'string')) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be an array of strings`, field);
    }
  }

  if (!parseDate(json.baselineDate)) {
    addIssue(issues, 'warning', assetSlug, file, 'baselineDate should be a valid date', 'baselineDate');
  }
}

function validateMonitoring(json: unknown, issues: ValidationIssue[], assetSlug: string, options: ValidationOptions): void {
  const file = 'monitoring.json';
  if (!isRecord(json)) {
    addIssue(issues, 'error', assetSlug, file, 'monitoring.json must be an object');
    return;
  }

  if (json.assetSlug !== assetSlug) {
    addIssue(issues, 'error', assetSlug, file, `assetSlug must match folder slug "${assetSlug}"`, 'assetSlug');
  }

  for (const field of ['assetSymbol', 'assetName', 'monitoringStatus', 'monitoringPriority'] as const) {
    requireString(json, issues, assetSlug, file, field);
  }

  if (options.strictMonitoring) {
    if (isString(json.monitoringStatus) && !VALID_MONITORING_STATUSES.includes(json.monitoringStatus as typeof VALID_MONITORING_STATUSES[number])) {
      addIssue(issues, 'error', assetSlug, file, `monitoringStatus must be one of: ${VALID_MONITORING_STATUSES.join(', ')}`, 'monitoringStatus');
    }

    if (isString(json.monitoringPriority) && !VALID_MONITORING_PRIORITIES.includes(json.monitoringPriority as typeof VALID_MONITORING_PRIORITIES[number])) {
      addIssue(issues, 'error', assetSlug, file, `monitoringPriority must be one of: ${VALID_MONITORING_PRIORITIES.join(', ')}`, 'monitoringPriority');
    }
  }

  if (!isRecord(json.gradeBaseline)) {
    addIssue(issues, 'error', assetSlug, file, 'gradeBaseline must be an object', 'gradeBaseline');
  }

  if (!isRecord(json.reviewSchedule)) {
    addIssue(issues, 'error', assetSlug, file, 'reviewSchedule must be an object', 'reviewSchedule');
  } else if (options.strictMonitoring) {
    for (const field of REQUIRED_REVIEW_SCHEDULE_FIELDS) {
      if (field === 'lastManualReview' || field === 'nextManualReview') {
        if (!parseDate(json.reviewSchedule[field])) {
          addIssue(issues, 'error', assetSlug, file, `reviewSchedule.${field} must be a valid date string`, `reviewSchedule.${field}`);
        }
      } else {
        if (typeof json.reviewSchedule[field] !== 'number' || json.reviewSchedule[field] <= 0) {
          addIssue(issues, 'error', assetSlug, file, `reviewSchedule.${field} must be a positive number`, `reviewSchedule.${field}`);
        }
      }
    }
  }

  if (!isRecord(json.freshnessPolicy)) {
    addIssue(issues, 'error', assetSlug, file, 'freshnessPolicy must be an object', 'freshnessPolicy');
  } else if (options.strictMonitoring) {
    for (const field of REQUIRED_FRESHNESS_POLICY_FIELDS) {
      if (typeof json.freshnessPolicy[field] !== 'number' || json.freshnessPolicy[field] <= 0) {
        addIssue(issues, 'error', assetSlug, file, `freshnessPolicy.${field} must be a positive number`, `freshnessPolicy.${field}`);
      }
    }
  }

  for (const field of ['autoMonitoredFields', 'manualMonitoredFields', 'knownBlockers', 'knownWarnings', 'alertRules', 'sourceHealthChecks', 'monitoringNotes'] as const) {
    if (!Array.isArray(json[field])) {
      addIssue(issues, 'error', assetSlug, file, `${field} must be an array`, field);
    }
  }

  if (typeof json.templateVersion !== 'number') {
    addIssue(issues, 'warning', assetSlug, file, 'templateVersion should be a number', 'templateVersion');
  }
}

function validateStrictSourceEvidence(sourcesJson: unknown, issues: ValidationIssue[], assetSlug: string): void {
  const file = 'sources.json';
  if (!Array.isArray(sourcesJson)) return;

  for (const layer of STRICT_EVIDENCE_LAYERS) {
    const hasLayerEvidence = sourcesJson.some((item) => {
      if (!isRecord(item)) return false;
      return item.layer === layer && isString(item.sourceUrl) && isString(item.field);
    });

    if (!hasLayerEvidence) {
      addIssue(issues, 'error', assetSlug, file, `Strict monitoring requires source evidence for ${layer} layer`, layer);
    }
  }
}

function validateRequiredJson(assetSlug: string, fileName: string, json: unknown, issues: ValidationIssue[]): void {
  switch (fileName) {
    case 'identity.json':
      validateIdentity(json, issues, assetSlug);
      break;
    case 'market.json':
      validateMarket(json, issues, assetSlug);
      break;
    case 'risk.json':
      validateRisk(json, issues, assetSlug);
      break;
    case 'reserve.json':
      validateReserve(json, issues, assetSlug);
      break;
    case 'yield.json':
      validateYield(json, issues, assetSlug);
      break;
    case 'institutional.json':
      validateInstitutional(json, issues, assetSlug);
      break;
    case 'blockchain.json':
      validateBlockchain(json, issues, assetSlug);
      break;
    case 'compliance.json':
      validateCompliance(json, issues, assetSlug);
      break;
    case 'liquidity.json':
      validateLiquidity(json, issues, assetSlug);
      break;
    case 'sources.json':
      validateSources(json, issues, assetSlug);
      break;
  }
}

function validateAsset(assetsDir: string, assetSlug: string, options: ValidationOptions): ValidationResult {
  const assetDir = path.join(assetsDir, assetSlug);
  const issues: ValidationIssue[] = [];
  let sourcesJson: unknown;

  if (!fs.existsSync(assetDir)) {
    addIssue(issues, 'error', assetSlug, 'asset', `Asset folder not found: ${assetDir}`);
    return { assetSlug, issues };
  }

  for (const fileName of REQUIRED_JSON_FILES) {
    const filePath = path.join(assetDir, fileName);
    if (!fs.existsSync(filePath)) {
      addIssue(issues, 'error', assetSlug, fileName, `Missing required normalized file: ${fileName}`);
      continue;
    }

    try {
      const json = readJson(filePath);
      if (fileName === 'sources.json') sourcesJson = json;
      validateRequiredJson(assetSlug, fileName, json, issues);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addIssue(issues, 'error', assetSlug, fileName, `Invalid JSON: ${message}`);
    }
  }

  if (options.strictMonitoring) {
    for (const fileName of STRICT_MONITORING_FILES) {
      if (!fs.existsSync(path.join(assetDir, fileName))) {
        addIssue(issues, 'error', assetSlug, fileName, `Strict monitoring requires file: ${fileName}`);
      }
    }
    validateStrictSourceEvidence(sourcesJson, issues, assetSlug);
  }

  for (const fileName of OPTIONAL_FILES) {
    const filePath = path.join(assetDir, fileName);
    if (!fs.existsSync(filePath)) {
      addIssue(issues, 'warning', assetSlug, fileName, `Optional file missing: ${fileName}`);
      continue;
    }

    if (fileName.endsWith('.json')) {
      try {
        const json = readJson(filePath);
        if (fileName === 'grade-baseline.json') validateGradeBaseline(json, issues, assetSlug);
        if (fileName === 'monitoring.json') validateMonitoring(json, issues, assetSlug, options);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        addIssue(issues, 'error', assetSlug, fileName, `Invalid JSON: ${message}`);
      }
    }
  }

  return { assetSlug, issues };
}

function parseArgs(): { slug?: string; all: boolean; strictMonitoring: boolean } {
  const args = process.argv.slice(2);
  const slugArg = args.find((arg) => arg.startsWith('--slug='));
  const slug = slugArg?.slice('--slug='.length);
  const all = args.includes('--all');
  const strictMonitoring = args.includes('--strict-monitoring');

  if (!slug && !all) {
    console.error('Usage: npm run validate:normalized-assets --workspace=api -- --slug=<slug> [--strict-monitoring]');
    console.error('       npm run validate:normalized-assets --workspace=api -- --all [--strict-monitoring]');
    process.exit(1);
  }

  if (slug && all) {
    console.error('Use either --slug=<slug> or --all, not both.');
    process.exit(1);
  }

  return { slug, all, strictMonitoring };
}

function printResult(result: ValidationResult): void {
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  const warnings = result.issues.filter((issue) => issue.severity === 'warning');

  console.log(`\n=== Validate normalized asset: ${result.assetSlug} ===`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  for (const issue of result.issues) {
    const icon = issue.severity === 'error' ? '✗' : '⚠';
    const field = issue.field ? `.${issue.field}` : '';
    console.log(`  ${icon} [${issue.severity}] ${issue.file}${field}: ${issue.message}`);
  }
}

function main(): void {
  const { slug, all, strictMonitoring } = parseArgs();
  const assetsDir = getAssetsDir();
  const slugs = all ? listAssetSlugs(assetsDir) : [slug!];
  const results = slugs.map((assetSlug) => validateAsset(assetsDir, assetSlug, { strictMonitoring }));

  for (const result of results) {
    printResult(result);
  }

  const totalErrors = results.flatMap((result) => result.issues).filter((issue) => issue.severity === 'error').length;
  const totalWarnings = results.flatMap((result) => result.issues).filter((issue) => issue.severity === 'warning').length;

  console.log('\n=== Normalized asset validation summary ===');
  console.log(JSON.stringify({ checkedAssets: results.length, strictMonitoring, errors: totalErrors, warnings: totalWarnings }, null, 2));

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
