import { z } from 'zod';
import type {
  AssetCategory,
  AssetSummary,
  MarketBrief,
  MarketBriefRiskTone,
  MarketOverview,
  RiskLevel,
} from '../shared/index.js';
import { CACHE_TTL, PAGINATION } from '../shared/index.js';
import { getCached } from './redis.js';
import { claudeComplete, parseJsonFromModelText } from './claude.js';
import { logger } from './logger.js';
import { getAssets } from '../services/asset.service.js';
import * as marketRepo from '../repositories/market.repo.js';

const MARKET_OVERVIEW_CACHE_KEY = 'nexus:v1:market:overview';

function reviveMarketOverview(raw: MarketOverview): MarketOverview {
  return {
    ...raw,
    updatedAt: new Date(raw.updatedAt as unknown as string | number | Date),
  };
}

async function fetchMarketOverview(): Promise<MarketOverview> {
  const { data } = await getCached(
    MARKET_OVERVIEW_CACHE_KEY,
    () => marketRepo.getMarketOverview(),
    CACHE_TTL.MARKET_OVERVIEW,
  );
  return reviveMarketOverview(data);
}

const MARKET_BRIEF_CACHE_KEY = 'nexus:v1:market:brief';
const MARKET_BRIEF_CACHE_TTL_SECONDS = 8 * 60 * 60;

const MARKET_BRIEF_SYSTEM = `You are an institutional RWA (Real World Asset) market analyst writing a concise market brief for professional investors.
Analyze the provided aggregate market data (overview metrics, top movers, risk and category distributions).
Return ONLY valid JSON with:
- headline: one line stating what is happening in the market
- summary: 2-3 sentences on why it matters
- whatChanged: array of 2-3 bullet strings on meaningful 7d yield/TVL shifts
- watchList: array of 2-3 strings on what investors should monitor next
- riskTone: one of "elevated", "stable", or "improving"
Be specific, cite numbers from the data, no markdown, no emojis.`;

const marketBriefSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  whatChanged: z.array(z.string()).min(1).max(5),
  watchList: z.array(z.string()).min(1).max(5),
  riskTone: z.enum(['elevated', 'stable', 'improving']),
});

type RiskDistribution = Record<RiskLevel, number>;
type CategoryBucket = { count: number; avgYield: number };

export type MarketBriefContext = {
  overview: MarketOverview;
  assets: AssetSummary[];
  riskDistribution: RiskDistribution;
  categoryDistribution: Partial<Record<AssetCategory, CategoryBucket>>;
};

function emptyRiskDistribution(): RiskDistribution {
  return { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
}

function buildDistributions(assets: AssetSummary[]): {
  riskDistribution: RiskDistribution;
  categoryDistribution: Partial<Record<AssetCategory, CategoryBucket>>;
} {
  const riskDistribution = emptyRiskDistribution();
  const categorySums = new Map<AssetCategory, { count: number; yieldSum: number }>();

  for (const asset of assets) {
    riskDistribution[asset.riskScore] = (riskDistribution[asset.riskScore] ?? 0) + 1;

    if (asset.category) {
      const prev = categorySums.get(asset.category) ?? { count: 0, yieldSum: 0 };
      categorySums.set(asset.category, {
        count: prev.count + 1,
        yieldSum: prev.yieldSum + asset.yieldRate,
      });
    }
  }

  const categoryDistribution: Partial<Record<AssetCategory, CategoryBucket>> = {};
  for (const [category, { count, yieldSum }] of categorySums) {
    categoryDistribution[category] = {
      count,
      avgYield: count > 0 ? yieldSum / count : 0,
    };
  }

  return { riskDistribution, categoryDistribution };
}

export async function buildMarketBriefContext(): Promise<MarketBriefContext> {
  const [overview, assetPage] = await Promise.all([
    fetchMarketOverview(),
    getAssets({ page: 1, limit: PAGINATION.MAX_LIMIT }),
  ]);

  const { riskDistribution, categoryDistribution } = buildDistributions(assetPage.data);

  return {
    overview,
    assets: assetPage.data,
    riskDistribution,
    categoryDistribution,
  };
}

function formatPct(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

function formatTvl(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

function inferRiskTone(
  riskDistribution: RiskDistribution,
  overview: MarketOverview,
): MarketBriefRiskTone {
  const total =
    riskDistribution.LOW +
    riskDistribution.MEDIUM +
    riskDistribution.HIGH +
    riskDistribution.CRITICAL;
  const elevatedShare =
    total > 0 ? (riskDistribution.HIGH + riskDistribution.CRITICAL) / total : 0;

  const avgMoverChange =
    [...overview.topGainers, ...overview.topLosers].reduce(
      (sum, a) => sum + a.change7d,
      0,
    ) / Math.max(1, overview.topGainers.length + overview.topLosers.length);

  if (elevatedShare >= 0.35) return 'elevated';
  if (avgMoverChange > 0.002) return 'improving';
  return 'stable';
}

export function buildStaticMarketBrief(ctx: MarketBriefContext): MarketBrief {
  const { overview, riskDistribution, categoryDistribution } = ctx;
  const riskTone = inferRiskTone(riskDistribution, overview);
  const avgYieldPct = formatPct(overview.avgYieldRate);

  const headline = `${overview.totalAssets} tokenized RWAs track ${formatTvl(overview.totalTvl)} TVL at ${avgYieldPct} average yield`;

  const topGainer = overview.topGainers[0];
  const topLoser = overview.topLosers[0];
  const moverNote =
    topGainer && topLoser
      ? ` ${topGainer.symbol} leads 7d yield gains (${formatPct(topGainer.change7d)}); ${topLoser.symbol} lags (${formatPct(topLoser.change7d)}).`
      : '';

  const summary = `The monitored RWA universe spans ${overview.totalHolders.toLocaleString()} holders with blended yield at ${avgYieldPct}.${moverNote} Risk tone is ${riskTone} based on current score distribution.`;

  const whatChanged: string[] = [];
  for (const g of overview.topGainers.slice(0, 2)) {
    whatChanged.push(
      `${g.name} (${g.symbol}): 7d yield change ${formatPct(g.change7d)}, current yield ${formatPct(g.yieldRate)}`,
    );
  }
  for (const l of overview.topLosers.slice(0, 1)) {
    whatChanged.push(
      `${l.name} (${l.symbol}): 7d yield change ${formatPct(l.change7d)}`,
    );
  }
  if (whatChanged.length === 0) {
    whatChanged.push('No significant 7d yield movers in the current snapshot.');
  }

  const watchList: string[] = [];
  const highRisk = riskDistribution.HIGH + riskDistribution.CRITICAL;
  if (highRisk > 0) {
    watchList.push(
      `${highRisk} asset(s) carry HIGH or CRITICAL risk — review factor drift on Risk dashboard`,
    );
  }
  const categoryEntries = Object.entries(categoryDistribution) as [
    AssetCategory,
    CategoryBucket,
  ][];
  const widestCategory = categoryEntries.sort((a, b) => b[1].count - a[1].count)[0];
  if (widestCategory) {
    watchList.push(
      `${widestCategory[0]} segment (${widestCategory[1].count} names, avg yield ${formatPct(widestCategory[1].avgYield)})`,
    );
  }
  if (overview.topGainers[0]) {
    watchList.push(
      `Yield momentum in ${overview.topGainers[0].symbol} after ${formatPct(overview.topGainers[0].change7d)} 7d move`,
    );
  }
  if (watchList.length === 0) {
    watchList.push('Aggregate TVL and average yield versus prior week');
  }

  return {
    headline,
    summary,
    whatChanged: whatChanged.slice(0, 3),
    watchList: watchList.slice(0, 3),
    riskTone,
    generatedAt: new Date().toISOString(),
  };
}

async function callClaudeForMarketBrief(ctx: MarketBriefContext): Promise<MarketBrief> {
  const payload = {
    overview: {
      totalTvl: ctx.overview.totalTvl,
      totalAssets: ctx.overview.totalAssets,
      avgYieldRate: ctx.overview.avgYieldRate,
      totalHolders: ctx.overview.totalHolders,
      topGainers: ctx.overview.topGainers.map((a) => ({
        symbol: a.symbol,
        yieldRate: a.yieldRate,
        change7d: a.change7d,
        riskScore: a.riskScore,
        category: a.category,
      })),
      topLosers: ctx.overview.topLosers.map((a) => ({
        symbol: a.symbol,
        yieldRate: a.yieldRate,
        change7d: a.change7d,
        riskScore: a.riskScore,
        category: a.category,
      })),
    },
    riskDistribution: ctx.riskDistribution,
    categoryDistribution: ctx.categoryDistribution,
    sampleAssets: ctx.assets.slice(0, 15).map((a) => ({
      symbol: a.symbol,
      category: a.category,
      tvl: a.tvl,
      yieldRate: a.yieldRate,
      riskScore: a.riskScore,
      change7d: a.change7d,
    })),
  };

  const raw = await claudeComplete({
    system: MARKET_BRIEF_SYSTEM,
    user: JSON.stringify(payload, null, 2),
    maxTokens: 900,
  });

  let parsed: z.infer<typeof marketBriefSchema>;
  try {
    parsed = marketBriefSchema.parse(parseJsonFromModelText(raw));
  } catch (err) {
    logger.warn({ err }, 'Claude market brief JSON parse failed');
    throw new Error('Invalid market brief response from AI');
  }

  return {
    headline: parsed.headline,
    summary: parsed.summary,
    whatChanged: parsed.whatChanged.slice(0, 3),
    watchList: parsed.watchList.slice(0, 3),
    riskTone: parsed.riskTone,
    generatedAt: new Date().toISOString(),
  };
}

async function generateMarketBrief(): Promise<MarketBrief> {
  const ctx = await buildMarketBriefContext();
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  if (!hasKey) {
    logger.warn('ANTHROPIC_API_KEY not set — using static market brief');
    return buildStaticMarketBrief(ctx);
  }

  try {
    return await callClaudeForMarketBrief(ctx);
  } catch (err) {
    logger.warn({ err }, 'Market brief AI failed — using static fallback');
    return buildStaticMarketBrief(ctx);
  }
}

export async function getMarketBrief(): Promise<{
  data: MarketBrief;
  cached: boolean;
}> {
  return getCached(MARKET_BRIEF_CACHE_KEY, generateMarketBrief, MARKET_BRIEF_CACHE_TTL_SECONDS);
}
