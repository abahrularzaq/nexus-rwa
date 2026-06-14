import { z } from 'zod';
import { getCached } from './redis.js';
import { claudeComplete, claudeStream, parseJsonFromModelText } from './claude.js';
import { geminiComplete } from './gemini.js';
import { logger } from './logger.js';
import type { AssetInsight, AssetWithHistory, RiskLevel } from '../shared/index.js';
import {
  AppError,
  getAssetDetail,
  getAssetList,
  getAssetRepository,
  NotFoundError,
  type AssetDetailPro,
} from '../services/asset.service.js';
import { ERROR_CODES } from '../shared/index.js';

const INSIGHT_CACHE_TTL_SECONDS = 12 * 60 * 60;
const INSIGHT_CACHE_KEY_PREFIX = 'insight:v4';

type AiProvider = 'gemini' | 'anthropic';

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === 'anthropic' || provider === 'claude') return 'anthropic';
  if (provider === 'gemini' || provider === 'google') return 'gemini';

  // Auto-detect the configured provider. This prevents local/prod deployments
  // with only ANTHROPIC_API_KEY from silently trying Gemini and falling back.
  if (hasEnv('ANTHROPIC_API_KEY')) return 'anthropic';
  if (hasEnv('GEMINI_API_KEY') || hasEnv('GOOGLE_API_KEY')) return 'gemini';

  return 'gemini';
}

const RWA_ANALYST_SYSTEM = `You are an RWA (Real World Asset) analyst. Analyze the provided asset data and return
strict JSON with:
- summary (2 sentences; evidence-aware, not promotional)
- opportunities (array of 2-3 strings; these are key strengths, not investment recommendations)
- risks (array of 2-3 strings; include missing evidence where relevant)
- whatChanged (array of 2-3 bullet strings on meaningful recent yield/TVL/risk shifts for this asset)
- watchList (array of 2-3 bullet strings on what users should monitor next, including missing evidence)
- outlook ('bullish'|'neutral'|'bearish')
- confidence ('high'|'medium'|'low')
Rules:
- Use only the supplied Nexus RWA asset data.
- Do not invent reserve, legal, liquidity, audit, or proof-of-reserves information.
- Do not call the asset safe, guaranteed, risk-free, or best.
- Do not provide financial advice.
- Return ONLY valid JSON, no markdown.`;

const insightSchema = z.object({
  summary: z.string().min(1),
  opportunities: z.array(z.string()).min(1).max(5),
  risks: z.array(z.string()).min(1).max(5),
  whatChanged: z.array(z.string()).min(1).max(5),
  watchList: z.array(z.string()).min(1).max(5),
  outlook: z.enum(['bullish', 'neutral', 'bearish']),
  confidence: z.enum(['high', 'medium', 'low']),
});

function isDetailPro(detail: unknown): detail is AssetDetailPro {
  return (
    typeof detail === 'object' &&
    detail !== null &&
    'yield' in detail &&
    'risk' in detail &&
    (detail as AssetDetailPro).risk !== null &&
    typeof (detail as AssetDetailPro).risk === 'object' &&
    'smartContractRisk' in ((detail as AssetDetailPro).risk ?? {})
  );
}

export async function buildAssetWithHistory(slug: string): Promise<AssetWithHistory> {
  const { data: detail } = await getAssetDetail(slug, 'pro');
  const proDetail = isDetailPro(detail) ? detail : null;
  const historyRows = await getAssetRepository().getHistory(detail.id, '30d');

  const riskLevel = (proDetail?.risk?.overallLevel ?? 'MEDIUM') as RiskLevel;

  return {
    id: detail.id,
    name: detail.identity?.name ?? detail.slug,
    symbol: detail.identity?.symbol ?? '',
    protocol: detail.identity?.subcategory ?? detail.slug,
    category: (detail.identity?.category ?? 'TREASURY') as AssetWithHistory['category'],
    chain: 'ethereum',
    tvl: detail.market?.tvl ?? 0,
    yieldRate: (proDetail?.yield?.currentYield ?? 0) / 100,
    holderCount: detail.market?.holderCount ?? 0,
    riskScore: proDetail?.risk?.overallScore ?? null,
    riskLevel,
    riskFactors: proDetail?.risk?.riskFactors ?? [],
    history: historyRows.map((p) => ({
      timestamp: p.timestamp.toISOString(),
      yield: (p.yield ?? 0) / 100,
      tvl: p.tvl ?? 0,
    })),
    meta: {
      sources: detail.market?.sources ?? ['defillama'],
      lastUpdated: detail.market?.lastUpdated?.toISOString() ?? new Date().toISOString(),
      confidence: (detail.market?.confidence as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
      methodology: '12-layer asset schema',
    },
  };
}

function buildFallbackInsight(asset: AssetWithHistory): AssetInsight {
  const yieldPct = asset.yieldRate * 100;
  const riskScoreText = asset.riskScore === null ? 'not yet scored' : `${asset.riskScore}/100`;
  const riskFactors = asset.riskFactors.length > 0 ? asset.riskFactors.slice(0, 3) : ['Reserve transparency', 'liquidity depth', 'regulatory clarity'];

  return {
    assetId: asset.id,
    summary: `${asset.name} is a ${asset.category.toLowerCase()} RWA asset with ${yieldPct.toFixed(2)}% current yield, ${asset.tvl.toLocaleString('en-US')} TVL, and risk score ${riskScoreText}. This fallback insight is generated from Nexus RWA local dataset because AI insight generation is temporarily unavailable.`,
    opportunities: [
      `Use the 12-layer profile to compare ${asset.symbol || asset.name} against similar RWA assets.`,
      `Monitor yield, TVL, holder growth, and source quality before treating the asset as production-grade.`,
      `Review reserve, compliance, and liquidity layers for institutional-readiness signals.`,
    ],
    risks: riskFactors,
    whatChanged: asset.history.length > 0
      ? [
          `30-day history contains ${asset.history.length} available data point(s).`,
          `Latest local TVL snapshot is ${asset.tvl.toLocaleString('en-US')}.`,
          `Current local yield snapshot is ${yieldPct.toFixed(2)}%.`,
        ]
      : [
          'No recent history series is available in the local dataset yet.',
          `Latest local TVL snapshot is ${asset.tvl.toLocaleString('en-US')}.`,
          `Current local yield snapshot is ${yieldPct.toFixed(2)}%.`,
        ],
    watchList: [
      'Refresh official issuer, reserve, and compliance sources.',
      'Check whether liquidity and redemption terms remain current.',
      'Re-run grading after source and market data updates.',
    ],
    outlook: asset.riskLevel === 'LOW' ? 'bullish' : asset.riskLevel === 'HIGH' ? 'bearish' : 'neutral',
    confidence: asset.meta.confidence?.toLowerCase() === 'high' ? 'high' : 'medium',
    generatedAt: new Date().toISOString(),
  };
}

function normalizeInsight(asset: AssetWithHistory, parsed: z.infer<typeof insightSchema>): AssetInsight {
  return {
    assetId: asset.id,
    summary: parsed.summary,
    opportunities: parsed.opportunities,
    risks: parsed.risks,
    whatChanged: parsed.whatChanged.slice(0, 3),
    watchList: parsed.watchList.slice(0, 3),
    outlook: parsed.outlook,
    confidence: parsed.confidence,
    generatedAt: new Date().toISOString(),
  };
}

async function callClaudeForInsight(asset: AssetWithHistory): Promise<AssetInsight> {
  const raw = await claudeComplete({
    system: RWA_ANALYST_SYSTEM,
    user: JSON.stringify(asset, null, 2),
    maxTokens: 800,
  });

  try {
    return normalizeInsight(asset, insightSchema.parse(parseJsonFromModelText(raw)));
  } catch (err) {
    logger.warn({ err, assetId: asset.id }, 'Claude insight JSON parse failed');
    throw new Error('Invalid insight response from Claude');
  }
}

async function callGeminiForInsight(asset: AssetWithHistory): Promise<AssetInsight> {
  const raw = await geminiComplete({
    system: RWA_ANALYST_SYSTEM,
    user: JSON.stringify(asset, null, 2),
    maxTokens: 800,
  });

  try {
    return normalizeInsight(asset, insightSchema.parse(parseJsonFromModelText(raw)));
  } catch (err) {
    logger.warn({ err, assetId: asset.id }, 'Gemini insight JSON parse failed');
    throw new Error('Invalid insight response from Gemini');
  }
}

async function callAiForInsight(asset: AssetWithHistory): Promise<AssetInsight> {
  const provider = getAiProvider();
  if (provider === 'anthropic') {
    return callClaudeForInsight(asset);
  }

  return callGeminiForInsight(asset);
}

export async function generateAssetInsight(
  asset: AssetWithHistory,
): Promise<AssetInsight> {
  const cacheKey = `${INSIGHT_CACHE_KEY_PREFIX}:${getAiProvider()}:${asset.id}`;

  const { data } = await getCached(
    cacheKey,
    async () => {
      try {
        return await callAiForInsight(asset);
      } catch (err) {
        logger.warn(
          { provider: getAiProvider(), assetId: asset.id, error: err instanceof Error ? err.message : String(err) },
          'AI insight failed; using local fallback insight',
        );
        return buildFallbackInsight(asset);
      }
    },
    INSIGHT_CACHE_TTL_SECONDS,
  );

  return data;
}

export async function getAssetInsightById(slug: string): Promise<{
  insight: AssetInsight;
  cached: boolean;
}> {
  const cacheKey = `${INSIGHT_CACHE_KEY_PREFIX}:${getAiProvider()}:${slug}`;

  const { data, cached } = await getCached(
    cacheKey,
    async () => {
      const asset = await buildAssetWithHistory(slug);
      try {
        return await callAiForInsight(asset);
      } catch (err) {
        logger.warn(
          { provider: getAiProvider(), slug, assetId: asset.id, error: err instanceof Error ? err.message : String(err) },
          'AI insight failed; using local fallback insight',
        );
        return buildFallbackInsight(asset);
      }
    },
    INSIGHT_CACHE_TTL_SECONDS,
  );

  return { insight: data, cached };
}

const NEXUS_ASSISTANT_SYSTEM = `You are Nexus RWA assistant. Answer questions about RWA assets using 
the provided data. Be concise, factual, cite specific numbers.`;

export async function buildAskContext(assetIds: string[] | undefined): Promise<string> {
  if (!assetIds || assetIds.length === 0) {
    const market = await getAssetList({ tier: 'free', limit: 25 });
    return JSON.stringify(
      {
        scope: 'market_overview',
        assets: market.data.map((a) => ({
          id: a.id,
          slug: a.slug,
          name: a.identity?.name,
          category: a.identity?.category,
          tvl: a.market?.tvl,
          riskLevel: a.risk?.overallLevel,
        })),
      },
      null,
      2,
    );
  }

  const unique = [...new Set(assetIds)].slice(0, 8);
  const blocks: AssetWithHistory[] = [];

  for (const slug of unique) {
    try {
      blocks.push(await buildAssetWithHistory(slug));
    } catch (e) {
      if (e instanceof NotFoundError || (e instanceof AppError && e.code === ERROR_CODES.ASSET_NOT_FOUND)) {
        continue;
      }
      throw e;
    }
  }

  if (blocks.length === 0) {
    throw new AppError(ERROR_CODES.ASSET_NOT_FOUND, 'No valid assets in context');
  }

  return JSON.stringify({ scope: 'selected_assets', assets: blocks }, null, 2);
}

export async function streamAskNexus(params: {
  question: string;
  context?: string[];
  onDelta: (text: string) => void | Promise<void>;
  onDone: () => void | Promise<void>;
  onError: (err: Error) => void | Promise<void>;
}): Promise<void> {
  const dataContext = await buildAskContext(params.context);
  const userMessage = `Asset data:\n${dataContext}\n\nQuestion: ${params.question}`;

  await new Promise<void>((resolve, reject) => {
    void claudeStream({
      system: NEXUS_ASSISTANT_SYSTEM,
      user: userMessage,
      maxTokens: 2048,
      handlers: {
        onDelta: (text) => {
          void params.onDelta(text);
        },
        onDone: () => {
          void params.onDone();
          resolve();
        },
        onError: (err) => {
          void params.onError(err);
          reject(err);
        },
      },
    });
  });
}
