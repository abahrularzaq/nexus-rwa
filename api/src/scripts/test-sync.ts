import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('dotenv').config();

import { db, connectDatabase } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { fetchAllRwaTvl, fetchYieldPools } from '../services/defillama.service.js';
import { syncTvlData } from '../services/sync.service.js';

type MarketOverviewResponse = {
  success?: boolean;
  data?: { totalTvl?: number };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMarketOverview(): Promise<{
  totalTvl: number | null;
  cacheHeader: string | null;
}> {
  const res = await fetch('http://localhost:3001/v1/market/overview', {
    method: 'GET',
    headers: { accept: 'application/json' },
  });
  const cacheHeader = res.headers.get('X-Cache');
  const body = (await res.json().catch(() => ({}))) as MarketOverviewResponse;

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(body)}`);
  }

  const totalTvl = body?.data?.totalTvl;
  return {
    totalTvl: typeof totalTvl === 'number' && Number.isFinite(totalTvl) ? totalTvl : null,
    cacheHeader,
  };
}

async function main(): Promise<void> {
  let passed = 0;
  let skipped = 0;
  let failed = 0;

  logger.info('Connecting database for sync tests...');
  await connectDatabase();

  try {
    // Capture API state before DB sync (used in Test 4).
    let apiBefore: { totalTvl: number | null; cacheHeader: string | null } | null = null;
    try {
      apiBefore = await fetchMarketOverview();
      console.log(
        `API before sync: totalTvl=${apiBefore.totalTvl ?? 'null'} (X-Cache=${apiBefore.cacheHeader ?? 'n/a'})`,
      );
    } catch (err) {
      // Non-fatal: user may run script without API server up.
      const detail = err instanceof Error ? err.message : String(err);
      console.log(`(info) API pre-check skipped: ${detail}`);
    }

    // TEST 1 — DeFi Llama TVL
    try {
      const tvlByProtocol = await fetchAllRwaTvl();
      const entries = Object.entries(tvlByProtocol);
      if (entries.length === 0) {
        throw new Error('empty TVL response');
      }

      let above1m = 0;
      for (const [protocolKey, tvl] of entries) {
        console.log(`${protocolKey}: $${Math.round(tvl).toLocaleString('en-US')}`);
        if (typeof tvl === 'number' && Number.isFinite(tvl) && tvl > 1_000_000) {
          above1m += 1;
        }
      }

      if (above1m === 0) {
        throw new Error('no protocol has TVL > $1M (sanity check failed)');
      }

      console.log('✓ TVL data fetched successfully');
      passed += 1;
    } catch (err) {
      failed += 1;
      const detail = err instanceof Error ? err.message : String(err);
      console.log(`✗ FAILED: TEST 1 — DeFi Llama TVL: ${detail}`);
    }

    // TEST 2 — Yield Data
    try {
      const pools = await fetchYieldPools();
      const first5 = pools.slice(0, 5);
      console.log('First 5 RWA yield pools:');
      for (const p of first5) {
        console.log(
          `- ${p.project} | ${p.chain} | ${p.symbol} | apy=${p.apy} | tvlUsd=${Math.round(p.tvlUsd).toLocaleString('en-US')} | pool=${p.pool}`,
        );
      }
      console.log('✓ Yield pools fetched');
      passed += 1;
    } catch (err) {
      failed += 1;
      const detail = err instanceof Error ? err.message : String(err);
      console.log(`✗ FAILED: TEST 2 — Yield Data: ${detail}`);
    }

    // TEST 3 — Database Sync
    try {
      const before = await db.assetSnapshot.count();
      await syncTvlData();
      const after = await db.assetSnapshot.count();
      const created = after - before;
      console.log(`✓ Sync completed, ${created} snapshots created`);
      passed += 1;
    } catch (err) {
      failed += 1;
      const detail = err instanceof Error ? err.message : String(err);
      console.log(`✗ FAILED: TEST 3 — Database Sync: ${detail}`);
    }

    // TEST 4 — API Response
    try {
      if (!apiBefore || apiBefore.totalTvl === null) {
        console.log('↷ SKIPPED: TEST 4 — API Response (API not running on http://localhost:3001)');
        // Do not fail the whole script when the API server isn't running.
        // This test is only meaningful when `npm run dev` is running in another terminal.
        skipped += 1;
        // eslint-disable-next-line no-empty
        throw new Error('__SKIP_TEST4__');
      }

      // Market overview is cached in Redis for 60s. Poll until we get X-Cache=MISS (or Redis disabled),
      // so the endpoint recomputes from latest DB snapshots.
      const deadline = Date.now() + 75_000;
      let last: { totalTvl: number | null; cacheHeader: string | null } | null = null;
      while (Date.now() < deadline) {
        last = await fetchMarketOverview();
        const cache = (last.cacheHeader ?? '').toUpperCase();
        if (cache === 'MISS' || cache === '' || cache === null) {
          break;
        }
        await sleep(2_000);
      }

      if (!last || last.totalTvl === null) {
        throw new Error('API response missing totalTvl');
      }

      if (last.totalTvl === apiBefore.totalTvl) {
        throw new Error(
          `totalTvl did not change (before=${apiBefore.totalTvl}, after=${last.totalTvl}, X-Cache=${last.cacheHeader ?? 'n/a'})`,
        );
      }

      console.log('✓ API returning updated data');
      passed += 1;
    } catch (err) {
      if (err instanceof Error && err.message === '__SKIP_TEST4__') {
        // already counted as skipped
      } else {
      failed += 1;
      const detail = err instanceof Error ? err.message : String(err);
      console.log(`✗ FAILED: TEST 4 — API Response: ${detail}`);
      }
    }

    console.log('');
    console.log('— Summary —');
    console.log(`  Passed: ${passed}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${passed + failed}`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await db.$disconnect();
    logger.info('Database disconnected');
  }
}

main().catch((err) => {
  logger.error({ err }, 'TVL sync test failed');
  process.exitCode = 1;
});

