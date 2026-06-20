# Nexus RWA Monitoring Production Flow

Dokumen ini adalah panduan operasional untuk menjalankan monitoring data Nexus RWA setelah MVP dashboard `/dashboard/monitoring` dan admin API `/v1/admin/monitoring/*` aktif.

## Tujuan

Monitoring production dipakai untuk memastikan dataset Nexus RWA tetap:

- **Fresh**: layer manual dan otomatis tidak basi.
- **Traceable**: setiap field penting punya sumber yang bisa dicek.
- **Actionable**: masalah berubah menjadi review task, bukan hanya log.
- **Safe**: endpoint admin hanya bisa diakses dengan `X-Admin-Key`.
- **Comparable**: setiap asset punya baseline grading dan monitoring profile yang bisa dibandingkan dari waktu ke waktu.

## Komponen yang Sudah Ada

| Komponen | Fungsi |
|---|---|
| `_meta` di layer JSON | Menyimpan metadata freshness/source per layer |
| `grade-baseline.json` | Menyimpan snapshot hasil grading pertama/terbaru sebagai baseline audit |
| `monitoring.json` | Konfigurasi monitoring per asset: jadwal refresh, alert rules, source health checks, blocker, warning, dan field yang dipantau |
| Prisma monitoring tables | Menyimpan health checks, source health, review tasks, sync logs |
| `npm run validate:normalized-assets --workspace=api -- --slug={asset-slug}` | Mengecek struktur JSON normalized di `data/assets/{asset-slug}` |
| `npm run validate:asset-production --workspace=api -- --slug={asset-slug}` | Strict production gate: mewajibkan `grade-baseline.json`, `monitoring.json`, field monitoring utama valid, dan evidence sumber untuk layer penting |
| `npm run check:freshness --workspace=api` | Mengecek apakah layer data sudah basi |
| `npm run check:sources --workspace=api` | Mengecek URL sumber data |
| `npm run report:monitoring --workspace=api` | Membaca ringkasan monitoring di terminal |
| `npm run monitoring:clear --workspace=api` | Membersihkan data monitoring saat reset/dev |
| `/v1/admin/monitoring/*` | API admin monitoring dengan `X-Admin-Key` |
| `/dashboard/monitoring` | Dashboard web untuk membaca overview monitoring |

> Catatan: `validate:asset-files` masih untuk struktur legacy `api/src/data/asset/{slug}`. Untuk dataset normalized baru, gunakan `validate:normalized-assets`.

## Standar File Monitoring per Asset

Setelah asset berhasil di-import dan menghasilkan grade, setiap asset idealnya punya file:

```text
data/assets/{asset-slug}/monitoring.json
```

File ini **tidak menggantikan** `_meta` di tiap layer. Fungsinya adalah merangkum monitoring profile agar dashboard/agent/backend tidak perlu membaca terlalu banyak detail dari semua layer.

Urutan file setelah asset selesai research:

```text
data/assets/{slug}/
  source-discovery.md
  identity.json
  blockchain.json
  reserve.json
  institutional.json
  compliance.json
  market.json
  yield.json
  liquidity.json
  sources.json
  risk.json
  grade-baseline.json
  monitoring.json
```

### Template Minimal `monitoring.json`

```json
{
  "assetSlug": "goldfinch-gfi",
  "assetSymbol": "GFI",
  "assetName": "Goldfinch Protocol Token",
  "monitoringStatus": "active-research",
  "monitoringPriority": "medium",
  "gradeBaseline": {
    "grade": "research",
    "score": 54,
    "baselineDate": "2026-06-09",
    "baselineFile": "grade-baseline.json"
  },
  "reviewSchedule": {
    "lastManualReview": "2026-06-09",
    "nextManualReview": "2026-07-09",
    "manualReviewFrequencyDays": 30,
    "marketRefreshFrequencyHours": 24,
    "liquidityRefreshFrequencyHours": 24,
    "sourceHealthCheckFrequencyDays": 7,
    "legalReviewFrequencyDays": 90,
    "riskReviewFrequencyDays": 30
  },
  "freshnessPolicy": {
    "marketDataMaxAgeHours": 24,
    "liquidityDataMaxAgeHours": 24,
    "holderDataMaxAgeDays": 7,
    "sourceDataMaxAgeDays": 30,
    "legalDataMaxAgeDays": 90,
    "riskDataMaxAgeDays": 30
  },
  "autoMonitoredFields": [],
  "manualMonitoredFields": [],
  "knownBlockers": [],
  "knownWarnings": [],
  "alertRules": [],
  "sourceHealthChecks": [],
  "monitoringNotes": [],
  "templateVersion": 1
}
```

### Monitoring Status

Gunakan status yang konsisten:

| Status | Arti |
|---|---|
| `active-research` | Asset research-grade dan tetap dipantau, tetapi belum layak analytics/institutional |
| `active-analytics` | Asset cukup lengkap untuk analytics-grade monitoring |
| `active-institutional` | Asset institutional-grade dan butuh monitoring paling ketat |
| `paused` | Asset tidak dipantau aktif karena data tidak cukup / produk tidak aktif |
| `deprecated` | Asset lama, diganti kontrak/produk lain, atau tidak relevan lagi |

### Monitoring Priority

| Priority | Kapan dipakai |
|---|---|
| `high` | Institutional/analytics-grade asset, TVL besar, legal-sensitive, atau user-facing flagship |
| `medium` | Research-grade asset yang tetap penting untuk coverage Nexus RWA |
| `low` | Long-tail asset, data terbatas, belum masuk prioritas publik |

## Flow Setelah Menambah Asset Baru

Setelah semua layer research selesai:

1. Validasi JSON normalized.
2. Import asset ke database.
3. Jalankan grading.
4. Simpan output grading ke `grade-baseline.json`.
5. Buat `monitoring.json`.
6. Jalankan monitoring checks.
7. Pastikan asset muncul di dashboard dan monitoring page.

Flow operasional:

```bash
npm run validate:normalized-assets --workspace=api -- --slug={asset-slug}
npm run validate:asset-production --workspace=api -- --slug={asset-slug}
npm run import:asset --workspace=api -- {asset-slug}
npm run check:freshness --workspace=api
npm run check:sources --workspace=api
npm run report:monitoring --workspace=api
```

Untuk asset yang baru pertama kali ditambahkan, `monitoring.json` bisa dibuat manual dulu dari template. Setelah format stabil, buat generator script agar file ini bisa dibuat otomatis untuk semua asset. Asset **belum boleh dianggap production-ready** sebelum strict validation ini lolos:

```bash
npm run validate:asset-production --workspace=api -- --slug={asset-slug}
```

Strict validation sama dengan `validate:normalized-assets -- --strict-monitoring`: `grade-baseline.json` dan `monitoring.json` wajib ada, `monitoringStatus`, `monitoringPriority`, `reviewSchedule`, dan `freshnessPolicy` harus valid, dan `sources.json` harus punya evidence untuk layer penting (`identity`, `blockchain`, `reserve`, `institutional`, `compliance`, `market`, `liquidity`, `risk`).

## Goldfinch GFI sebagai Template Pertama

Goldfinch GFI menjadi contoh awal untuk monitoring profile:

```text
data/assets/goldfinch-gfi/monitoring.json
```

Karakter monitoring Goldfinch GFI:

- Grade baseline: `research`.
- Monitoring status: `active-research`.
- Priority: `medium`.
- Market/liquidity refresh: harian.
- Legal/risk/manual review: 30-90 hari.
- Auto monitored fields: price, marketCap, volume24h, TVL, holderCount, onchainLiquidity.
- Manual monitored fields: custodian, redemptionAsset, reserveBreakdown, primaryRegulator, legalOpinionUrl, auditUrl, holderConcentration, bidAskSpread.

Catatan penting: GFI adalah protocol/governance token, bukan direct reserve-backed RWA claim. Karena itu missing custodian dan missing redemption asset bisa menjadi blocker yang memang wajar secara struktur, bukan sekadar data belum dicari.

## Environment Wajib

### API

Di service API production, set minimal:

```bash
DATABASE_URL="postgresql://..."
ADMIN_API_KEYS="current-strong-random-secret,next-strong-random-secret"
# Backward-compatible fallback for single-key deployments:
# ADMIN_API_KEY="strong-random-secret"
FRONTEND_URL="https://nexus-rwa.com,https://www.nexus-rwa.com"
```

`ADMIN_API_KEYS` adalah daftar key admin comma-separated untuk rotasi key tanpa downtime. Simpan key aktif dan key baru selama masa rotasi, lalu hapus key lama setelah semua client/admin panel memakai key baru. `ADMIN_API_KEY` masih didukung sebagai fallback single-key/backward-compatible, tetapi production baru sebaiknya memakai `ADMIN_API_KEYS`. Jangan expose secret admin di public repo, screenshot, atau frontend env. Jika admin panel makin besar, pertimbangkan fase berikutnya untuk menambahkan role admin yang lebih granular daripada satu shared admin key.

### Web

Di service web production, set:

```bash
NEXT_PUBLIC_API_URL="https://api.nexus-rwa.com"
```

Catatan: `NEXT_PUBLIC_API_URL` boleh public karena hanya base URL API, bukan secret.

## Local Test Flow

Jalankan dari root repo:

```bash
npm install
npm run build
```

Jalankan API:

```bash
npm run dev --workspace=api
```

Jalankan web:

```bash
npm run dev --workspace=web
```

Isi `ADMIN_API_KEYS` atau fallback `ADMIN_API_KEY` di `api/.env`, lalu buka:

```text
http://localhost:3000/dashboard/monitoring
```

Paste admin key ke input `X-Admin-Key`, lalu klik **Load monitoring**.

## Smoke Test API

```bash
curl http://localhost:3001/health
```

```bash
curl \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  http://localhost:3001/v1/admin/monitoring/overview
```

Untuk production:

```bash
curl https://api.nexus-rwa.com/health
```

```bash
curl \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  https://api.nexus-rwa.com/v1/admin/monitoring/overview
```

## Monitoring Runbook

### 1. Setelah menambah atau mengubah aset

Jalankan:

```bash
npm run validate:normalized-assets --workspace=api -- --slug={asset-slug}
npm run validate:asset-production --workspace=api -- --slug={asset-slug}
npm run check:freshness --workspace=api
npm run check:sources --workspace=api
npm run report:monitoring --workspace=api
```

Tujuan:

- Validasi JSON normalized tidak rusak.
- Cek apakah `_meta.lastManualReview`, `reviewFrequencyDays`, dan data source masih aman.
- Cek apakah `monitoring.json` sudah selaras dengan blocker/warning dari `grade-baseline.json`.
- Melihat issue sebelum deploy.

### 2. Sebelum deploy production

Jalankan:

```bash
npm run build
```

Jika build sukses, deploy API dan web.

### 3. Setelah deploy production

Cek urutan ini:

```bash
curl https://api.nexus-rwa.com/health
curl -H "X-Admin-Key: $ADMIN_API_KEY" https://api.nexus-rwa.com/v1/admin/monitoring/overview
```

Lalu buka:

```text
https://nexus-rwa.com/dashboard/monitoring
```

Pastikan:

- Tidak ada CORS error di browser console.
- Admin key bisa load data.
- Dataset health dan source health muncul.
- Review task muncul jika ada issue.
- Asset yang punya `monitoring.json` bisa ditelusuri jadwal refresh, blocker, warning, dan alert rule-nya.

## Jadwal Monitoring Production yang Disarankan

| Frekuensi | Command / Aktivitas | Tujuan |
|---|---|---|
| Harian | `check:freshness` | Deteksi layer yang masuk masa review |
| Harian | Refresh market/liquidity untuk asset aktif | Update price, volume, TVL, liquidity, holder count |
| Mingguan | `check:sources` | Deteksi URL broken/redirect/error |
| Bulanan | Review `risk.json` dan `monitoring.json` | Pastikan risk score, blocker, warning, dan next actions tetap relevan |
| 90 hari | Review legal/reserve/compliance/institutional | Cek legal docs, regulator, custodian, audit, reserve evidence |
| Setelah import aset | `validate:normalized-assets` + create `grade-baseline.json` + create `monitoring.json` + `validate:asset-production -- --slug={asset-slug}` + `check:freshness` + `check:sources` | Validasi kualitas data baru sebelum production-ready |
| Sebelum release besar | `validate:asset-production -- --slug={asset-slug}` untuk setiap asset yang akan dipromosikan + `report:monitoring` | Strict gate production-ready dan snapshot status data sebelum deploy |

Untuk tahap MVP, checks bisa dijalankan manual. Untuk production, workflow GitHub Actions `.github/workflows/monitoring.yml` sudah menjadi audit trail utama.

## GitHub Actions Production Workflow

Workflow `.github/workflows/monitoring.yml` berjalan dengan jadwal UTC berikut:

| Jadwal | Command | Tujuan |
| --- | --- | --- |
| Setiap hari 02:15 UTC | `npm run check:freshness --workspace=api` | Membuat health check terbaru untuk layer auto-sync/manual-review dan membuka review task jika data stale, missing meta, invalid, atau butuh sync |
| Setiap Minggu 03:15 UTC | `npm run check:sources --workspace=api` | Mengecek URL sumber, menyimpan source health, dan membuka review task untuk source yang broken, restricted, timeout, atau error |
| Setiap Minggu 03:45 UTC | `npm run report:monitoring --workspace=api` dan `npm run report:monitoring --workspace=api -- --json` | Membuat snapshot monitoring manusia (`monitoring-report.txt`) dan mesin (`monitoring-report.json`) |

Workflow juga bisa dijalankan manual lewat **Actions → Nexus RWA Monitoring → Run workflow**. Gunakan input `run_sources=false` jika hanya ingin freshness check, atau `run_report=false` jika tidak perlu membuat report pada run manual tersebut.

### Secrets dan Environment yang Wajib Disediakan

Set secrets repository/environment GitHub Actions sebelum mengaktifkan workflow production:

- `DATABASE_URL` (**wajib**) — koneksi database production/staging tempat tabel monitoring ditulis dan report dibaca.
- `ADMIN_API_KEY` — dipakai oleh flow admin/API terkait monitoring.
- `REDIS_URL` — jika production memakai Redis/rate limit/cache.
- RPC/payment secrets yang juga dibutuhkan backend: `X402_NETWORK`, `BASE_MAINNET_RPC_URL`, `BASE_SEPOLIA_RPC_URL`, `PAYMENT_RECIPIENT`, `PAYMENT_AMOUNT_ETH`, `X402_RECEIVING_ADDRESS`, `RPC_URL_ETHEREUM`, `RPC_URL_BASE`, dan `RPC_URL_BASE_SEPOLIA`.
- Provider/API keys opsional sesuai integrasi aktif: `RWA_XYZ_API_KEY`, `ETHERSCAN_API_KEY`, `BASESCAN_API_KEY`, dan `ANTHROPIC_API_KEY`.

Jika workflow gagal sebelum report dibuat, cek dulu apakah `DATABASE_URL` tersedia dan database bisa menerima koneksi dari GitHub-hosted runner.

### Cara Membaca Artifact Report

Setiap run yang membuat report akan meng-upload artifact bernama `monitoring-report-{run_id}` dengan isi:

- `monitoring-report.txt` — versi terminal yang nyaman dibaca di UI GitHub Actions.
- `monitoring-report.json` — versi terstruktur untuk audit, diff, atau notifikasi lanjutan.

Baca bagian utama berikut:

1. **Nexus RWA Monitoring Overview** — jumlah health checks, source checks, open review tasks, dan sync log non-success. Angka open review tasks yang naik berarti backlog monitoring bertambah.
2. **Health Status Summary** — cari status non-`current`, terutama `stale`, `invalid-json`, `missing-meta`, atau `needs-sync`.
3. **Source Status Summary** — `broken` atau `error` harus diperlakukan sebagai source outage/rot dan ditindaklanjuti. `restricted` bisa berarti sumber memblokir automated checks dan perlu verifikasi manual.
4. **Review Priority Summary** — priority `high` atau `critical` adalah sinyal untuk triage segera.
5. **Asset Monitoring Summary** — asset dengan status `stale` atau `incomplete` tidak boleh dianggap production-clean sampai issue terkait ditutup.
6. **Recent Health Issues**, **Recent Source Issues**, dan **Recent Open Review Tasks** — gunakan baris detail ini untuk menemukan asset, layer, field/source URL, dan alasan perbaikan.

### Gate Fail dan Notifikasi

Workflow akan gagal pada step **Fail on critical monitoring issues** jika report JSON menunjukkan salah satu kondisi berikut:

- Ada health issue severity `critical`.
- Ada source status `broken` atau `error`.
- Ada open review task priority `high` atau `critical`.
- Ada asset `stale` dengan `totalIssues >= 3`, yang diperlakukan sebagai high-priority stale asset.

Kegagalan workflow menjadi notifikasi default GitHub Actions untuk branch/repository watchers. Untuk notifikasi Slack/PagerDuty/email, tambahkan step lanjutan setelah gate dengan `if: failure()` dan kirim ringkasan dari `monitoring-report.json`.

`npm run validate:asset-production --workspace=api -- --slug={asset-slug}` tetap digunakan sebagai release checklist/CI gate untuk setiap asset yang dipromosikan ke production.
