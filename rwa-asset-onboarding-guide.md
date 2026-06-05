# Panduan Penambahan Aset RWA Baru ke Nexus RWA

Dokumen ini adalah panduan operasional untuk menambahkan aset RWA baru ke pipeline **Nexus RWA institutional-grade grading system**.

Workflow ini mengikuti alur yang sudah dipakai pada aset:

- `superstate-ustb`
- `ondo-ousg`
- `ondo-usdy`
- `franklin-benji`

Target akhir workflow:

1. Data asset tersimpan di `data/assets/{slug}/`
2. Semua layer JSON lengkap dan valid
3. `sources.json` menjadi audit trail
4. `risk.json` berisi scoring evidence-based
5. `npm run import:asset` berhasil
6. `AssetGrade` tersimpan di database
7. `grade-baseline.json` tersimpan di repo
8. Asset muncul di frontend publik

---

## 1. Tentukan Slug Aset

Gunakan slug yang konsisten, pendek, dan stabil.

Contoh:

```text
franklin-benji
ondo-ousg
ondo-usdy
superstate-ustb
maple-musdc
```

Aturan slug:

- Lowercase
- Pakai tanda `-`
- Jangan pakai spasi
- Jangan diganti setelah masuk database kecuali benar-benar perlu

---

## 2. Buat Folder Asset Baru

Folder wajib dibuat di root repo:

```text
data/assets/{asset-slug}/
```

Contoh:

```text
data/assets/maple-musdc/
```

Isi 10 file layer utama:

```text
identity.json
market.json
risk.json
reserve.json
yield.json
institutional.json
blockchain.json
compliance.json
liquidity.json
sources.json
```

Tambahan setelah import berhasil:

```text
grade-baseline.json
```

---

## 3. Template File Layer Kosong

### 3.1 `identity.json`

```json
{
  "name": null,
  "symbol": null,
  "fullName": null,
  "description": null,
  "category": null,
  "subcategory": null,
  "logoUrl": null,
  "websiteUrl": null,
  "docsUrl": null,
  "twitterUrl": null,
  "tags": [],
  "launchDate": null,
  "isin": null
}
```

---

### 3.2 `market.json`

```json
{
  "tvl": null,
  "tvl7dChange": null,
  "tvl30dChange": null,
  "price": null,
  "priceChange24h": null,
  "marketCap": null,
  "volume24h": null,
  "circulatingSupply": null,
  "totalSupply": null,
  "holderCount": null,
  "holderChange7d": null,
  "aumUsd": null,
  "lastUpdated": null,
  "sources": [],
  "confidence": null
}
```

Catatan:

- Semua angka harus berupa number, bukan string.
- Jika ada data market/yield, wajib isi `lastUpdated`.
- Jika data tidak bisa diverifikasi, isi `null`.

---

### 3.3 `risk.json`

```json
{
  "overallScore": null,
  "overallLevel": null,
  "smartContractRisk": null,
  "counterpartyRisk": null,
  "liquidityRisk": null,
  "regulatoryRisk": null,
  "marketRisk": null,
  "concentrationRisk": null,
  "riskFactors": [],
  "mitigants": [],
  "lastAssessed": null,
  "assessmentMethod": null
}
```

Catatan:

- `risk.json` dibuat terakhir.
- Risk score harus evidence-based.
- Jangan menaikkan score hanya agar asset terlihat institutional-grade.
- Jika data holder/concentration tidak ada, `concentrationRisk` harus konservatif.
- Jika audit URL tidak ada, `smartContractRisk` harus konservatif.
- Jika legal opinion tidak ada, legal/counterparty risk harus konservatif.

---

### 3.4 `reserve.json`

```json
{
  "backingType": null,
  "backingDescription": null,
  "collateralizationRatio": null,
  "custodian": null,
  "custodianUrl": null,
  "hasProofOfReserves": false,
  "porOracleAddress": null,
  "porOracleChain": null,
  "lastAuditDate": null,
  "lastAuditUrl": null,
  "auditor": null,
  "reserveBreakdown": null,
  "redemptionAsset": null
}
```

Catatan penting untuk import:

- `hasProofOfReserves` sebaiknya `false` jika tidak ada on-chain PoR / PoR oracle yang jelas.
- Jangan klaim proof-of-reserves tanpa bukti eksplisit.
- SEC/fund reporting berbeda dengan on-chain PoR.
- Jika `reserveBreakdown` tidak tersedia dari sumber resmi, isi `null`.

---

### 3.5 `yield.json`

```json
{
  "currentYield": null,
  "yieldType": null,
  "yieldFrequency": null,
  "yieldBenchmark": null,
  "yieldVsBenchmark": null,
  "yieldAvg7d": null,
  "yieldAvg30d": null,
  "yieldAvg90d": null,
  "yieldMin52w": null,
  "yieldMax52w": null,
  "yieldStdDev30d": null,
  "nextYieldDate": null,
  "yieldCurrency": null
}
```

Catatan:

- Yield harus punya sumber dan timestamp.
- Jangan menghitung yield sendiri kecuali metodologi internal sudah jelas.
- Jika yield berubah harian, pastikan `lastUpdated` tersedia di `market.json` atau sumber terkait.

---

### 3.6 `institutional.json`

```json
{
  "issuerName": null,
  "issuerType": null,
  "issuerCountry": null,
  "fundManager": null,
  "legalStructure": null,
  "minimumInvestment": null,
  "managementFee": null,
  "performanceFee": null,
  "fundAdmin": null,
  "transferAgent": null,
  "targetInvestors": null,
  "prospectusUrl": null,
  "metadata": {}
}
```

Catatan penting:

- `minimumInvestment` harus number atau `null`.
- `managementFee` harus number atau `null`.
- `performanceFee` harus number atau `null`.
- Jangan isi numeric field dengan string seperti `"$20"` atau `"0.15%"`.
- Kalau ada minimum berbeda per chain, simpan angka terendah di `minimumInvestment`, lalu detailnya di `metadata`.

Contoh:

```json
{
  "minimumInvestment": 20,
  "metadata": {
    "minimumInvestmentByChain": {
      "Stellar": 20,
      "Ethereum": 5000000
    }
  }
}
```

---

### 3.7 `blockchain.json`

Default kosong:

```json
[]
```

Contoh isi:

```json
[
  {
    "chain": "Ethereum",
    "chainId": 1,
    "contractAddress": "0x...",
    "tokenStandard": "ERC-20",
    "isTransferable": true,
    "hasWhitelist": false,
    "hasTransferRestrictions": true,
    "explorerUrl": "https://etherscan.io/token/0x...",
    "deployedAt": null,
    "isVerified": true
  }
]
```

Catatan penting untuk import:

- `isTransferable` harus `true` atau `false`.
- `hasWhitelist` harus `true` atau `false`.
- `hasTransferRestrictions` harus `true` atau `false`.
- `isVerified` harus `true` atau `false`.
- Jangan isi `null` untuk field Boolean.
- Gunakan official explorer dan pastikan contract address benar.

---

### 3.8 `compliance.json`

```json
{
  "regulatoryStatus": null,
  "primaryRegulator": null,
  "regulatoryFramework": null,
  "kycRequired": false,
  "accreditedOnly": false,
  "blockedJurisdictions": [],
  "allowedJurisdictions": [],
  "sanctionsScreening": false,
  "amlPolicy": null,
  "lastComplianceCheck": null,
  "legalOpinionUrl": null
}
```

Catatan penting untuk import:

- `kycRequired` harus `true` atau `false`.
- `accreditedOnly` harus `true` atau `false`.
- `sanctionsScreening` harus `true` atau `false`.
- `regulatoryFramework` harus string, bukan array.
- Kalau banyak framework, gabungkan menjadi string.

Contoh:

```json
{
  "regulatoryFramework": "Securities Act of 1933; Investment Company Act of 1940; Rule 2a-7"
}
```

Catatan institutional-grade:

- `legalOpinionUrl` harus berupa dokumen legal publik.
- Jangan anggap halaman marketing sebagai legal opinion.
- Jika tidak ada legal opinion publik, isi `null` dan catat sebagai warning.

---

### 3.9 `liquidity.json`

```json
{
  "redemptionType": null,
  "redemptionPeriodDays": null,
  "lockupPeriodDays": null,
  "earlyRedemptionFee": null,
  "minRedemptionAmount": null,
  "dexPairs": [],
  "onchainLiquidity": null,
  "bidAskSpread": null,
  "liquidityScore": null,
  "liquidityNotes": null
}
```

Catatan penting:

- `minRedemptionAmount` harus number atau `null`.
- Jangan isi object.
- Kalau minimum berbeda per chain, simpan angka terendah di `minRedemptionAmount`, lalu detailnya di `liquidityNotes` atau `institutional.metadata`.

Contoh salah:

```json
{
  "minRedemptionAmount": {
    "Stellar": 20,
    "Ethereum": 5000000
  }
}
```

Contoh benar:

```json
{
  "minRedemptionAmount": 20,
  "liquidityNotes": "Minimum redemption differs by chain. Stellar minimum is 20, Ethereum minimum is 5000000."
}
```

---

### 3.10 `sources.json`

Default kosong:

```json
[]
```

Format item:

```json
{
  "layer": "identity",
  "field": "websiteUrl",
  "value": "https://example.com",
  "sourceUrl": "https://example.com",
  "sourceType": "official_website",
  "reliability": 90,
  "checkedBy": "manual",
  "notes": "Official issuer website."
}
```

Catatan:

- `sources.json` adalah audit trail.
- Setiap field non-null penting harus punya source.
- Source harus dicek manual sebelum production.
- Assistant dapat membantu menyusun `sources.json`, tetapi validasi akhir tetap perlu manual.

---

## 4. Urutan Pengisian Data Manual

Urutan terbaik:

1. `source-discovery.md`
2. `identity.json`
3. `blockchain.json`
4. `reserve.json`
5. `institutional.json`
6. `compliance.json`
7. `market.json`
8. `yield.json`
9. `liquidity.json`
10. `sources.json`
11. `risk.json`

Alasan:

- Source discovery menjadi peta awal.
- Identity dan blockchain adalah fondasi.
- Reserve, institutional, dan compliance menentukan kualitas legal/reserve.
- Market, yield, dan liquidity melengkapi analytics.
- Sources dibuat setelah field utama terisi.
- Risk dibuat terakhir karena membaca semua layer.

---

## 5. Workflow Cepat

User mengisi 8 file utama:

```text
identity.json
market.json
reserve.json
yield.json
institutional.json
blockchain.json
compliance.json
liquidity.json
```

Assistant membantu:

```text
sources.json
risk.json
perbaikan kompatibilitas import
grade-baseline.json setelah import berhasil
```

Catatan:

- `sources.json` tetap harus diverifikasi.
- `risk.json` harus dibuat berdasarkan evidence, bukan asumsi.
- `grade-baseline.json` harus berasal dari output import/grading.

---

## 6. Source Discovery

Sebelum mengisi layer, buat `source-discovery.md`.

Tujuannya:

- Mengumpulkan semua sumber resmi dan terpercaya
- Menghindari data tanpa referensi
- Menentukan data gap sejak awal
- Menjadi peta kerja untuk semua layer

Prioritas sumber:

1. SEC / EDGAR / legal filing
2. Official issuer website
3. Official docs
4. Official app/dashboard
5. Audit report
6. Block explorer
7. RWA.xyz / DeFiLlama / CoinGecko
8. Internal analysis

Format minimal `source-discovery.md`:

```markdown
# Source Discovery — {Asset Name}

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity | Official website | https://... | Tier 1 | Official issuer website |

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| market | RWA.xyz | https://... | Tier 2 | Market/AUM reference |

## Data Gaps

- No public legal opinion URL found.
- No on-chain proof-of-reserves oracle found.

## Notes for Analyst

- Use SEC filing as highest-priority legal source.
- Do not treat fund reporting as on-chain proof-of-reserves.
```

---

## 7. Reliability Guide untuk `sources.json`

Gunakan guide berikut untuk memberi reliability score:

| Source Type | Reliability Range |
|---|---:|
| SEC / EDGAR / legal filing | 90-98 |
| Official website | 85-95 |
| Official docs | 85-95 |
| Official app/dashboard | 80-92 |
| Block explorer | 80-95 |
| Audit report | 85-95 |
| Proof-of-reserves | 85-95 |
| Market aggregator | 60-80 |
| Internal analysis | 50-75 |

Catatan:

- Jangan beri score tinggi untuk sumber sekunder jika sumber primer tersedia.
- Jika sumber hanya media/news, gunakan sebagai konteks, bukan bukti utama.
- Jika URL redirect, 404, atau tidak bisa dibuka, jangan dipakai sebagai source final.

---

## 8. Pembuatan `risk.json`

`risk.json` dibuat terakhir karena membutuhkan semua layer.

Field scoring:

```text
overallScore
smartContractRisk
counterpartyRisk
liquidityRisk
regulatoryRisk
marketRisk
concentrationRisk
```

Interpretasi score:

| Score | Meaning |
|---:|---|
| 0-39 | Weak / high risk |
| 40-69 | Medium / incomplete evidence |
| 70-89 | Strong but not perfect |
| 90-100 | Institutional-grade evidence |

Aturan penting:

- Jika audit URL tidak ada, `smartContractRisk` harus konservatif.
- Jika legal opinion URL `null`, legal/counterparty risk harus konservatif.
- Jika PoR oracle tidak ada, jangan klaim on-chain PoR.
- Jika holder/concentration data tidak ada, `concentrationRisk` biasanya sekitar 50.
- Jika `reserveBreakdown` tidak ada, reserve/transparency risk turun.
- Jika redemption mechanism tidak jelas, `liquidityRisk` turun.
- Jika issuer/fund manager tidak jelas, `counterpartyRisk` turun.

Contoh `riskFactors`:

```json
{
  "riskFactors": [
    "No public on-chain proof-of-reserves oracle found; reserve verification relies on fund reporting rather than on-chain PoR.",
    "No public legal opinion URL found; legal documentation is based on public filings and issuer disclosures.",
    "Holder concentration data is unavailable; concentration risk score remains conservative."
  ],
  "mitigants": [
    "Issuer provides official fund documentation.",
    "Token contracts are visible on official block explorers.",
    "Market data is available from recognized RWA aggregators."
  ]
}
```

---

## 9. Push Data ke GitHub

Setelah mengisi file lokal:

```bash
cd "D:\NEXUS RWA\nexus-rwa"

git status
git add data/assets/{asset-slug}
git commit -m "chore: add {asset-slug} asset data"
git push origin main
```

Contoh:

```bash
git add data/assets/maple-musdc
git commit -m "chore: add maple musdc asset data"
git push origin main
```

Setelah push, assistant bisa membaca file dari GitHub dan membantu:

- Menyusun `sources.json`
- Menyusun `risk.json`
- Mengecek kompatibilitas import
- Menyiapkan baseline setelah import berhasil

---

## 10. Pull Update Terbaru Sebelum Import

Sebelum import, pastikan lokal sinkron dengan GitHub:

```bash
cd "D:\NEXUS RWA\nexus-rwa"
git pull --rebase origin main
```

---

## 11. Validasi JSON Sebelum Build

Sebelum menjalankan build/import, pastikan semua file JSON valid.

Minimal manual check:

```bash
node -e "JSON.parse(require('fs').readFileSync('data/assets/{asset-slug}/identity.json','utf8')); console.log('identity ok')"
```

Idealnya buat script khusus:

```bash
npm run validate:asset -- {asset-slug}
```

Target validasi:

1. Semua file wajib ada
2. JSON valid
3. Numeric field bukan string
4. Boolean non-null sudah `true`/`false`
5. `regulatoryFramework` string, bukan array
6. `minRedemptionAmount` number/null, bukan object
7. `minimumInvestment` number/null, bukan string
8. `sources.json` mencakup field penting
9. Market/yield punya timestamp jika ada data angka
10. `risk.json` tidak dibuat sebelum layer utama lengkap

---

## 12. Jalankan Build API

```bash
cd "D:\NEXUS RWA\nexus-rwa\api"
npm run build
```

Kalau build sukses, lanjut import.

---

## 13. Import Asset ke Database

```bash
npm run import:asset -- {asset-slug}
```

Contoh:

```bash
npm run import:asset -- franklin-benji
npm run import:asset -- ondo-usdy
npm run import:asset -- maple-musdc
```

Output yang diharapkan:

```json
{
  "slug": "franklin-benji",
  "grade": {
    "grade": "institutional",
    "score": 91,
    "completenessScore": 100,
    "sourceScore": 97,
    "legalScore": 85,
    "reserveScore": 90,
    "liquidityScore": 80,
    "riskScore": 88,
    "blockers": [],
    "warnings": [
      "Missing legal opinion or legal document URL",
      "No proof-of-reserves confirmed"
    ]
  }
}
```

---

## 14. Troubleshooting Import Error

### Error: Expected Float or Null, provided String

Penyebab:

Field numeric diisi string.

Contoh salah:

```json
{
  "minimumInvestment": "$20"
}
```

Solusi:

```json
{
  "minimumInvestment": 20
}
```

Kalau butuh detail:

```json
{
  "metadata": {
    "minimumInvestmentNotes": ["$20 on Stellar", "$100 on Base"]
  }
}
```

---

### Error: Boolean field berisi null

Penyebab:

Prisma Boolean non-null tidak menerima `null`.

Contoh salah:

```json
{
  "hasProofOfReserves": null,
  "isVerified": null,
  "sanctionsScreening": null
}
```

Solusi:

```json
{
  "hasProofOfReserves": false,
  "isVerified": false,
  "sanctionsScreening": true
}
```

---

### Error: `regulatoryFramework` array

Penyebab:

Prisma butuh string, tapi file berisi array.

Contoh salah:

```json
{
  "regulatoryFramework": [
    "Securities Act of 1933",
    "Investment Company Act of 1940"
  ]
}
```

Solusi:

```json
{
  "regulatoryFramework": "Securities Act of 1933; Investment Company Act of 1940"
}
```

---

### Error: `minRedemptionAmount` object

Penyebab:

Prisma butuh Float/null, tapi file berisi object.

Contoh salah:

```json
{
  "minRedemptionAmount": {
    "Stellar": 20,
    "Ethereum": 5000000
  }
}
```

Solusi:

```json
{
  "minRedemptionAmount": 20,
  "liquidityNotes": "Minimum redemption differs by chain. Stellar minimum is 20, Ethereum minimum is 5000000."
}
```

---

## 15. Simpan `grade-baseline.json`

Setelah import berhasil, buat:

```text
data/assets/{asset-slug}/grade-baseline.json
```

Format:

```json
{
  "slug": "asset-slug",
  "grade": "analytics",
  "score": 83,
  "completenessScore": 96,
  "sourceScore": 95,
  "legalScore": 70,
  "reserveScore": 75,
  "liquidityScore": 85,
  "riskScore": 77,
  "blockers": [],
  "warnings": [],
  "baselineDate": "2026-06-01",
  "status": "analytics-grade baseline",
  "nextActions": []
}
```

Status options:

```text
research-grade baseline
analytics-grade baseline
institutional-grade baseline
```

Catatan:

- Jangan membuat baseline manual sebelum import sukses.
- `grade-baseline.json` harus berasal dari output grading/import.
- Baseline dipakai agar repo dan database punya jejak grading yang konsisten.

---

## 16. Commit Baseline

```bash
cd "D:\NEXUS RWA\nexus-rwa"

git add data/assets/{asset-slug}/grade-baseline.json
git commit -m "chore: save {asset-slug} grade baseline"
git push origin main
```

---

## 17. Sinkronkan Database Neon

Pastikan `.env` API mengarah ke Neon production:

```env
DATABASE_URL="postgresql://...neon.tech/...sslmode=require"
```

Lalu jalankan:

```bash
cd "D:\NEXUS RWA\nexus-rwa\api"
npx prisma generate

npm run import:asset -- {asset-slug}
```

Catatan penting:

```bash
npx prisma db push
```

Hanya jalankan jika schema Prisma berubah.

Untuk penambahan asset baru biasa, biasanya cukup:

```bash
npx prisma generate
npm run import:asset -- {asset-slug}
```

Jika ada beberapa aset:

```bash
npm run import:asset -- superstate-ustb
npm run import:asset -- ondo-ousg
npm run import:asset -- ondo-usdy
npm run import:asset -- franklin-benji
npm run import:asset -- maple-musdc
```

---

## 18. Pastikan Asset Aktif di Neon

Di Neon SQL Editor:

```sql
select slug, "isActive", "updatedAt"
from "Asset"
where slug in ('superstate-ustb', 'ondo-ousg', 'ondo-usdy', 'franklin-benji', 'maple-musdc')
order by slug;
```

Kalau asset belum aktif:

```sql
update "Asset"
set "isActive" = true
where slug = 'asset-slug';
```

Contoh:

```sql
update "Asset"
set "isActive" = true
where slug = 'franklin-benji';
```

---

## 19. Cek Grade di Neon

```sql
select 
  a.slug,
  g.grade,
  g.score,
  g."completenessScore",
  g."sourceScore",
  g."legalScore",
  g."reserveScore",
  g."liquidityScore",
  g."riskScore",
  g.warnings
from "Asset" a
left join "AssetGrade" g on g."assetId" = a.id
where a.slug in ('superstate-ustb', 'ondo-ousg', 'ondo-usdy', 'franklin-benji', 'maple-musdc')
order by a.slug;
```

Target contoh:

```text
superstate-ustb   analytics      76
ondo-ousg         analytics      82
ondo-usdy         analytics      83
franklin-benji    institutional  91
maple-musdc       research/analytics
```

---

## 20. Restart / Redeploy Railway Backend

Setelah database Neon sinkron:

```text
Railway → Backend Service → Restart
```

Atau:

```text
Railway → Deployments → Redeploy latest
```

Cek endpoint:

```text
/v1/assets
/v1/assets/{asset-slug}
```

Contoh:

```text
/v1/assets/franklin-benji
/v1/assets/ondo-usdy
```

---

## 21. Cek Response API

Response detail harus punya:

```json
{
  "slug": "franklin-benji",
  "identity": {},
  "market": {},
  "risk": {},
  "yield": {},
  "blockchain": [],
  "liquidity": {},
  "compliance": {},
  "grade": {
    "grade": "institutional",
    "score": 91,
    "warnings": []
  }
}
```

Kalau asset not found:

1. Cek `isActive`
2. Cek Railway `DATABASE_URL`
3. Restart Railway
4. Tunggu cache
5. Cek endpoint lagi

---

## 22. Deploy Frontend ke Vercel

Kalau frontend sudah auto-deploy dari GitHub:

```text
Vercel akan deploy otomatis setelah push origin main
```

Kalau belum:

```text
Vercel → Project → Deployments → Redeploy
```

Cek halaman:

```text
/dashboard/assets/{asset-slug}
```

Contoh:

```text
/dashboard/assets/franklin-benji
/dashboard/assets/ondo-usdy
```

---

## 23. Final Public QA Checklist

Untuk setiap asset baru, cek di UI:

- [ ] Asset name tampil
- [ ] Symbol tampil
- [ ] TVL tampil
- [ ] Yield tampil kalau ada
- [ ] Holders tampil kalau ada
- [ ] Risk tampil
- [ ] Grade card tampil
- [ ] Score tampil
- [ ] Warnings tampil
- [ ] Compliance tampil
- [ ] Liquidity tampil
- [ ] Blockchain tampil

Cek juga:

- [ ] Tidak ada asset duplicate
- [ ] Slug benar
- [ ] Old slug tidak aktif jika sudah diganti
- [ ] Grade sesuai import output
- [ ] Warning sesuai `grade-baseline.json`
- [ ] API response dan frontend konsisten

---

## 24. Grade Interpretation

### Research-grade

Ciri:

- Data masih awal
- Banyak field `null`
- Source trail belum kuat
- Cocok untuk asset discovery

### Analytics-grade

Ciri:

- Data cukup lengkap
- SourceScore memadai
- Masih ada warning
- Tidak ada blocker fatal
- Cocok untuk public analytics

### Institutional-grade

Minimum ideal:

```text
score >= 85
sourceScore >= 90
legalScore >= 80
reserveScore >= 80
liquidityScore >= 70
riskScore >= 75
blockers = []
```

Syarat tambahan:

- Official issuer source tersedia
- Legal / regulatory filing atau offering document tersedia
- Reserve / backing explanation jelas
- Custodian / administrator / fund manager jelas
- Blockchain contract verified
- Redemption mechanism jelas
- Market/yield data punya timestamp
- Risk scoring berbasis evidence

Catatan:

Institutional-grade adalah hasil verifikasi, bukan target yang dipaksakan.

---

## 25. Aset yang Sudah Berhasil

```text
superstate-ustb   analytics      76
ondo-ousg         analytics      82
ondo-usdy         analytics      83
franklin-benji    institutional  91
```

---

## 26. Alur Ringkas End-to-End

1. Tentukan slug asset
2. Buat folder `data/assets/{slug}`
3. Buat 10 file JSON layer
4. Buat `source-discovery.md`
5. Isi data manual dari official/primary sources
6. Push ke GitHub
7. Assistant bantu buat `sources.json`
8. Assistant bantu buat `risk.json`
9. Assistant bantu rapikan field agar compatible dengan Prisma
10. Pull lokal
11. Validasi JSON
12. `npm run build`
13. `npm run import:asset -- {slug}`
14. Jika error, patch JSON
15. Import ulang
16. Simpan `grade-baseline.json` dari output import
17. Push origin main
18. `npx prisma db push` ke Neon hanya jika schema berubah
19. Import asset ke Neon production
20. Aktifkan asset di Neon
21. Restart Railway
22. Cek endpoint API
23. Redeploy Vercel jika perlu
24. Cek frontend publik

---

## 27. Prinsip Utama Nexus RWA

- Jangan isi data hanya untuk menaikkan grade.
- Lebih baik `null` daripada salah.
- Setiap non-null field harus punya source.
- Market/yield data wajib punya `lastUpdated`.
- Risk scoring dibuat terakhir.
- Proof-of-reserves tidak boleh diklaim tanpa bukti eksplisit.
- SEC/fund reporting berbeda dengan on-chain PoR.
- Legal opinion URL harus dokumen legal publik, bukan asumsi.
- Institutional-grade adalah hasil verifikasi, bukan target yang dipaksakan.
- Dataset harus bisa dipertanggungjawabkan oleh analyst, developer, investor, dan AI agents.

---

## 28. Checklist Cepat per Aset

Gunakan checklist ini setiap menambahkan aset baru.

### Setup

- [ ] Slug sudah ditentukan
- [ ] Folder `data/assets/{slug}/` sudah dibuat
- [ ] 10 file JSON layer sudah dibuat
- [ ] `source-discovery.md` sudah dibuat

### Data Layer

- [ ] `identity.json` lengkap
- [ ] `blockchain.json` lengkap
- [ ] `reserve.json` lengkap
- [ ] `institutional.json` lengkap
- [ ] `compliance.json` lengkap
- [ ] `market.json` lengkap
- [ ] `yield.json` lengkap
- [ ] `liquidity.json` lengkap
- [ ] `sources.json` lengkap
- [ ] `risk.json` selesai

### Validasi

- [ ] Semua JSON valid
- [ ] Numeric field bukan string
- [ ] Boolean field bukan `null`
- [ ] `regulatoryFramework` bukan array
- [ ] `minRedemptionAmount` bukan object
- [ ] Semua source penting punya URL
- [ ] Market/yield punya timestamp
- [ ] Risk score evidence-based

### Import

- [ ] `git pull --rebase origin main`
- [ ] `npm run build` sukses
- [ ] `npm run import:asset -- {slug}` sukses
- [ ] `grade-baseline.json` dibuat dari output import
- [ ] Baseline di-commit dan push

### Production

- [ ] Neon production sudah sinkron
- [ ] Asset `isActive = true`
- [ ] AssetGrade tersedia
- [ ] Railway backend restart/redeploy
- [ ] Endpoint `/v1/assets/{slug}` tampil
- [ ] Frontend Vercel tampil
- [ ] Public QA selesai

---

## 29. Suggested File Name

Simpan dokumen ini sebagai:

```text
docs/rwa-asset-onboarding-guide.md
```

Atau jika ingin diletakkan dekat data:

```text
data/assets/README.md
```
