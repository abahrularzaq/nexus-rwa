# Nexus RWA Monitoring Production Flow

Dokumen ini adalah panduan operasional untuk menjalankan monitoring data Nexus RWA setelah MVP dashboard `/dashboard/monitoring` dan admin API `/v1/admin/monitoring/*` aktif.

## Tujuan

Monitoring production dipakai untuk memastikan dataset Nexus RWA tetap:

- **Fresh**: layer manual dan otomatis tidak basi.
- **Traceable**: setiap field penting punya sumber yang bisa dicek.
- **Actionable**: masalah berubah menjadi review task, bukan hanya log.
- **Safe**: endpoint admin hanya bisa diakses dengan `X-Admin-Key`.

## Komponen yang Sudah Ada

| Komponen | Fungsi |
|---|---|
| `_meta` di layer JSON | Menyimpan metadata freshness/source per layer |
| Prisma monitoring tables | Menyimpan health checks, source health, review tasks, sync logs |
| `npm run check:freshness --workspace=api` | Mengecek apakah layer data sudah basi |
| `npm run check:sources --workspace=api` | Mengecek URL sumber data |
| `npm run report:monitoring --workspace=api` | Membaca ringkasan monitoring di terminal |
| `npm run monitoring:clear --workspace=api` | Membersihkan data monitoring saat reset/dev |
| `/v1/admin/monitoring/*` | API admin monitoring dengan `X-Admin-Key` |
| `/dashboard/monitoring` | Dashboard web untuk membaca overview monitoring |

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
- Cek apakah `_meta.lastReviewedAt`, `_meta.nextReviewAt`, dan data source masih aman.
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

## Jadwal Monitoring Production yang Disarankan

| Frekuensi | Command | Tujuan |
|---|---|---|
| Harian | `check:freshness` | Deteksi layer yang masuk masa review |
| Mingguan | `check:sources` | Deteksi URL broken/redirect/error |
| Setelah import aset | `check:freshness` + `check:sources` | Validasi kualitas data baru |
| Sebelum release besar | `report:monitoring` | Snapshot status data sebelum deploy |

Untuk tahap MVP, jalankan manual dulu. Setelah stabil, pindahkan ke GitHub Actions atau cron server.

## GitHub Actions / Cron Target Berikutnya

Target production berikutnya:

1. Buat workflow terjadwal `monitoring.yml`.
2. Jalankan `check:freshness` harian.
3. Jalankan `check:sources` mingguan.
4. Simpan log workflow sebagai audit trail.
5. Nanti tambahkan notifikasi jika `critical > 0` atau `broken sources > 0`.

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

## Rule Operasional

- Jangan publish aset sebagai `institutional-grade` jika masih ada critical health issue.
- Broken Tier-1 source harus diprioritaskan dibanding missing Tier-3 source.
- Redirect tidak selalu buruk, tapi perlu dicek jika sumber legal/audit/reserve.
- Manual layer seperti legal, reserve, compliance, institutional harus punya review cycle lebih ketat daripada market/yield yang bisa disinkronisasi.
- `monitoring:clear` hanya untuk local/dev reset, bukan production rutin.

## Next Improvement

- Tambahkan filter dashboard berdasarkan asset/status/layer.
- Tambahkan tombol export CSV untuk review tasks.
- Tambahkan GitHub Actions scheduled monitoring.
- Tambahkan alert ke email/Discord/Telegram saat issue critical muncul.
- Tambahkan audit log ketika review task ditutup.
