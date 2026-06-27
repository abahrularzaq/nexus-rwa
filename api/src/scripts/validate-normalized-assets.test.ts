import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { validateNormalizedAssetTestHelpers } from './validate-normalized-assets.js';

const { validateAsset, validateRequiredJson } = validateNormalizedAssetTestHelpers;

type TestIssue = {
  severity: 'error' | 'warning';
  assetSlug: string;
  file: string;
  field?: string;
  message: string;
};

function collectErrors(fileName: string, json: unknown): string[] {
  const issues: TestIssue[] = [];
  validateRequiredJson('test-asset', fileName, json, issues);
  return issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message);
}

function validReserve(hasProofOfReserves: unknown): Record<string, unknown> {
  return {
    backingType: 'Treasury bills',
    hasProofOfReserves,
    collateralizationRatio: null,
    lastAuditDate: null,
  };
}

function validBlockchain(hasWhitelist: unknown, overrides: Record<string, unknown> = {}): Array<Record<string, unknown>> {
  return [
    {
      chain: 'ethereum',
      contractAddress: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      isTransferable: true,
      hasWhitelist,
      hasTransferRestrictions: false,
      isVerified: true,
      ...overrides,
    },
  ];
}

function validCompliance(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kycRequired: true,
    accreditedOnly: true,
    sanctionsScreening: true,
    blockedJurisdictions: [],
    allowedJurisdictions: [],
    lastComplianceCheck: null,
    ...overrides,
  };
}

function assetsDir(): string {
  const candidates = [
    path.join(process.cwd(), '..', 'data', 'assets'),
    path.join(process.cwd(), 'data', 'assets'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  assert.ok(found, `Expected normalized assets directory in one of: ${candidates.join(', ')}`);
  return found;
}

describe('normalized asset nullable evidence boolean validation', () => {
  it('allows true, false, and null for approved nullable evidence booleans', () => {
    for (const value of [true, false, null]) {
      assert.deepEqual(collectErrors('reserve.json', validReserve(value)), []);
      assert.deepEqual(collectErrors('blockchain.json', validBlockchain(value)), []);
      assert.deepEqual(collectErrors('compliance.json', validCompliance({ kycRequired: value })), []);
      assert.deepEqual(collectErrors('compliance.json', validCompliance({ sanctionsScreening: value })), []);
    }
  });

  it('rejects strings and numbers for approved nullable evidence booleans', () => {
    for (const value of ['true', 1]) {
      assert.deepEqual(collectErrors('reserve.json', validReserve(value)), ['hasProofOfReserves must be boolean or null']);
      assert.deepEqual(collectErrors('blockchain.json', validBlockchain(value)), ['blockchain[0].hasWhitelist must be boolean or null']);
      assert.deepEqual(collectErrors('compliance.json', validCompliance({ kycRequired: value })), ['kycRequired must be boolean or null']);
      assert.deepEqual(collectErrors('compliance.json', validCompliance({ sanctionsScreening: value })), [
        'sanctionsScreening must be boolean or null',
      ]);
    }
  });

  it('still rejects null for required non-null booleans', () => {
    assert.deepEqual(collectErrors('blockchain.json', validBlockchain(true, { isTransferable: null })), [
      'blockchain[0].isTransferable must be boolean',
    ]);
    assert.deepEqual(collectErrors('blockchain.json', validBlockchain(true, { hasTransferRestrictions: null })), [
      'blockchain[0].hasTransferRestrictions must be boolean',
    ]);
    assert.deepEqual(collectErrors('blockchain.json', validBlockchain(true, { isVerified: null })), [
      'blockchain[0].isVerified must be boolean',
    ]);
    assert.deepEqual(collectErrors('compliance.json', validCompliance({ accreditedOnly: null })), ['accreditedOnly must be boolean']);
  });

  it('validates bC3M normalized files with zero errors', () => {
    const result = validateAsset(assetsDir(), 'backed-bc3m', { strictMonitoring: false });
    const errors = result.issues.filter((issue) => issue.severity === 'error');

    assert.deepEqual(errors, []);
  });
});
