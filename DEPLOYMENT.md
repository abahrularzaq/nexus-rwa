# Deployment notes (custom domains)

## Custom domain untuk API (`api.nexus-rwa.com`)

Tujuan: endpoint API stabil (tidak berubah-ubah URL provider), dan CORS aman.

### 1) Railway: add custom domain

Di Railway:

- Buka service API → **Settings** → **Domains**
- Klik **Add Domain** → isi `api.nexus-rwa.com`
- Railway akan menampilkan instruksi DNS (biasanya CNAME target seperti `xxxxx.up.railway.app`)

### 2) DNS (untuk Railway)

Umumnya Railway memakai **CNAME**:

- **Type**: CNAME
- **Name/Host**: `api`
- **Target/Value**: `<target dari Railway>` (contoh format: `xxxxx.up.railway.app`)

Catatan:
- Jika DNS provider kamu tidak mengizinkan CNAME di apex, itu tidak masalah karena ini subdomain (`api`), bukan root domain.
- Tunggu propagasi DNS, lalu refresh di Railway sampai status domain verified/active.

### 3) SSL/TLS

Railway akan mengeluarkan sertifikat otomatis setelah DNS verified. Pastikan endpoint aktif via HTTPS.

### 4) Update environment API (CORS) di Railway

Set origin frontend production secara eksplisit. Gunakan `FRONTEND_URL` untuk domain utama dan `ALLOWED_ORIGINS` untuk origin tambahan (keduanya mendukung comma-separated list):

- `FRONTEND_URL="https://nexus-rwa.com"`
- `ALLOWED_ORIGINS="https://www.nexus-rwa.com,https://app.nexus-rwa.com"`

Policy CORS API:
- `production`: hanya origin yang ada di `FRONTEND_URL` atau `ALLOWED_ORIGINS`
- selain `production`: origin di atas, plus `localhost`, `127.0.0.1`, `*.localhost`, dan `*.vercel.app` untuk development/preview

### 5) Update environment Frontend (base URL)

Set `NEXT_PUBLIC_API_URL`:

- `NEXT_PUBLIC_API_URL="https://api.nexus-rwa.com"`

## Quick smoke test

- `GET https://api.nexus-rwa.com/health`
- Dari browser landing page, panggil `GET https://api.nexus-rwa.com/v1/market/overview` dan pastikan response sukses tanpa CORS error.


## Log retention and privacy policy

Production deployments must keep request-level logs only for operational troubleshooting and abuse prevention, then roll them into lower-risk analytics aggregates.

- **Raw request/payment logs** (`ApiRequest`) and request-level usage logs (`UsageLog`) are retained for `LOG_RETENTION_DAYS` days. The default is **60 days**, which fits the intended 30–90 day raw-log window.
- **Aggregated usage analytics** (`UsageDailyAggregate`) are retained for `USAGE_ANALYTICS_RETENTION_MONTHS` months. The default is **18 months**, which fits the intended 12–24 month analytics window.
- The API starts a daily cleanup scheduler at **02:25 UTC**. Before deleting old `UsageLog` rows, the scheduler upserts endpoint/method/status/tier daily aggregates so long-term analytics do not depend on raw request rows.
- Stored IP metadata in `ApiRequest.ipAddress` is anonymized as a SHA-256 digest before persistence. Set `IP_HASH_SALT` to a strong deployment-specific secret so hashed IP values cannot be compared across environments.

Recommended Railway/API environment values:

```bash
LOG_RETENTION_DAYS="60"
USAGE_ANALYTICS_RETENTION_MONTHS="18"
IP_HASH_SALT="replace-with-strong-random-secret"
```

Privacy review checklist:

1. Keep `LOG_RETENTION_DAYS` between 30 and 90 unless there is a documented legal/security exception.
2. Keep `USAGE_ANALYTICS_RETENTION_MONTHS` between 12 and 24 unless business reporting requirements change.
3. Do not export raw `ApiRequest` or `UsageLog` rows to third-party systems without applying the same retention window.
4. Rotate `IP_HASH_SALT` if it is exposed; after rotation, old and new IP hashes will no longer correlate.
