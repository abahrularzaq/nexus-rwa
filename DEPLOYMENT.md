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

