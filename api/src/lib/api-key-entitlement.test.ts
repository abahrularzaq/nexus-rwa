import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compareAccessTier, hasAccessTier, keyTierToAccessTier, maxAccessTier } from './api-key-entitlement.js';

describe('api-key-entitlement tier helpers', () => {
  it('maps database key tiers to API access tiers', () => {
    assert.equal(keyTierToAccessTier('FREE'), 'free');
    assert.equal(keyTierToAccessTier('STANDARD'), 'pro');
    assert.equal(keyTierToAccessTier('PREMIUM'), 'enterprise');
  });

  it('compares access tier rank and picks the maximum tier', () => {
    assert.ok(compareAccessTier('enterprise', 'pro') > 0);
    assert.equal(maxAccessTier('free', 'enterprise', 'pro'), 'enterprise');
    assert.equal(hasAccessTier('pro', 'free'), true);
    assert.equal(hasAccessTier('free', 'pro'), false);
  });
});
