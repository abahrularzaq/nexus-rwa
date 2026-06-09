import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ASSET_ROOT = path.join(ROOT, '..', 'data', 'assets');

const force = process.argv.includes('--force');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const onlySlug = onlyArg?.replace('--only=', '').trim();

type JsonObject = Record<string, any>;

type GradeBaseline = {
  grade?: string;
  score?: number;
  baselineDate?: string;
  blockers?: string[];
  warnings?: string[];
};

function readJson<T = JsonObject>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON: ${filePath}\n${message}`);
  }
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function addDays(date: string | undefined, days: number): string {
  const base = date ? new Date(date) : new Date();
  if (Number.isNaN(base.getTime())) return new Date().toISOString().slice(0, 10);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function gradePriority(grade: string | undefined): 'high' | 'medium' | 'low' {
  if (grade === 'institutional') return 'high';
  if (grade === 'analytics') return 'medium';
  return 'medium';
}

function monitoringStatus(grade: string | undefined): string {
  if (grade === 'institutional') return 'active-institutional';
  if (grade === 'analytics') return 'active-analytics';
  return 'active-research';
}

function manualReviewFrequency(grade: string | undefined): number {
  if (grade === 'institutional') return 14;
  if (grade === 'analytics') return 30;
  return 30;
}

function legalReviewFrequency(grade: string | undefined): number {
  if (grade === 'institutional') return 30;
  if (grade === 'analytics') return 60;
  return 90;
}

function marketRefreshFrequency(grade: string | undefined): number {
  if (grade === 'institutional') return 12;
  return 24;
}

function sourceUrlFromList(sources: unknown, preferred: string): string | null {
  if (!Array.isArray(sources)) return null;
  return sources.find((source) => typeof source === 'string' && source.includes(preferred)) ?? null;
}

function buildAutoMonitoredFields(assetDir: string, identity: JsonObject, market: JsonObject | null, liquidity: JsonObject | null, grade: string | undefined): JsonObject[] {
  const refreshHours = marketRefreshFrequency(grade);
  const marketSources = market?.sources ?? [];
  const coingecko = sourceUrlFromList(marketSources, 'coingecko') ?? null;
  const cmc = sourceUrlFromList(marketSources, 'coinmarketcap') ?? null;
  const defillama = sourceUrlFromList(marketSources, 'defillama') ?? null;
  const etherscan = sourceUrlFromList(marketSources, 'etherscan') ?? null;

  const fields: JsonObject[] = [];

  if (market && coingecko) {
    for (const field of ['price', 'marketCap', 'volume24h']) {
      fields.push({
        layer: 'market',
        field,
        source: 'CoinGecko',
        sourceUrl: coingecko,
        refreshFrequencyHours: refreshHours,
      });
    }
  }

  if (market && defillama) {
    fields.push({
      layer: 'market',
      field: 'tvl',
      source: 'DeFiLlama',
      sourceUrl: defillama,
      refreshFrequencyHours: refreshHours,
      notes: 'Protocol-level TVL only unless asset methodology defines TVL as direct AUM/backing.',
    });
  }

  if (market && etherscan) {
    fields.push({
      layer: 'market',
      field: 'holderCount',
      source: 'Etherscan',
      sourceUrl: etherscan,
      refreshFrequencyDays: 7,
    });
  }

  if (liquidity?.onchainLiquidity != null && defillama) {
    fields.push({
      layer: 'liquidity',
      field: 'onchainLiquidity',
      source: 'DeFiLlama',
      sourceUrl: defillama,
      refreshFrequencyHours: refreshHours,
    });
  }

  if (Array.isArray(liquidity?.dexPairs) && liquidity.dexPairs.length > 0) {
    fields.push({
      layer: 'liquidity',
      field: 'dexPairs',
      source: 'GeckoTerminal / DEXScreener',
      sourceUrl: 'https://www.geckoterminal.com/',
      refreshFrequencyDays: 7,
      status: 'manual-pair-url-needed',
    });
  }

  if (fields.length === 0) {
    fields.push({
      layer: 'identity',
      field: 'websiteUrl',
      source: 'Official website',
      sourceUrl: identity.websiteUrl ?? null,
      refreshFrequencyDays: 30,
    });
  }

  return fields;
}

function buildManualMonitoredFields(reserve: JsonObject | null, compliance: JsonObject | null, risk: JsonObject | null, liquidity: JsonObject | null): JsonObject[] {
  const fields: JsonObject[] = [];

  if (!reserve?.custodian) {
    fields.push({
      layer: 'reserve',
      field: 'custodian',
      status: 'missing',
      importance: 'blocker',
      notes: 'Verify whether the asset has an official custodian. Keep null if structurally not applicable.',
    });
  }

  if (!reserve?.redemptionAsset) {
    fields.push({
      layer: 'reserve',
      field: 'redemptionAsset',
      status: 'missing',
      importance: 'blocker',
      notes: 'Verify whether the asset has a native redemption asset. Keep null if structurally not applicable.',
    });
  }

  if (!reserve?.reserveBreakdown) {
    fields.push({
      layer: 'reserve',
      field: 'reserveBreakdown',
      status: 'missing',
      importance: 'warning',
      notes: 'Find official reserve breakdown or keep null with explanation.',
    });
  }

  if (!compliance?.primaryRegulator) {
    fields.push({
      layer: 'compliance',
      field: 'primaryRegulator',
      status: 'needs-verification',
      importance: 'warning',
      notes: 'Verify through official regulator, SEC/IAPD/EDGAR, issuer docs, or legal documents.',
    });
  }

  if (!compliance?.legalOpinionUrl) {
    fields.push({
      layer: 'compliance',
      field: 'legalOpinionUrl',
      status: 'missing',
      importance: 'warning',
      notes: 'Search for public legal opinion or legal document URL.',
    });
  }

  if (!reserve?.lastAuditUrl) {
    fields.push({
      layer: 'reserve',
      field: 'lastAuditUrl',
      status: 'missing',
      importance: 'warning',
      notes: 'Find official audit/report URL if available.',
    });
  }

  if (risk?.concentrationRisk == null || risk.concentrationRisk < 70) {
    fields.push({
      layer: 'risk',
      field: 'holderConcentration',
      status: 'needs-analysis',
      importance: 'warning',
      notes: 'Analyze top-holder concentration, exchange wallets, treasury/team wallets, and labeled-wallet distribution.',
    });
  }

  if (liquidity?.bidAskSpread == null) {
    fields.push({
      layer: 'liquidity',
      field: 'bidAskSpread',
      status: 'needs-analysis',
      importance: 'warning',
      notes: 'Check exchange order books and DEX price impact before improving liquidity score.',
    });
  }

  return fields;
}

function buildSourceHealthChecks(identity: JsonObject, market: JsonObject | null, sources: JsonObject[] | null): JsonObject[] {
  const checks = new Map<string, JsonObject>();

  function add(name: string, url: unknown, tier = 'Tier 2', frequencyDays = 7, status?: string) {
    if (typeof url !== 'string' || !url.startsWith('http')) return;
    if (checks.has(url)) return;
    checks.set(url, { name, url, tier, frequencyDays, ...(status ? { status } : {}) });
  }

  add('Official website', identity.websiteUrl, 'Tier 1', 7);
  add('Official docs', identity.docsUrl, 'Tier 1', 7);
  add('Official social', identity.twitterUrl, 'Tier 3', 30);

  for (const url of market?.sources ?? []) {
    const name = String(url).includes('coingecko')
      ? 'CoinGecko market source'
      : String(url).includes('coinmarketcap')
        ? 'CoinMarketCap market source'
        : String(url).includes('defillama')
          ? 'DeFiLlama protocol source'
          : String(url).includes('etherscan')
            ? 'Etherscan token source'
            : 'Market/source URL';
    const tier = String(url).includes('etherscan') ? 'Tier 1' : 'Tier 2';
    add(name, url, tier, String(url).includes('coingecko') || String(url).includes('defillama') ? 1 : 7);
  }

  for (const source of sources ?? []) {
    const tier = source.sourceType?.includes('official') || source.sourceType?.includes('block_explorer') ? 'Tier 1' : 'Tier 2';
    add(`${source.layer}.${source.field}`, source.sourceUrl, tier, source.checkedBy === 'manual_required' ? 90 : 30, source.checkedBy === 'manual_required' ? 'manual-verification-required' : undefined);
  }

  return Array.from(checks.values());
}

function buildAlertRules(): JsonObject[] {
  return [
    {
      id: 'market-data-stale',
      severity: 'warning',
      condition: 'market.lastUpdated older than freshnessPolicy.marketDataMaxAgeHours',
      action: 'Refresh market data from configured market sources.',
    },
    {
      id: 'liquidity-drop',
      severity: 'warning',
      condition: 'liquidity.onchainLiquidity drops by more than 30% from baseline snapshot',
      action: 'Review DEX/CEX liquidity sources before changing liquidityScore.',
    },
    {
      id: 'source-conflict',
      severity: 'info',
      condition: 'primary and cross-check market sources differ materially',
      action: 'Keep conflict note and prefer primary source unless methodology changes.',
    },
    {
      id: 'new-legal-evidence-found',
      severity: 'review_required',
      condition: 'legal opinion, regulator filing, or official issuer document is found',
      action: 'Reassess compliance, institutional, reserve, and risk layers.',
    },
    {
      id: 'audit-evidence-found',
      severity: 'review_required',
      condition: 'official external smart-contract audit or security review is found',
      action: 'Update blockchain, sources, and smartContractRisk score.',
    },
  ];
}

function generateMonitoring(slug: string): { slug: string; status: 'created' | 'skipped' } {
  const assetDir = path.join(ASSET_ROOT, slug);
  const outputPath = path.join(assetDir, 'monitoring.json');

  if (fs.existsSync(outputPath) && !force) {
    return { slug, status: 'skipped' };
  }

  const identity = readJson<JsonObject>(path.join(assetDir, 'identity.json'));
  if (!identity) throw new Error(`Missing identity.json for ${slug}`);

  const market = readJson<JsonObject>(path.join(assetDir, 'market.json'));
  const liquidity = readJson<JsonObject>(path.join(assetDir, 'liquidity.json'));
  const reserve = readJson<JsonObject>(path.join(assetDir, 'reserve.json'));
  const compliance = readJson<JsonObject>(path.join(assetDir, 'compliance.json'));
  const risk = readJson<JsonObject>(path.join(assetDir, 'risk.json'));
  const sources = readJson<JsonObject[]>(path.join(assetDir, 'sources.json')) ?? [];
  const baseline = readJson<GradeBaseline>(path.join(assetDir, 'grade-baseline.json')) ?? {};

  const grade = baseline.grade ?? 'research';
  const manualDays = manualReviewFrequency(grade);
  const baselineDate = baseline.baselineDate ?? new Date().toISOString().slice(0, 10);

  const monitoring = {
    assetSlug: slug,
    assetSymbol: identity.symbol ?? null,
    assetName: identity.fullName ?? identity.name ?? slug,
    monitoringStatus: monitoringStatus(grade),
    monitoringPriority: gradePriority(grade),
    gradeBaseline: {
      grade,
      score: baseline.score ?? null,
      baselineDate,
      baselineFile: fs.existsSync(path.join(assetDir, 'grade-baseline.json')) ? 'grade-baseline.json' : null,
    },
    reviewSchedule: {
      lastManualReview: baselineDate,
      nextManualReview: addDays(baselineDate, manualDays),
      manualReviewFrequencyDays: manualDays,
      marketRefreshFrequencyHours: marketRefreshFrequency(grade),
      liquidityRefreshFrequencyHours: marketRefreshFrequency(grade),
      sourceHealthCheckFrequencyDays: 7,
      legalReviewFrequencyDays: legalReviewFrequency(grade),
      riskReviewFrequencyDays: manualDays,
    },
    freshnessPolicy: {
      marketDataMaxAgeHours: marketRefreshFrequency(grade),
      liquidityDataMaxAgeHours: marketRefreshFrequency(grade),
      holderDataMaxAgeDays: 7,
      sourceDataMaxAgeDays: 30,
      legalDataMaxAgeDays: legalReviewFrequency(grade),
      riskDataMaxAgeDays: manualDays,
    },
    autoMonitoredFields: buildAutoMonitoredFields(assetDir, identity, market, liquidity, grade),
    manualMonitoredFields: buildManualMonitoredFields(reserve, compliance, risk, liquidity),
    knownBlockers: baseline.blockers ?? [],
    knownWarnings: baseline.warnings ?? [],
    alertRules: buildAlertRules(),
    sourceHealthChecks: buildSourceHealthChecks(identity, market, sources),
    monitoringNotes: [
      `Generated from ${slug} asset layer files.`,
      'Review manually before treating this as a production monitoring profile.',
      'Do not overwrite asset-specific analyst notes without checking source-discovery.md and grade-baseline.json.',
    ],
    templateVersion: 1,
  };

  writeJson(outputPath, monitoring);
  return { slug, status: 'created' };
}

function main(): void {
  if (!fs.existsSync(ASSET_ROOT)) {
    throw new Error(`Asset root not found: ${ASSET_ROOT}`);
  }

  const slugs = fs
    .readdirSync(ASSET_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => !onlySlug || slug === onlySlug)
    .sort();

  if (onlySlug && !slugs.includes(onlySlug)) {
    throw new Error(`Asset not found: ${onlySlug}`);
  }

  const results = slugs.map(generateMonitoring);
  const created = results.filter((result) => result.status === 'created');
  const skipped = results.filter((result) => result.status === 'skipped');

  console.log(JSON.stringify({
    force,
    onlySlug: onlySlug ?? null,
    created: created.map((result) => result.slug),
    skipped: skipped.map((result) => result.slug),
    summary: {
      created: created.length,
      skipped: skipped.length,
      total: results.length,
    },
  }, null, 2));
}

main();
