import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateAssetGrade, type GradeInput } from './assetGradeEngine.js';

const completeAsset: GradeInput = {
  identity: { name: 'Tokenized Treasury', symbol: 'TTB', category: 'Treasury', websiteUrl: 'https://example.test', docsUrl: 'https://docs.example.test' },
  market: { tvl: 10_000_000, aumUsd: 10_000_000, holderCount: 1_000 },
  reserve: { backingType: 'Treasury bills', backingDescription: 'Short-duration US Treasury bills', custodian: 'Qualified Custodian', reserveBreakdown: { tbills: 100 }, hasProofOfReserves: true, lastAuditUrl: 'https://example.test/audit.pdf', redemptionAsset: 'USDC' },
  yield: { currentYield: 5.1, yieldType: 'treasury' },
  institutional: { issuerName: 'Issuer LLC', issuerCountry: 'US', legalStructure: 'SPV', targetInvestors: 'Accredited', metadata: { classification: { gradingProfile: 'asset_backed' } } },
  blockchain: [{ chain: 'base', contractAddress: '0x0000000000000000000000000000000000000001', explorerUrl: 'https://basescan.org/token/0x0000000000000000000000000000000000000001' }],
  compliance: { regulatoryStatus: 'registered', kycRequired: true },
  liquidity: { redemptionType: 'daily', redemptionPeriodDays: 1, liquidityScore: 90, onchainLiquidity: 500_000 },
  risk: { overallScore: 92 },
  sources: [
    ['identity', 'websiteUrl'], ['identity', 'docsUrl'], ['market', 'tvl'], ['reserve', 'backingType'], ['reserve', 'backingDescription'], ['reserve', 'custodian'], ['reserve', 'lastAuditUrl'], ['reserve', 'redemptionAsset'], ['yield', 'currentYield'], ['institutional', 'issuerName'], ['institutional', 'legalStructure'], ['blockchain', 'contractAddress'], ['compliance', 'regulatoryStatus'], ['liquidity', 'redemptionType'], ['risk', 'overallScore'],
  ].map(([layer, field]) => ({ layer, field, sourceUrl: `https://source.example.test/${layer}/${field}` })),
};

describe('calculateAssetGrade', () => {
  it('awards analytics grade for a well-documented asset with no blockers', () => {
    const result = calculateAssetGrade(completeAsset);
    assert.equal(result.grade, 'analytics');
    assert.equal(result.blockers.length, 0);
    assert.ok(result.score >= 85);
  });

  it('downgrades incomplete assets and reports blockers', () => {
    const result = calculateAssetGrade({ identity: { name: 'Incomplete' }, risk: {} });
    assert.equal(result.grade, 'research');
    assert.ok(result.blockers.length > 0);
    assert.equal(result.riskScore, 0);
  });
});
