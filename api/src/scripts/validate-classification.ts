import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

type Severity = 'error' | 'warning';

type ValidationIssue = {
  severity: Severity;
  slug: string;
  field: string;
  message: string;
};

type Args = {
  slug: string | null;
  all: boolean;
  strict: boolean;
};

type Classification = {
  assetClass?: string | null;
  instrumentType?: string | null;
  claimType?: string | null;
  gradingProfile?: string | null;
  publicSegment?: string | null;
  reserveApplicability?: string | null;
  custodyApplicability?: string | null;
  redemptionApplicability?: string | null;
  proofOfReservesApplicability?: string | null;
  classificationNote?: string | null;
};

const REPO_ROOT = join(import.meta.dirname, '../../..');
const ASSETS_ROOT = join(REPO_ROOT, 'data', 'assets');

const ASSET_CLASSES = new Set([
  'tokenized_treasury',
  'tokenized_credit',
  'tokenized_commodity',
  'tokenized_real_estate',
  'tokenized_fund',
  'stablecoin_reserve',
  'rwa_infrastructure',
  'other',
]);

const INSTRUMENT_TYPES = new Set([
  'fund_share_token',
  'yield_bearing_note',
  'commodity_backed_token',
  'pool_token',
  'tranche_token',
  'real_estate_claim_token',
  'reserve_backed_payment_token',
  'governance_token',
  'protocol_token',
  'infrastructure_network_token',
  'other',
]);

const CLAIM_TYPES = new Set([
  'direct_asset_claim',
  'fund_share_claim',
  'debt_or_note_claim',
  'pool_or_tranche_exposure',
  'commodity_redemption_claim',
  'protocol_utility',
  'governance_right',
  'no_asset_claim',
  'unclear',
]);

const GRADING_PROFILES = new Set([
  'asset_backed',
  'commodity_backed',
  'credit_pool',
  'real_estate_claim',
  'governance_protocol',
]);

const PUBLIC_SEGMENTS = new Set([
  'RWA Assets',
  'RWA Credit Pools',
  'RWA Protocols',
  'Other',
]);

const APPLICABILITY = new Set(['available', 'missing', 'not_applicable']);

function parseArgs(argv: string[]): Args {
  let slug: string | null = null;
  let all = false;
  let strict = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slug' && argv[i + 1]) {
      slug = argv[i + 1]!;
      i += 1;
    } else if (arg.startsWith('--slug=')) {
      slug = arg.slice('--slug='.length);
    } else if (arg === '--all') {
      all = true;
    } else if (arg === '--strict') {
      strict = true;
    }
  }

  return { slug, all, strict };
}

function readJson<T = Record<string, unknown>>(slug: string, fileName: string): T | null {
  const path = join(ASSETS_ROOT, slug, fileName);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function listAssetSlugs(): string[] {
  if (!existsSync(ASSETS_ROOT)) return [];
  return readdirSync(ASSETS_ROOT)
    .filter((name) => !name.startsWith('_') && name !== 'ASSET_PROMPTS.md')
    .filter((name) => statSync(join(ASSETS_ROOT, name)).isDirectory())
    .sort();
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function hasBlocker(grade: Record<string, unknown> | null, terms: string[]): boolean {
  const blockers = grade?.blockers;
  if (!Array.isArray(blockers)) return false;

  return blockers.some((blocker) => {
    if (typeof blocker !== 'string') return false;
    const normalized = blocker.toLowerCase();
    return terms.every((term) => normalized.includes(term.toLowerCase()));
  });
}

function issue(
  issues: ValidationIssue[],
  severity: Severity,
  slug: string,
  field: string,
  message: string,
): void {
  issues.push({ severity, slug, field, message });
}

function getClassification(institutional: Record<string, unknown> | null): Classification | null {
  const metadata = institutional?.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;

  const classification = (metadata as Record<string, unknown>).classification;
  if (!classification || typeof classification !== 'object' || Array.isArray(classification)) return null;

  return classification as Classification;
}

function validateEnum(
  issues: ValidationIssue[],
  slug: string,
  field: keyof Classification,
  value: string | null | undefined,
  allowed: Set<string>,
): void {
  if (!hasValue(value)) {
    issue(issues, 'error', slug, `classification.${field}`, `Missing required classification field: ${field}`);
    return;
  }

  if (!allowed.has(String(value))) {
    issue(
      issues,
      'error',
      slug,
      `classification.${field}`,
      `Invalid value '${value}'. Allowed: ${Array.from(allowed).join(', ')}`,
    );
  }
}

function validateApplicability(
  issues: ValidationIssue[],
  slug: string,
  classification: Classification,
): void {
  const fields: Array<keyof Classification> = [
    'reserveApplicability',
    'custodyApplicability',
    'redemptionApplicability',
    'proofOfReservesApplicability',
  ];

  for (const field of fields) {
    const value = classification[field];
    if (!hasValue(value)) {
      issue(issues, 'warning', slug, `classification.${field}`, `Missing applicability field: ${field}`);
      continue;
    }
    if (!APPLICABILITY.has(String(value))) {
      issue(
        issues,
        'error',
        slug,
        `classification.${field}`,
        `Invalid applicability '${value}'. Allowed: available, missing, not_applicable`,
      );
    }
  }
}

function validateProfileConsistency(
  issues: ValidationIssue[],
  slug: string,
  c: Classification,
): void {
  const assetClass = c.assetClass;
  const instrumentType = c.instrumentType;
  const claimType = c.claimType;
  const profile = c.gradingProfile;

  if (profile === 'asset_backed') {
    if (!['tokenized_treasury', 'tokenized_fund', 'stablecoin_reserve', 'other'].includes(String(assetClass))) {
      issue(issues, 'warning', slug, 'classification.assetClass', `asset_backed profile usually should not use assetClass '${assetClass}'`);
    }
    if (!['fund_share_token', 'yield_bearing_note', 'reserve_backed_payment_token', 'other'].includes(String(instrumentType))) {
      issue(issues, 'error', slug, 'classification.instrumentType', `asset_backed profile is inconsistent with instrumentType '${instrumentType}'`);
    }
    if (!['direct_asset_claim', 'fund_share_claim', 'debt_or_note_claim', 'unclear'].includes(String(claimType))) {
      issue(issues, 'error', slug, 'classification.claimType', `asset_backed profile is inconsistent with claimType '${claimType}'`);
    }
  }

  if (profile === 'commodity_backed') {
    if (assetClass !== 'tokenized_commodity') {
      issue(issues, 'error', slug, 'classification.assetClass', 'commodity_backed profile requires assetClass tokenized_commodity');
    }
    if (instrumentType !== 'commodity_backed_token') {
      issue(issues, 'error', slug, 'classification.instrumentType', 'commodity_backed profile requires instrumentType commodity_backed_token');
    }
    if (claimType !== 'commodity_redemption_claim') {
      issue(issues, 'error', slug, 'classification.claimType', 'commodity_backed profile requires claimType commodity_redemption_claim');
    }
  }

  if (profile === 'credit_pool') {
    if (assetClass !== 'tokenized_credit') {
      issue(issues, 'error', slug, 'classification.assetClass', 'credit_pool profile requires assetClass tokenized_credit');
    }
    if (!['pool_token', 'tranche_token'].includes(String(instrumentType))) {
      issue(issues, 'error', slug, 'classification.instrumentType', `credit_pool profile is inconsistent with instrumentType '${instrumentType}'`);
    }
    if (claimType !== 'pool_or_tranche_exposure') {
      issue(issues, 'error', slug, 'classification.claimType', 'credit_pool profile requires claimType pool_or_tranche_exposure');
    }
  }

  if (profile === 'real_estate_claim') {
    if (assetClass !== 'tokenized_real_estate') {
      issue(issues, 'error', slug, 'classification.assetClass', 'real_estate_claim profile requires assetClass tokenized_real_estate');
    }
    if (instrumentType !== 'real_estate_claim_token') {
      issue(issues, 'error', slug, 'classification.instrumentType', 'real_estate_claim profile requires instrumentType real_estate_claim_token');
    }
  }

  if (profile === 'governance_protocol') {
    if (assetClass !== 'rwa_infrastructure') {
      issue(issues, 'error', slug, 'classification.assetClass', 'governance_protocol profile requires assetClass rwa_infrastructure');
    }
    if (!['governance_token', 'protocol_token', 'infrastructure_network_token'].includes(String(instrumentType))) {
      issue(issues, 'error', slug, 'classification.instrumentType', `governance_protocol profile is inconsistent with instrumentType '${instrumentType}'`);
    }
    if (!['governance_right', 'protocol_utility', 'no_asset_claim'].includes(String(claimType))) {
      issue(issues, 'error', slug, 'classification.claimType', `governance_protocol profile is inconsistent with claimType '${claimType}'`);
    }
  }
}

function validateEvidenceApplicability(
  issues: ValidationIssue[],
  slug: string,
  c: Classification,
  reserve: Record<string, unknown> | null,
  liquidity: Record<string, unknown> | null,
  institutional: Record<string, unknown> | null,
  grade: Record<string, unknown> | null,
): void {
  if (c.gradingProfile === 'governance_protocol') {
    if (hasValue(reserve?.backingType)) {
      issue(issues, 'error', slug, 'reserve.backingType', 'governance_protocol assets must not fill direct backingType artificially');
    }
    if (hasValue(reserve?.custodian)) {
      issue(issues, 'error', slug, 'reserve.custodian', 'governance_protocol assets must not fill direct custodian artificially');
    }
    if (hasValue(reserve?.redemptionAsset)) {
      issue(issues, 'error', slug, 'reserve.redemptionAsset', 'governance_protocol assets must not fill redemptionAsset artificially');
    }
    if (reserve?.hasProofOfReserves === true) {
      issue(issues, 'error', slug, 'reserve.hasProofOfReserves', 'governance_protocol assets must not claim direct proof-of-reserves');
    }
    return;
  }

  if (c.gradingProfile === 'asset_backed') {
    if (!hasValue(reserve?.backingType) && !hasBlocker(grade, ['backing'])) issue(issues, 'error', slug, 'reserve.backingType', 'asset_backed assets require backingType evidence or a blocker');
    if (!hasValue(reserve?.backingDescription) && !hasBlocker(grade, ['backing'])) issue(issues, 'error', slug, 'reserve.backingDescription', 'asset_backed assets require backingDescription evidence or a blocker');
    if (!hasValue(reserve?.custodian) && !hasBlocker(grade, ['custodian'])) issue(issues, 'error', slug, 'reserve.custodian', 'asset_backed assets require custodian/custody evidence or a blocker');
    if (!hasValue(reserve?.redemptionAsset) && !hasBlocker(grade, ['redemption'])) issue(issues, 'error', slug, 'reserve.redemptionAsset', 'asset_backed assets require redemptionAsset evidence or a blocker');
  }

  if (c.gradingProfile === 'commodity_backed') {
    if (!hasValue(reserve?.backingType) && !hasBlocker(grade, ['backing'])) issue(issues, 'error', slug, 'reserve.backingType', 'commodity_backed assets require commodity backingType evidence or a blocker');
    if (!hasValue(reserve?.custodian) && !hasBlocker(grade, ['custodian'])) issue(issues, 'error', slug, 'reserve.custodian', 'commodity_backed assets require custodian/vault evidence or a blocker');
    if (!hasValue(reserve?.redemptionAsset) && !hasBlocker(grade, ['redemption'])) issue(issues, 'error', slug, 'reserve.redemptionAsset', 'commodity_backed assets require redemptionAsset evidence or a blocker');
  }

  if (c.gradingProfile === 'credit_pool') {
    if (!hasValue(reserve?.backingDescription)) issue(issues, 'error', slug, 'reserve.backingDescription', 'credit_pool assets require pool/collateral/backing description');
    if (!hasValue(liquidity?.redemptionType)) issue(issues, 'warning', slug, 'liquidity.redemptionType', 'credit_pool assets should disclose redemption/withdrawal type');
    if (!hasValue(institutional?.issuerName)) issue(issues, 'warning', slug, 'institutional.issuerName', 'credit_pool assets should disclose protocol/originator/issuer name');
  }
}

function validateGradeBaseline(
  issues: ValidationIssue[],
  slug: string,
  c: Classification,
  grade: Record<string, unknown> | null,
): void {
  if (!grade) {
    issue(issues, 'warning', slug, 'grade-baseline.json', 'Missing grade-baseline.json');
    return;
  }

  const expectedProfile = c.gradingProfile;
  const baselineProfile = grade.gradingProfile;
  if (baselineProfile !== expectedProfile) {
    issue(issues, 'warning', slug, 'grade-baseline.gradingProfile', `Baseline gradingProfile '${baselineProfile}' does not match classification '${expectedProfile}'`);
  }

  if (!hasValue(grade.gradeContext)) {
    issue(issues, 'warning', slug, 'grade-baseline.gradeContext', 'Missing gradeContext for frontend display');
  }

  const applicability = grade.applicability;
  if (!applicability || typeof applicability !== 'object' || Array.isArray(applicability)) {
    issue(issues, 'warning', slug, 'grade-baseline.applicability', 'Missing baseline applicability map');
  }
}

function validateAsset(slug: string, strict: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const institutional = readJson<Record<string, unknown>>(slug, 'institutional.json');
  const reserve = readJson<Record<string, unknown>>(slug, 'reserve.json');
  const liquidity = readJson<Record<string, unknown>>(slug, 'liquidity.json');
  const grade = readJson<Record<string, unknown>>(slug, 'grade-baseline.json');

  if (!institutional) {
    issue(issues, 'error', slug, 'institutional.json', 'Missing institutional.json');
    return issues;
  }

  const classification = getClassification(institutional);
  if (!classification) {
    issue(
      issues,
      strict ? 'error' : 'warning',
      slug,
      'institutional.metadata.classification',
      'Missing classification block. Add metadata.classification before adding or regenerating this asset.',
    );
    return issues;
  }

  validateEnum(issues, slug, 'assetClass', classification.assetClass, ASSET_CLASSES);
  validateEnum(issues, slug, 'instrumentType', classification.instrumentType, INSTRUMENT_TYPES);
  validateEnum(issues, slug, 'claimType', classification.claimType, CLAIM_TYPES);
  validateEnum(issues, slug, 'gradingProfile', classification.gradingProfile, GRADING_PROFILES);
  validateEnum(issues, slug, 'publicSegment', classification.publicSegment, PUBLIC_SEGMENTS);
  validateApplicability(issues, slug, classification);

  if (!hasValue(classification.classificationNote)) {
    issue(issues, 'warning', slug, 'classification.classificationNote', 'Missing classificationNote explaining why the profile applies');
  }

  validateProfileConsistency(issues, slug, classification);
  validateEvidenceApplicability(issues, slug, classification, reserve, liquidity, institutional, grade);
  validateGradeBaseline(issues, slug, classification, grade);

  return issues;
}

function printIssues(slug: string, issues: ValidationIssue[]): void {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✓ ${slug}: classification validation passed`);
    return;
  }

  console.log(`\n${slug}`);
  for (const item of errors) {
    console.error(`  [error] ${item.field}: ${item.message}`);
  }
  for (const item of warnings) {
    console.warn(`  [warn] ${item.field}: ${item.message}`);
  }
}

function usage(): void {
  console.error('Usage: npm run validate:classification -- --slug=<slug>');
  console.error('       npm run validate:classification -- --all');
  console.error('       npm run validate:classification -- --all --strict');
}

function main(): void {
  const { slug, all, strict } = parseArgs(process.argv.slice(2));

  if (!slug && !all) {
    usage();
    process.exit(1);
  }

  const slugs = all ? listAssetSlugs() : [slug!];
  const allIssues = slugs.flatMap((s) => {
    const issues = validateAsset(s, strict);
    printIssues(s, issues);
    return issues;
  });

  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  console.log('\nSummary');
  console.log(`  Assets checked: ${slugs.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Mode: ${strict ? 'strict' : 'migration-safe'}`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
