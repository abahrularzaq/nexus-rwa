import type {
  Asset,
  AssetSnapshot,
  AssetSummary,
  HolderData,
  PaginatedResponse,
  RiskData,
  RiskLevel,
  YieldData,
  YieldPoint,
} from '../shared/index.js';
import { ERROR_CODES, paginate } from '../shared/index.js';
import type { FindManyAssetsParams, YieldHistoryPeriod } from '../repositories/asset.repository.js';
import * as assetRepo from '../repositories/asset.repository.js';

/** Application-level error with stable code for HTTP mapping. */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Full asset payload for detail endpoints (core asset + latest metrics). */
export type AssetDetail = Asset & {
  snapshot: AssetSnapshot | null;
  risk: RiskData | null;
  holder: HolderData | null;
};

function toFraction(percentYield: number): number {
  return percentYield / 100;
}

function parseHistoryPointTs(date: string): number {
  return new Date(`${date}T00:00:00.000Z`).getTime();
}

/** Delta: latest yield minus yield at/before ~7d ago (same window logic as movers). */
function yieldChange7dFromHistory(points: { date: string; yield: number }[]): number {
  if (points.length === 0) {
    return 0;
  }
  const sorted = [...points].sort(
    (a, b) => parseHistoryPointTs(a.date) - parseHistoryPointTs(b.date),
  );
  const latest = sorted[sorted.length - 1]!;
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let baseline = sorted[0]!;
  for (const p of sorted) {
    if (parseHistoryPointTs(p.date) <= cutoff) {
      baseline = p;
    }
  }
  return latest.yield - baseline.yield;
}

function averageYield(points: { yield: number }[]): number {
  if (points.length === 0) {
    return 0;
  }
  const sum = points.reduce((acc, p) => acc + p.yield, 0);
  return sum / points.length;
}

function mapPrismaAssetToAsset(
  row: assetRepo.AssetWithLatestSnapshotAndRisk | assetRepo.AssetWithLatestRelations,
): Asset {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    protocol: row.protocol,
    category: row.category,
    chain: row.chain,
    contractAddress: row.contractAddress,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSnapshotToShared(
  snap: NonNullable<assetRepo.AssetWithLatestRelations['snapshots']>[number],
  riskFallback: RiskLevel,
): AssetSnapshot {
  return {
    id: snap.id,
    assetId: snap.assetId,
    tvl: snap.tvl,
    yieldRate: snap.yieldRate,
    holderCount: snap.holderCount,
    riskScore: riskFallback,
    price: snap.price,
    timestamp: snap.timestamp,
  };
}

function mapHolderSnapshotToHolderData(
  row: NonNullable<Awaited<ReturnType<typeof assetRepo.findHolderData>>>,
): HolderData {
  return {
    assetId: row.assetId,
    totalHolders: row.totalHolders,
    top10Concentration: row.top10Concentration,
    whaleCount: row.whaleCount,
    retailCount: row.retailCount,
    updatedAt: row.timestamp,
  };
}

function mapRiskScoreToRiskData(
  row: NonNullable<Awaited<ReturnType<typeof assetRepo.findRiskData>>>,
): RiskData {
  return {
    assetId: row.assetId,
    overallScore: row.overallScore as RiskLevel,
    liquidityScore: row.liquidityScore,
    concentrationScore: row.concentrationScore,
    protocolAgeScore: row.protocolAgeScore,
    volatilityScore: row.volatilityScore,
    calculatedAt: row.calculatedAt,
  };
}

/** Map DB list rows + 7d history to `AssetSummary` (shared search/list shape). */
export async function summarizeAssetsForList(
  rows: assetRepo.AssetWithLatestSnapshotAndRisk[],
): Promise<AssetSummary[]> {
  const histories7d = await Promise.all(
    rows.map((row) => assetRepo.findYieldHistory(row.id, '7d')),
  );

  return rows.map((row, i) => {
    const snap = row.snapshots[0];
    const risk = row.riskScores[0];
    const history = histories7d[i] ?? [];
    const change7dRaw = yieldChange7dFromHistory(
      history.map((h) => ({ date: h.date, yield: h.yield })),
    );

    return {
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      protocol: row.protocol,
      category: row.category,
      chain: row.chain,
      tvl: snap?.tvl ?? 0,
      yieldRate: toFraction(snap?.yieldRate ?? 0),
      riskScore: (risk?.overallScore as RiskLevel) ?? 'MEDIUM',
      change7d: toFraction(change7dRaw),
      holderCount: snap?.holderCount ?? 0,
    };
  });
}

/** Paginated list of assets as `AssetSummary` with 7d yield change. */
export async function getAssets(
  params: FindManyAssetsParams,
): Promise<PaginatedResponse<AssetSummary>> {
  const { data, total } = await assetRepo.findMany(params);
  const summaries = await summarizeAssetsForList(data);
  return paginate(summaries, total, { page: params.page, limit: params.limit });
}

/** Single asset with latest snapshot, risk, and holder blocks. */
export async function getAssetDetail(id: string): Promise<AssetDetail> {
  const row = await assetRepo.findById(id);
  if (!row) {
    throw new AppError(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan');
  }

  const snap = row.snapshots[0];
  const riskRow = row.riskScores[0];
  const holderRow = row.holders[0];
  const riskLevel = (riskRow?.overallScore as RiskLevel) ?? 'MEDIUM';

  const asset = mapPrismaAssetToAsset(row);

  return {
    ...asset,
    snapshot: snap ? mapSnapshotToShared(snap, riskLevel) : null,
    risk: riskRow ? mapRiskScoreToRiskData(riskRow) : null,
    holder: holderRow ? mapHolderSnapshotToHolderData(holderRow) : null,
  };
}

/** Yield series for `period` plus rolling averages (7d / 30d / 90d windows). */
export async function getYieldData(
  id: string,
  period: YieldHistoryPeriod,
): Promise<YieldData> {
  const exists = await assetRepo.findById(id);
  if (!exists) {
    throw new AppError(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan');
  }

  const [historyPeriod, h7, h30, h90] = await Promise.all([
    assetRepo.findYieldHistory(id, period),
    assetRepo.findYieldHistory(id, '7d'),
    assetRepo.findYieldHistory(id, '30d'),
    assetRepo.findYieldHistory(id, '90d'),
  ]);

  const history: YieldPoint[] = historyPeriod.map((p) => ({ date: p.date, yield: p.yield }));
  const currentYield =
    historyPeriod.length > 0 ? historyPeriod[historyPeriod.length - 1]!.yield : 0;

  return {
    assetId: id,
    currentYield,
    avgYield7d: averageYield(h7.map((p) => ({ yield: p.yield }))),
    avgYield30d: averageYield(h30.map((p) => ({ yield: p.yield }))),
    avgYield90d: averageYield(h90.map((p) => ({ yield: p.yield }))),
    history,
  };
}

/** Latest holder distribution for an asset. */
export async function getHolderData(id: string): Promise<HolderData> {
  const exists = await assetRepo.findById(id);
  if (!exists) {
    throw new AppError(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan');
  }

  const row = await assetRepo.findHolderData(id);
  if (!row) {
    throw new AppError(ERROR_CODES.DATA_NOT_AVAILABLE, 'Data holder belum tersedia');
  }

  return mapHolderSnapshotToHolderData(row);
}

/** Latest risk scores for an asset. */
export async function getRiskData(id: string): Promise<RiskData> {
  const exists = await assetRepo.findById(id);
  if (!exists) {
    throw new AppError(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan');
  }

  const row = await assetRepo.findRiskData(id);
  if (!row) {
    throw new AppError(ERROR_CODES.DATA_NOT_AVAILABLE, 'Data risiko belum tersedia');
  }

  return mapRiskScoreToRiskData(row);
}
