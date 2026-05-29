import type {
  Asset,
  AssetAiNarrative,
  AssetBlockchain,
  AssetCompliance,
  AssetEvent,
  AssetHistory,
  AssetIdentity,
  AssetInstitutional,
  AssetLiquidity,
  AssetMarket,
  AssetReserve,
  AssetRisk,
  AssetYield,
  Prisma,
} from '@prisma/client';

export const LAYER_NAMES = [
  'identity',
  'market',
  'risk',
  'reserve',
  'yield',
  'institutional',
  'blockchain',
  'compliance',
  'liquidity',
  'aiNarrative',
  'events',
  'history',
] as const;

export type LayerName = (typeof LAYER_NAMES)[number];

export const DEFAULT_LAYERS: LayerName[] = ['identity', 'market', 'risk'];

const summaryInclude = {
  identity: true,
  market: true,
  risk: true,
} satisfies Prisma.AssetInclude;

const fullInclude = {
  identity: true,
  market: true,
  risk: true,
  reserve: true,
  yield: true,
  institutional: true,
  blockchain: true,
  compliance: true,
  liquidity: true,
  aiNarrative: true,
  events: { orderBy: { occurredAt: 'desc' as const } },
  history: { orderBy: { timestamp: 'desc' as const } },
} satisfies Prisma.AssetInclude;

/** Asset + optional layer relations (shape depends on query include). */
export type AssetWithLayers = Asset & {
  identity?: AssetIdentity | null;
  market?: AssetMarket | null;
  risk?: AssetRisk | null;
  reserve?: AssetReserve | null;
  yield?: AssetYield | null;
  institutional?: AssetInstitutional | null;
  blockchain?: AssetBlockchain[];
  compliance?: AssetCompliance | null;
  liquidity?: AssetLiquidity | null;
  aiNarrative?: AssetAiNarrative | null;
  events?: AssetEvent[];
  history?: AssetHistory[];
};

/** Identity + Market + Risk for list views. */
export type AssetSummary = Prisma.AssetGetPayload<{ include: typeof summaryInclude }>;

/** All 12 layers for detail views. */
export type AssetFull = Prisma.AssetGetPayload<{ include: typeof fullInclude }>;

export type HistoryPeriod = '7d' | '30d' | '90d' | '1y';

/** History row with null metric fields omitted. */
export type AssetHistoryPoint = Pick<AssetHistory, 'id' | 'assetId' | 'timestamp'> & {
  tvl?: number;
  yield?: number;
  price?: number;
  holderCount?: number;
  riskScore?: number;
  volume24h?: number;
  source?: string;
};

export type UpsertMarketData = Partial<Omit<AssetMarket, 'id' | 'assetId' | 'asset'>>;
export type UpsertRiskData = Partial<Omit<AssetRisk, 'id' | 'assetId' | 'asset'>>;
export type UpsertYieldData = Partial<Omit<AssetYield, 'id' | 'assetId' | 'asset'>>;
export type UpsertAiNarrativeData = Partial<
  Omit<Prisma.AssetAiNarrativeUncheckedCreateInput, 'id' | 'assetId' | 'generatedAt'>
>;
export type AppendHistoryData = {
  tvl?: number;
  yield?: number;
  price?: number;
  holderCount?: number;
  riskScore?: number;
  source: string;
};
export type AddEventData = Omit<AssetEvent, 'id' | 'assetId' | 'asset'>;

export { summaryInclude, fullInclude };
