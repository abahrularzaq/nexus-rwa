import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assetFileImportTestHelpers, mapAssetFilesToImportPayload } from './asset-file-import.js';

const { asNullableBoolField, asNullableNumberField } = assetFileImportTestHelpers;

describe('asset file import null-preserving mappings', () => {
  it('preserves boolean true, false, explicit null, and absent fields distinctly', () => {
    const row: Record<string, unknown> = {
      trueValue: true,
      falseValue: false,
      nullValue: null,
    };

    assert.equal(asNullableBoolField(row, 'trueValue'), true);
    assert.equal(asNullableBoolField(row, 'falseValue'), false);
    assert.equal(asNullableBoolField(row, 'nullValue'), null);
    assert.equal(asNullableBoolField(row, 'absentValue'), undefined);
  });

  it('preserves explicit nullable numeric fields without silently nulling invalid values', () => {
    const row: Record<string, unknown> = {
      validNumber: 42.5,
      nullValue: null,
      invalidValue: 'not-a-number',
    };

    assert.equal(asNullableNumberField(row, 'validNumber'), 42.5);
    assert.equal(asNullableNumberField(row, 'nullValue'), null);
    assert.equal(asNullableNumberField(row, 'absentValue'), undefined);
    assert.equal(asNullableNumberField(row, 'invalidValue'), undefined);
  });

  it('maps bC3M evidence nulls and Ethereum-only blockchain payload honestly', () => {
    const payload = mapAssetFilesToImportPayload('backed-bc3m');

    assert.equal(payload.blockchain.length, 1);
    assert.equal(payload.blockchain[0]?.chain, 'ethereum');
    assert.equal(payload.blockchain[0]?.hasWhitelist, null);
    assert.equal(payload.reserve.hasProofOfReserves, null);
    assert.equal(payload.compliance.kycRequired, null);
    assert.equal(payload.compliance.sanctionsScreening, null);
  });

  it('maps bC3M explicit numeric nulls while leaving unrelated null fields unchanged', () => {
    const payload = mapAssetFilesToImportPayload('backed-bc3m');

    assert.equal(payload.liquidity.liquidityScore, null);
    assert.equal(payload.market.aumUsd, null);
    assert.equal(payload.reserve.collateralizationRatio, undefined);
    assert.equal(payload.liquidity.redemptionPeriodDays, undefined);
  });

  it('keeps implementation-default booleans compatible with existing true and false values', () => {
    const payload = mapAssetFilesToImportPayload('backed-bc3m');
    const [ethereum] = payload.blockchain;

    assert.equal(ethereum?.isTransferable, true);
    assert.equal(ethereum?.hasTransferRestrictions, false);
    assert.equal(ethereum?.isVerified, true);
    assert.equal(payload.compliance.accreditedOnly, true);
  });
});
