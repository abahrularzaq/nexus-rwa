import fs from 'node:fs';
import path from 'node:path';
import { db } from '../lib/database.js';
import { calculateAssetGrade } from '../lib/assetGradeEngine.js';

const ROOT = process.cwd();

type BlockchainImportItem = {
  chain: string;
  chainId: number | null;
  contractAddress: string;
  tokenStandard: string | null;
  isTransferable: boolean;
  hasWhitelist: boolean;
  hasTransferRestrictions: boolean;
  explorerUrl: string | null;
  deployedAt: Date | null;
  isVerified: boolean;
};

function readJson<T = any>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  return new Date(value);
}

function withoutMeta<T extends Record<string, any> | null>(value: T): T {
  if (!value || Array.isArray(value) || typeof value !== 'object') return value;
  const { _meta, ...rest } = value;
  return rest as T;
}

function normalizeYield(value: Record<string, any> | null): Record<string, any> | null {
  if (!value) return value;
  return {
    ...value,
    yieldCurrency: value.yieldCurrency ?? 'USD',
  };
}

function normalizeInstitutional(value: Record<string, any> | null): Record<string, any> | null {
  if (!value) return value;
  const normalized = { ...value };

  if ('prospectusUrl' in normalized) {
    normalized.prospectuUrl = normalized.prospectuUrl ?? normalized.prospectusUrl;
    delete normalized.prospectusUrl;
  }

  return normalized;
}

function normalizeBlockchainItem(value: Record<string, any>): BlockchainImportItem {
  const item = withoutMeta(value) ?? {};

  if (!item.chain || !item.contractAddress) {
    throw new Error('Invalid blockchain.json item: chain and contractAddress are required');
  }

  return {
    chain: String(item.chain),
    chainId: item.chainId == null ? null : Number(item.chainId),
    contractAddress: String(item.contractAddress),
    tokenStandard: item.tokenStandard ?? null,
    isTransferable: item.isTransferable ?? true,
    hasWhitelist: item.hasWhitelist ?? false,
    hasTransferRestrictions: item.hasTransferRestrictions ?? false,
    explorerUrl: item.explorerUrl ?? null,
    deployedAt: parseDate(item.deployedAt),
    isVerified: item.isVerified ?? false,
  };
}

async function importAsset(slug: string) {
  const dir = path.join(ROOT, '..', 'data', 'assets', slug);

  if (!fs.existsSync(dir)) {
    throw new Error(`Asset folder not found: ${dir}`);
  }

  const identity = withoutMeta(readJson(path.join(dir, 'identity.json')));
  const market = withoutMeta(readJson(path.join(dir, 'market.json')));
  const risk = withoutMeta(readJson(path.join(dir, 'risk.json')));
  const reserve = withoutMeta(readJson(path.join(dir, 'reserve.json')));
  const yieldData = normalizeYield(withoutMeta(readJson(path.join(dir, 'yield.json'))));
  const institutional = normalizeInstitutional(withoutMeta(readJson(path.join(dir, 'institutional.json'))));
  const blockchain = (readJson<any[]>(path.join(dir, 'blockchain.json')) ?? []).map(normalizeBlockchainItem);
  const compliance = withoutMeta(readJson(path.join(dir, 'compliance.json')));
  const liquidity = withoutMeta(readJson(path.join(dir, 'liquidity.json')));
  const sources = readJson<any[]>(path.join(dir, 'sources.json')) ?? [];

  const asset = await db.asset.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  if (identity) {
    await db.assetIdentity.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        name: identity.name,
        symbol: identity.symbol,
        fullName: identity.fullName,
        description: identity.description,
        category: identity.category,
        subcategory: identity.subcategory,
        logoUrl: identity.logoUrl,
        websiteUrl: identity.websiteUrl,
        docsUrl: identity.docsUrl,
        twitterUrl: identity.twitterUrl,
        tags: identity.tags ?? [],
        launchDate: parseDate(identity.launchDate),
        isin: identity.isin,
      },
      update: {
        name: identity.name,
        symbol: identity.symbol,
        fullName: identity.fullName,
        description: identity.description,
        category: identity.category,
        subcategory: identity.subcategory,
        logoUrl: identity.logoUrl,
        websiteUrl: identity.websiteUrl,
        docsUrl: identity.docsUrl,
        twitterUrl: identity.twitterUrl,
        tags: identity.tags ?? [],
        launchDate: parseDate(identity.launchDate),
        isin: identity.isin,
      },
    });
  }

  if (market) {
    await db.assetMarket.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        ...market,
        lastUpdated: parseDate(market.lastUpdated),
      },
      update: {
        ...market,
        lastUpdated: parseDate(market.lastUpdated),
      },
    });
  }

  if (risk) {
    await db.assetRisk.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        ...risk,
        lastAssessed: parseDate(risk.lastAssessed),
      },
      update: {
        ...risk,
        lastAssessed: parseDate(risk.lastAssessed),
      },
    });
  }

  if (reserve) {
    await db.assetReserve.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        ...reserve,
        lastAuditDate: parseDate(reserve.lastAuditDate),
      },
      update: {
        ...reserve,
        lastAuditDate: parseDate(reserve.lastAuditDate),
      },
    });
  }

  if (yieldData) {
    await db.assetYield.upsert({
      where: { assetId: asset.id },
      create: {
        asset: { connect: { id: asset.id } },
        ...yieldData,
        yieldCurrency: yieldData.yieldCurrency ?? 'USD',
        nextYieldDate: parseDate(yieldData.nextYieldDate),
      },
      update: {
        ...yieldData,
        yieldCurrency: yieldData.yieldCurrency ?? 'USD',
        nextYieldDate: parseDate(yieldData.nextYieldDate),
      },
    });
  }

  if (institutional) {
    await db.assetInstitutional.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        ...institutional,
      },
      update: institutional,
    });
  }

  if (compliance) {
    await db.assetCompliance.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        ...compliance,
        lastComplianceCheck: parseDate(compliance.lastComplianceCheck),
      },
      update: {
        ...compliance,
        lastComplianceCheck: parseDate(compliance.lastComplianceCheck),
      },
    });
  }

  if (liquidity) {
    await db.assetLiquidity.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        ...liquidity,
      },
      update: liquidity,
    });
  }

  for (const item of blockchain) {
    await db.assetBlockchain.upsert({
      where: {
        assetId_chain: {
          assetId: asset.id,
          chain: item.chain,
        },
      },
      create: {
        assetId: asset.id,
        chain: item.chain,
        chainId: item.chainId,
        contractAddress: item.contractAddress,
        tokenStandard: item.tokenStandard,
        isTransferable: item.isTransferable,
        hasWhitelist: item.hasWhitelist,
        hasTransferRestrictions: item.hasTransferRestrictions,
        explorerUrl: item.explorerUrl,
        deployedAt: item.deployedAt,
        isVerified: item.isVerified,
      },
      update: {
        chainId: item.chainId,
        contractAddress: item.contractAddress,
        tokenStandard: item.tokenStandard,
        isTransferable: item.isTransferable,
        hasWhitelist: item.hasWhitelist,
        hasTransferRestrictions: item.hasTransferRestrictions,
        explorerUrl: item.explorerUrl,
        deployedAt: item.deployedAt,
        isVerified: item.isVerified,
      },
    });
  }

  await db.assetSource.deleteMany({
    where: { assetId: asset.id },
  });

  if (sources.length > 0) {
    await db.assetSource.createMany({
      data: sources.map((s) => ({
        assetId: asset.id,
        layer: s.layer,
        field: s.field,
        value: s.value === undefined || s.value === null ? null : String(s.value),
        sourceUrl: s.sourceUrl,
        sourceType: s.sourceType,
        reliability: s.reliability,
        checkedBy: s.checkedBy ?? 'manual',
        notes: s.notes ?? null,
      })),
    });
  }

  const gradeInput = {
    identity,
    market,
    risk,
    reserve,
    yield: yieldData,
    institutional,
    blockchain,
    compliance,
    liquidity,
    sources,
  };

  const grade = calculateAssetGrade(gradeInput);
  const dbReserveScore = grade.reserveScore ?? 0;

  await db.assetGrade.upsert({
    where: { assetId: asset.id },
    create: {
      assetId: asset.id,
      grade: grade.grade,
      score: grade.score,
      completenessScore: grade.completenessScore,
      sourceScore: grade.sourceScore,
      legalScore: grade.legalScore,
      reserveScore: dbReserveScore,
      liquidityScore: grade.liquidityScore,
      riskScore: grade.riskScore,
      blockers: grade.blockers,
      warnings: grade.warnings,
      reviewedBy: grade.grade === 'institutional' ? 'manual' : null,
      reviewedAt: grade.grade === 'institutional' ? new Date() : null,
    },
    update: {
      grade: grade.grade,
      score: grade.score,
      completenessScore: grade.completenessScore,
      sourceScore: grade.sourceScore,
      legalScore: grade.legalScore,
      reserveScore: dbReserveScore,
      liquidityScore: grade.liquidityScore,
      riskScore: grade.riskScore,
      blockers: grade.blockers,
      warnings: grade.warnings,
      reviewedBy: grade.grade === 'institutional' ? 'manual' : null,
      reviewedAt: grade.grade === 'institutional' ? new Date(),
    },
  });

  console.log(JSON.stringify({ slug, grade }, null, 2));
}

async function main() {
  const slug = process.argv[2];

  if (!slug) {
    throw new Error('Usage: npm run import:asset -- superstate-ustb');
  }

  await importAsset(slug);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
