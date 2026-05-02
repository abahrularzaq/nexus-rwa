const BASE_URL = process.env.API_URL ?? 'http://localhost:3001';

async function runTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  // TEST 1 — Endpoint gratis harus langsung 200
  try {
    const res = await fetch(`${BASE_URL}/v1/market/overview`);
    const body: unknown = await res.json().catch(() => ({}));
    if (res.status !== 200) {
      throw new Error(`expected status 200, got ${res.status}`);
    }
    if (typeof body !== 'object' || body === null || (body as { success?: unknown }).success !== true) {
      throw new Error(`expected body.success === true, got ${JSON.stringify(body)}`);
    }
    console.log('✓ PASSED: TEST 1 — Endpoint gratis');
    console.log('✓ Endpoint gratis OK');
    passed += 1;
  } catch (err) {
    failed += 1;
    const detail = err instanceof Error ? err.message : String(err);
    console.log(`✗ FAILED: TEST 1 — Endpoint gratis: ${detail}`);
  }

  // TEST 2 — Endpoint berbayar tanpa payment harus 402
  try {
    const res = await fetch(`${BASE_URL}/v1/assets/ondo-usdy/yield`);
    const body: unknown = await res.json().catch(() => null);
    if (res.status !== 402) {
      throw new Error(`expected status 402, got ${res.status}`);
    }
    console.log('✓ PASSED: TEST 2 — 402 tanpa payment');
    console.log('Response body (full):', JSON.stringify(body, null, 2));
    console.log('✓ 402 response benar');
    console.log('  Cek payment instructions di atas');
    passed += 1;
  } catch (err) {
    failed += 1;
    const detail = err instanceof Error ? err.message : String(err);
    console.log(`✗ FAILED: TEST 2 — 402 tanpa payment: ${detail}`);
  }

  // TEST 3 — Endpoint list dengan harga berbeda
  try {
    const res = await fetch(`${BASE_URL}/v1/assets`);
    if (res.status !== 402) {
      throw new Error(`expected status 402, got ${res.status}`);
    }
    console.log('✓ PASSED: TEST 3 — List assets berbayar');
    console.log('✓ Pricing per-endpoint berjalan');
    passed += 1;
  } catch (err) {
    failed += 1;
    const detail = err instanceof Error ? err.message : String(err);
    console.log(`✗ FAILED: TEST 3 — List assets berbayar: ${detail}`);
  }

  // TEST 4 — Health check tetap jalan
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) {
      throw new Error(`expected status 200, got ${res.status}`);
    }
    console.log('✓ PASSED: TEST 4 — Health check');
    console.log('✓ Health check OK');
    passed += 1;
  } catch (err) {
    failed += 1;
    const detail = err instanceof Error ? err.message : String(err);
    console.log(`✗ FAILED: TEST 4 — Health check: ${detail}`);
  }

  console.log('');
  console.log('— Ringkasan —');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests().catch(console.error);
