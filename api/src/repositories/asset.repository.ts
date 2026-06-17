import type {
  AssetAiNarrative,
  AssetEvent,
  AssetHistory,
  AssetMarket,
  AssetRisk,
  AssetYield,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  DEFAULT_LAYERS,
  fullInclude,
  summaryInclude,
  type AddEventData,
  type AppendHistoryData,
  type AssetFull,
  type AssetHistoryPoint,
  type AssetSummary,
  type AssetWithLayers,
  type HistoryPeriod,
  type LayerName,
  type UpsertAiNarrativeData,
  type UpsertMarketData,
  type UpsertRiskData,
  type UpsertYieldData,
} from '../types/asset.types.js';

export class RepositoryError extends Error {
  constructor(
    public readonly operation: string,
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export type FindAllOptions = {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  layers?: LayerName[];
};

function buildLayerInclude(layers: LayerName[]): Prisma.AssetInclude {
  const include: Prisma.AssetInclude = {};
  for (const layer of layers) {
    if (layer === 'events') {
      include.events = { orderBy: { occurredAt: 'desc' } };
    } else if (layer === 'history') {
      include.history = { orderBy: { timestamp: 'desc' } };
    } else {
      include[layer] = true;
    }
  }
  return include;
}

function periodToStartDate(period: HistoryPeriod): Date {
  const start = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  start.setTime(start.getTime() - days * 24 * 60 * 60 * 1000);
  return start;
}

function stripNullHistoryFields(row: AssetHistory): AssetHistoryPoint {
  const point: AssetHistoryPoint = {
    id: row.id,
    assetId: row.assetId,
    timestamp: row.timestamp,
  };

  if (row.tvl != null) point.tvl = row.tvl;
  if (row.yield != null) point.yield = row.yield;
  if (row.price != null) point.price = row.price;
  if (row.holderCount != null) point.holderCount = row.holderCount;
  if (row.riskScore != null) point.riskScore = row.riskScore;
  if (row.volume24h != null) point.volume24h = row.volume24h;
  if (row.source != null) point.source = row.source;
  if (row.methodologyVersion != null) point.methodologyVersion = row.methodologyVersion;

  return point;
}

function wrapError(
  operation: string,
  context: Record<string, unknown>,
  error: unknown,
): never {
  const message =
    error instanceof Error ? error.message : 'Unknown repository error';
  throw new RepositoryError(operation, message, context, error);
}

export class AssetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(options: FindAllOptions = {}): Promise<AssetWithLayers[]> {
    const { category, search, limit = 50, offset = 0, layers } = options;
    const include = layers?.length ? buildLayerInclude(layers) : summaryInclude;
    const searchTerm = search?.trim();

    try {
      return await this.prisma.asset.findMany({
        where: {
          isActive: true,
          ...(category !== undefined ? { identity: { category } } : {}),
          ...(searchTerm
            ? {
                OR: [
                  { slug: { contains: searchTerm, mode: 'insensitive' } },
                  { identity: { name: { contains: searchTerm, mode: 'insensitive' } } },
                  { identity: { symbol: { contains: searchTerm, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        include,
        orderBy: { market: { tvl: 'desc' } },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      wrapError('findAll', { category, limit, offset }, error);
    }
  }

  async findBySlug(slug: string, layers?: LayerName[]): Promise<AssetWithLayers | null> {
    const requestedLayers = layers ?? DEFAULT_LAYERS;

    try {
      return await this.prisma.asset.findFirst({
        where: { slug, isActive: true },
        include: buildLayerInclude(requestedLayers),
      });
    } catch (error) {
      wrapError('findBySlug', { slug, layers: requestedLayers }, error);
    }
  }

  async findFull(slug: string): Promise<AssetFull | null> {
    try {
      return await this.prisma.asset.findFirst({
        where: { slug, isActive: true },
        include: fullInclude,
      });
    } catch (error) {
      wrapError('findFull', { slug }, error);
    }
  }

  async upsertMarket(assetId: string, data: UpsertMarketData): Promise<AssetMarket> {
    const now = new Date();

    try {
      return await this.prisma.assetMarket.upsert({
        where: { assetId },
        create: {
          assetId,
          ...data,
          lastUpdated: now,
        },
        update: {
          ...data,
          lastUpdated: now,
        },
      });
    } catch (error) {
      wrapError('upsertMarket', { assetId }, error);
    }
  }

  async upsertRisk(assetId: string, data: UpsertRiskData): Promise<AssetRisk> {
    try {
      return await this.prisma.assetRisk.upsert({
        where: { assetId },
        create: {
          assetId,
          ...data,
        },
        update: data,
      });
    } catch (error) {
      wrapError('upsertRisk', { assetId }, error);
    }
  }

  async upsertYield(assetId: string, data: UpsertYieldData): Promise<AssetYield> {
    try {
      return await this.prisma.assetYield.upsert({
        where: { assetId },
        create: {
          assetId,
          ...data,
        },
        update: data,
      });
    } catch (error) {
      wrapError('upsertYield', { assetId }, error);
    }
  }

  async appendHistory(assetId: string, data: AppendHistoryData): Promise<AssetHistory> {
    try {
      return await this.prisma.assetHistory.create({
        data: {
          assetId,
          tvl: data.tvl,
          yield: data.yield,
          price: data.price,
          holderCount: data.holderCount,
          riskScore: data.riskScore,
          methodologyVersion: data.methodologyVersion,
          source: data.source,
        },
      });
    } catch (error) {
      wrapError('appendHistory', { assetId, source: data.source }, error);
    }
  }

  async getHistory(assetId: string, period: HistoryPeriod): Promise<AssetHistoryPoint[]> {
    const startDate = periodToStartDate(period);

    try {
      const rows = await this.prisma.assetHistory.findMany({
        where: {
          assetId,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'asc' },
      });

      return rows.map(stripNullHistoryFields);
    } catch (error) {
      wrapError('getHistory', { assetId, period }, error);
    }
  }

  async addEvent(assetId: string, data: AddEventData): Promise<AssetEvent> {
    try {
      return await this.prisma.assetEvent.create({
        data: {
          assetId,
          ...data,
        },
      });
    } catch (error) {
      wrapError('addEvent', { assetId, eventType: data.eventType }, error);
    }
  }

  async upsertAiNarrative(
    assetId: string,
    data: UpsertAiNarrativeData,
  ): Promise<AssetAiNarrative> {
    const now = new Date();

    try {
      return await this.prisma.assetAiNarrative.upsert({
        where: { assetId },
        create: {
          assetId,
          generatedAt: now,
          ...data,
        },
        update: {
          generatedAt: now,
          ...data,
        },
      });
    } catch (error) {
      wrapError('upsertAiNarrative', { assetId }, error);
    }
  }

  async updateDataVersion(assetId: string): Promise<void> {
    try {
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { dataVersion: { increment: 1 } },
      });
    } catch (error) {
      wrapError('updateDataVersion', { assetId }, error);
    }
  }

  async countActive(category?: string): Promise<number> {
    try {
      return await this.prisma.asset.count({
        where: {
          isActive: true,
          ...(category !== undefined ? { identity: { category } } : {}),
        },
      });
    } catch (error) {
      wrapError('countActive', { category }, error);
    }
  }

  async findActiveAssets(): Promise<{ id: string; slug: string }[]> {
    try {
      return await this.prisma.asset.findMany({
        where: { isActive: true },
        select: { id: true, slug: true },
        orderBy: { slug: 'asc' },
      });
    } catch (error) {
      wrapError('findActiveAssets', {}, error);
    }
  }
}

export type {
  AssetFull,
  AssetHistoryPoint,
  AssetSummary,
  AssetWithLayers,
  HistoryPeriod,
  LayerName,
} from '../types/asset.types.js';
