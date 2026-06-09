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
| `npm run check:freshness --workspace=api` | Mengecek apakah layer data sudah basi |
| `npm run check:sources --workspace=api` | Mengecek URL sumber data |
| `npm run report:monitoring --workspace=api` | Membaca ringkasan monitoring di terminal |
| `npm run monitoring:clear --workspace=api` | Membersihkan data monitoring saat reset/dev |
| `/v1/admin/monitoring/*` | API admin monitoring dengan `X-Admin-Key` |
| `/dashboard/monitoring` | Dashboard web untuk membaca overview monitoring |

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

1. Validasi JSON.
2. Import asset ke database.
3. Jalankan grading.
4. Simpan output grading ke `grade-baseline.json`.
5. Buat `monitoring.json`.
6. Jalankan monitoring checks.
7. Pastikan asset muncul di dashboard dan monitoring page.

Flow operasional:

```bash
npm run import:asset --workspace=api -- {asset-slug}
npm run check:freshness --workspace=api
npm run check:sources --workspace=api
npm run report:monitoring --workspace=api
```

Untuk asset yang baru pertama kali ditambahkan, `monitoring.json` bisa dibuat manual dulu dari template. Setelah format stabil, buat generator script agar file ini bisa dibuat otomatis untuk semua asset.

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
ADMIN_API_KEY="strong-random-secret"
FRONTEND_URL="https://nexus-rwa.com,https://www.nexus-rwa.com"
```

`ADMIN_API_KEY` hanya dipakai untuk admin. Jangan expose di public repo, screenshot, atau frontend env.

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

Isi `ADMIN_API_KEY` di `api/.env`, lalu buka:

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
npm run validate:asset-files --workspace=api
npm run check:freshness --workspace=api
npm run check:sources --workspace=api
npm run report:monitoring --workspace=api
```

Tujuan:

- Validasi JSON tidak rusak.
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
| Setelah import aset | `check:freshness` + `check:sources` + create `grade-baseline.json` + create `monitoring.json` | Validasi kualitas data baru |
| Sebelum release besar | `report:monitoring` | Snapshot status data sebelum deploy |

Untuk tahap MVP, jalankan manual dulu. Setelah stabil, pindahkan ke GitHub Actions atau cron server.

## GitHub Actions / Cron Target Berikutnya

Target production berikutnya:

1. Buat workflow terjadwal `monitoring.yml`.
2. Jalankan `check:freshness` harian.
3. Jalankan `check:sources` mingguan.
4. Tambahkan validasi keberadaan `monitoring.json` untuk asset yang sudah punya `grade-baseline.json`.
5. Simpan log workflow sebagai audit trail.
6. Nanti tambahkan notifikasi jika `critical > 0`, `broken sources > 0`, atau asset high-priority melewati `nextManualReview`.

## Generator Target Berikutnya

Agar tidak membuat `monitoring.json` satu-satu secara manual, buat script generator:

```bash
npm run generate:monitoring --workspace=api
```

Target script:

1. Scan semua folder `data/assets/{slug}`.
2. Baca `identity.json`, `market.json`, `liquidity.json`, `risk.json`, `sources.json`, dan `grade-baseline.json`.
3. Generate `monitoring.json` jika belum ada.
4. Update `knownBlockers` dan `knownWarnings` dari `grade-baseline.json`.
5. Set jadwal refresh default berdasarkan grade:
   - institutional: high priority, market/liquidity 12-24 jam, legal 30-60 hari.
   - analytics: medium/high priority, market/liquidity 24 jam, legal 60-90 hari.
   - research: medium/low priority, market/liquidity 24-72 jam, legal 90 hari.
6. Jangan overwrite manual notes tanpa backup.

## Interpretasi Dashboard

| Area | Arti |
|---|---|
| Dataset health | Persentase layer yang masih current |
| Source health | Persentase URL sumber yang healthy/redirected |
| Open tasks | Jumlah masalah yang perlu review manual |
| Sync issues | Jumlah sync log non-success |
| Recent health issues | Layer stale/missing/needs review terbaru |
| Recent source issues | URL sumber bermasalah terbaru |
| Recent open review tasks | Queue pekerjaan manual analyst |
| Monitoring profile | Jadwal refresh, blocker/warning, auto/manual monitored fields, dan alert rules per asset |

## Rule Operasional

- Jangan publish aset sebagai `institutional-grade` jika masih ada critical health issue.
- Broken Tier-1 source harus diprioritaskan dibanding missing Tier-3 source.
- Redirect tidak selalu buruk, tapi perlu dicek jika sumber legal/audit/reserve.
- Manual layer seperti legal, reserve, compliance, institutional harus punya review cycle lebih ketat daripada market/yield yang bisa disinkronisasi.
- `monitoring.json` harus dibuat setelah `grade-baseline.json` agar blocker/warning baseline bisa masuk profile monitoring.
- `monitoring.json` boleh punya field yang tidak masuk Prisma karena file ini adalah konfigurasi monitoring repo-level.
- Jangan menganggap blocker sebagai bug jika secara struktur asset memang bukan reserve-backed. Contoh: GFI tidak punya native custodian/redemption asset.
- `monitoring:clear` hanya untuk local/dev reset, bukan production rutin.

## Next Improvement

- Tambahkan filter dashboard berdasarkan asset/status/layer.
- Tambahkan tombol export CSV untuk review tasks.
- Tambahkan GitHub Actions scheduled monitoring.
- Tambahkan alert ke email/Discord/Telegram saat issue critical muncul.
- Tambahkan audit log ketika review task ditutup.
- Tambahkan generator `monitoring.json` untuk semua asset existing.
- Tambahkan validasi schema ringan untuk `monitoring.json`.
- Tambahkan kolom dashboard untuk `monitoringStatus`, `monitoringPriority`, dan `nextManualReview`.
