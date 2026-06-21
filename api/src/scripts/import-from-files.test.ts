import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { importAssetFromFiles, setSourceEvidenceSyncForTests } from './import-from-files.js';
import { importAllAssets, setAssetFileImporterForTests } from './import-all-assets-from-files.js';

afterEach(() => {
  setSourceEvidenceSyncForTests(null);
  setAssetFileImporterForTests(null);
});

describe('asset file import source synchronization', () => {
  it('single-asset dry-run triggers source synchronization only for that asset', async () => {
    const calls: Array<{ assetSlugs?: string[]; dryRun?: boolean }> = [];
    setSourceEvidenceSyncForTests(async (options = {}) => {
      calls.push(options);
      return { discovered: 1, inserted: 0, updated: 0, skippedInvalid: 0, duplicateRowsPrevented: 0, warnings: [] };
    });

    const ok = await importAssetFromFiles({ slug: 'blackrock-buidl', dryRun: true, force: false });

    assert.equal(ok, true);
    assert.deepEqual(calls, [{ assetSlugs: ['blackrock-buidl'], dryRun: true }]);
  });

  it('source synchronization failures propagate clearly from single-asset imports', async () => {
    setSourceEvidenceSyncForTests(async () => {
      throw new Error('source sync failed');
    });

    await assert.rejects(
      () => importAssetFromFiles({ slug: 'blackrock-buidl', dryRun: true, force: false }),
      /source sync failed/,
    );
  });

  it('import-all pipeline calls the canonical per-asset importer with source sync responsibility', async () => {
    const calls: string[] = [];
    setAssetFileImporterForTests(async ({ slug, dryRun, force }) => {
      assert.equal(dryRun, true);
      assert.equal(force, false);
      calls.push(slug);
      return true;
    });

    const results = await importAllAssets({ dryRun: true, force: false });

    assert.ok(results.length > 1);
    assert.deepEqual(calls, results.map((result) => result.slug));
    assert.equal(results.every((result) => result.ok), true);
  });
});
