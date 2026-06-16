import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAssetsSchema, getAssetSlugSchema, getHistorySchema } from './asset.validator.js';

describe('asset validators', () => {
  it('coerces pagination defaults and preserves optional filters', () => {
    const parsed = getAssetsSchema.parse({ page: '2', limit: '10', chain: 'base', search: 'treasury' });
    assert.equal(parsed.page, 2);
    assert.equal(parsed.limit, 10);
    assert.equal(parsed.chain, 'base');
    assert.equal(parsed.search, 'treasury');
  });

  it('rejects unsupported chains and empty slugs', () => {
    assert.equal(getAssetsSchema.safeParse({ chain: 'solana' }).success, false);
    assert.equal(getAssetSlugSchema.safeParse({ slug: '' }).success, false);
  });

  it('defaults history period to 30d and validates supported periods', () => {
    assert.equal(getHistorySchema.parse({ slug: 'ondo-usdy' }).period, '30d');
    assert.equal(getHistorySchema.safeParse({ slug: 'ondo-usdy', period: '5y' }).success, false);
  });
});
