import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.REDIS_ENABLED = 'false';
process.env.X402_NETWORK = 'base-sepolia';
process.env.PAYMENT_RECIPIENT = '0x0000000000000000000000000000000000000001';

const { createApp } = await import('../src/index.js');
const { setAssetRepositoryForTests } = await import('../src/services/asset.service.js');

const passThrough = async (_c: any, next: () => Promise<void>) => next();

function makeAsset(slug = 'ondo-usdy') {
  return {
    id: 'asset-1',
    slug,
    dataVersion: 7,
    identity: { name: 'Ondo USDY', symbol: 'USDY', category: 'treasury', subcategory: 'tbills', logoUrl: null, websiteUrl: 'https://ondo.finance', docsUrl: null },
    market: { tvl: 1000, tvl7dChange: 1.5, price: 1.02, marketCap: 2000, holderCount: 42, aumUsd: 1000, lastUpdated: new Date('2026-01-01T00:00:00.000Z'), sources: [], confidence: 0.9 },
    yield: { currentYield: 5.2, yieldType: 'treasury', yieldFrequency: 'monthly', yieldBenchmark: 'SOFR', yieldCurrency: 'USD' },
    risk: { overallLevel: 'low' },
    grade: { grade: 'analytics', score: 80, completenessScore: 80, sourceScore: 80, legalScore: 80, reserveScore: 80, liquidityScore: 80, riskScore: 80, blockers: [], warnings: [], reviewedBy: null, reviewedAt: null, updatedAt: null },
    institutional: { metadata: { classification: { gradingProfile: 'asset_backed' } } },
    blockchain: [{ chain: 'base', chainId: 8453, contractAddress: '0x0000000000000000000000000000000000000001', tokenStandard: 'ERC20', explorerUrl: 'https://basescan.org' }],
    events: [],
  };
}

beforeEach(() => {
  const asset = makeAsset();
  setAssetRepositoryForTests({
    findAll: async () => [asset],
    countActive: async () => 1,
    findBySlug: async (slug: string) => (slug === asset.slug ? asset : null),
    getHistory: async () => [],
  } as any);
});

describe('API integration', () => {
  it('GET /health reports injected database status without production DB', async () => {
    const app = createApp({ rateLimiter: passThrough, getDatabaseStatus: async () => 'ok', usageTracking: false });

    const res = await app.request('/health');
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.database.status, 'ok');
  });

  it('GET /v1/assets returns a paginated public asset catalog', async () => {
    const app = createApp({ rateLimiter: passThrough, getDatabaseStatus: async () => 'ok', usageTracking: false });

    const res = await app.request('/v1/assets?limit=1&page=1');
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.data[0].slug, 'ondo-usdy');
    assert.equal(body.data.pagination.total, 1);
  });

  it('GET /v1/assets/:slug returns public asset detail', async () => {
    const app = createApp({ rateLimiter: passThrough, getDatabaseStatus: async () => 'ok', usageTracking: false });

    const res = await app.request('/v1/assets/ondo-usdy');
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.slug, 'ondo-usdy');
    assert.equal(body.data.identity.name, 'Ondo USDY');
  });

  it('GET /v1/gated/data rejects access when no entitlement or x402 payment is supplied', async () => {
    const app = createApp({ rateLimiter: passThrough, getDatabaseStatus: async () => 'ok', usageTracking: false });

    const res = await app.request('/v1/gated/data');
    const body = await res.json();

    assert.equal(res.status, 402);
    assert.equal(body.error, 'Payment required');
    assert.ok(Array.isArray(body.accepts));
  });
});
