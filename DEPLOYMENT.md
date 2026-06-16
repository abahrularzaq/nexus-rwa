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

## Database roles and deployment secrets

Use separate PostgreSQL users for each runtime instead of sharing one superuser connection string. Store every connection string in Railway variables or the target platform secret manager; do **not** commit `.env` files, database URLs, passwords, or rendered secret manifests to this repo.

### Runtime connection strings

Set these environment variables per service/process:

| Variable | Used by | Required privilege profile |
| --- | --- | --- |
| `DATABASE_URL_API` | Public API web process (`DB_RUNTIME_CONTEXT=api`) | Read/write API role |
| `DATABASE_URL_JOBS` | Scheduled/background jobs (`DB_RUNTIME_CONTEXT=jobs`) | Jobs role |
| `DATABASE_URL_ADMIN` | Prisma migrations, data maintenance scripts (`DB_RUNTIME_CONTEXT=admin`) | Admin/maintenance role |
| `DATABASE_URL_ANALYTICS` | BI exports or read-only reporting processes (`DB_RUNTIME_CONTEXT=analytics`) | Read-only analytics role |
| `DATABASE_URL` | Local fallback only | Prefer one of the role-specific variables above |

Recommended Railway split:

```bash
# API service
DB_RUNTIME_CONTEXT="api"
DATABASE_URL_API="${{Postgres.DATABASE_URL_API}}"

# Worker/cron service
DB_RUNTIME_CONTEXT="jobs"
DATABASE_URL_JOBS="${{Postgres.DATABASE_URL_JOBS}}"

# Migration/admin job; run only during deploy or manual maintenance
DB_RUNTIME_CONTEXT="admin"
DATABASE_URL_ADMIN="${{Postgres.DATABASE_URL_ADMIN}}"
```

For Prisma CLI commands, `api/prisma.config.ts` prefers `DATABASE_URL_ADMIN` and falls back to `DATABASE_URL` for local development. Application runtime code selects the datasource from `DB_RUNTIME_CONTEXT`; if the selected role-specific variable is missing it falls back to `DATABASE_URL` so existing local setups keep working.

### Minimal privileges per role

Assuming the application schema is `public`, create login roles and grants along these lines. Replace role names and passwords in your secret manager/platform console, not in tracked files.

```sql
-- Read/write API role: request handling and usage logging only.
GRANT CONNECT ON DATABASE nexus_rwa TO nexus_api_rw;
GRANT USAGE ON SCHEMA public TO nexus_api_rw;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO nexus_api_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO nexus_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nexus_api_rw;

-- Jobs role: background imports, freshness updates, retention cleanup.
GRANT CONNECT ON DATABASE nexus_rwa TO nexus_jobs_rw;
GRANT USAGE ON SCHEMA public TO nexus_jobs_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_jobs_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_jobs_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_jobs_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nexus_jobs_rw;

-- Admin/maintenance role: migrations and manual repair. Do not use for the web API.
GRANT CONNECT ON DATABASE nexus_rwa TO nexus_admin_maint;
GRANT ALL PRIVILEGES ON SCHEMA public TO nexus_admin_maint;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nexus_admin_maint;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nexus_admin_maint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO nexus_admin_maint;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO nexus_admin_maint;

-- Optional read-only analytics role: dashboards and exports.
GRANT CONNECT ON DATABASE nexus_rwa TO nexus_analytics_ro;
GRANT USAGE ON SCHEMA public TO nexus_analytics_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nexus_analytics_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO nexus_analytics_ro;
```

Operational notes:

1. The API role intentionally omits `DELETE`, DDL, schema ownership, and role-management grants.
2. The jobs role may need `DELETE` for retention cleanup; if a deployment disables retention deletion, remove `DELETE` and run cleanup with the admin role.
3. The admin role is for Prisma migrations (`npm run db:migrate:deploy`) and controlled maintenance scripts only.
4. The analytics role is optional and should not be used by API routes or write-capable jobs.
5. Rotate each role independently after employee/vendor access changes or suspected exposure.
