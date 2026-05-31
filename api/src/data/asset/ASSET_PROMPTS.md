# Nexus RWA — Asset Research Prompts
> Referensi lengkap 7 prompt AI untuk mengisi data per asset.
> Gunakan berurutan. Copy prompt → paste ke Claude/ChatGPT → simpan output ke file.
> Versi 2 — semua prompt sudah include 6 aturan akurasi.

---

## Cara Pakai

```
Untuk setiap asset baru:

1. Buat folder: cp -r _template/ [slug]/
2. Jalankan Prompt 1-4 secara berurutan
3. Susun _all_layers.txt dari output 1-4
4. Jalankan Prompt 5-7 dengan paste _all_layers.txt
5. Jalankan Prompt 8 (master) terakhir

Market data → otomatis via sync service, tidak perlu prompt.
```

### Urutan & Dependency

```
[1] identity.md  ──┐
[2] reserve.md  ──┤──→ [5] metadata.json
[3] legal.md    ──┘
                   │
[1–4] semua ───────┼──→ [6] scoring.json
                   │
[1]+[2]+[3]        │
+ metadata.json ───┴──→ [7] sources.yaml

[1–7] semua ───────────→ [8] master.md
```

### Model yang Direkomendasikan

```
Prompt 1, 2, 3, 5, 7  →  ChatGPT (GPT-4o + Browse)  ← riset web & PDF
Prompt 4, 6, 8         →  Claude                      ← analisis & sintesis
```

---

## Blok Pembuka Universal

> Blok ini sudah diintegrasikan ke setiap prompt di bawah.
> Dokumentasikan di sini sebagai referensi jika ingin modifikasi.

```
KONTEKS:
Kamu adalah analis data RWA senior. Output kamu akan digunakan
sebagai data resmi di platform analytics institusional dan
dikonsumsi oleh investor, developer, dan AI agents.

PRIORITAS (urutan):
1. Akurasi     — data salah lebih buruk dari data kosong
2. Kelengkapan — isi sebanyak mungkin yang bisa diverifikasi
3. Format      — output harus langsung bisa digunakan tanpa editing

ATURAN WAJIB:
- Field tanpa URL sumber yang bisa dibuka → wajib null
- Jangan estimasi, interpolasi, atau average angka
- Jika ada konflik antar sumber → dokumentasikan, jangan pilih diam-diam
- Format output harus EXACT seperti template — jangan tambah atau ubah key
- Setelah output utama, sertakan tabel Sumber per Field

CONFIDENCE LEVEL per field:
  HIGH    → ditemukan di sumber primer resmi, angka eksplisit
  MEDIUM  → ditemukan di sumber sekunder atau perlu interpretasi
  LOW     → inferensi dari konteks, tidak stated explicitly
  → Field confidence LOW: pertimbangkan untuk di-null-kan

HANDLING KONFLIK DATA:
  Jika dua sumber memberikan nilai berbeda:
  - Tampilkan kedua nilai di komentar
  - Gunakan nilai dari sumber reliability lebih tinggi
  - Dokumentasikan di section Notes atau scoringNotes
  - Jangan pilih secara diam-diam

SELF-VALIDASI SEBELUM OUTPUT:
  □ Semua field terisi punya URL di tabel sumber
  □ Tidak ada angka yang di-estimasi tanpa sumber
  □ Format YAML/JSON valid, tidak ada syntax error
  □ Tidak ada field yang ditambah di luar template
  □ Field null ditulis "null" bukan dikosongkan
  □ Konflik data sudah didokumentasikan
```

---

## Prompt 1 — `identity.md`

> **Jalankan di:** ChatGPT (GPT-4o + Browse) atau Perplexity Pro
> **Input:** Nama asset + URL sumber primer
> **Output:** Simpan ke `identity.md`

```
KONTEKS:
Kamu adalah analis data RWA senior. Output kamu akan digunakan
sebagai data resmi di platform analytics institusional dan
dikonsumsi oleh investor, developer, dan AI agents.

PRIORITAS (urutan):
1. Akurasi     — data salah lebih buruk dari data kosong
2. Kelengkapan — isi sebanyak mungkin yang bisa diverifikasi
3. Format      — output harus langsung bisa digunakan tanpa editing

ATURAN WAJIB:
- Field tanpa URL sumber yang bisa dibuka → wajib null
- Jangan estimasi atau mengarang data
- Format output harus EXACT seperti template
- Setelah output, sertakan tabel Sumber per Field

ASSET: [NAMA ASSET]

SUMBER PRIMER — buka semua URL ini sebelum menjawab:
[paste URL: website resmi, docs, Twitter, Etherscan]

---

TUGAS:
Kumpulkan data identitas asset di atas.
Output EXACTLY seperti format berikut —
jangan tambah atau kurangi field di frontmatter:

---
name: 
symbol: 
fullName: 
category: [Treasury|Credit|RealEstate|Commodities|Infrastructure|Equities]
subcategory: 
description: [maks 150 kata, factual, tanpa hype]
websiteUrl: 
docsUrl: 
twitterUrl: 
launchDate: [YYYY-MM-DD]
isin: [null jika tidak ada]
tags: [pilih dari: institutional, retail, kyc-required, audited,
       sec-registered, permissioned, cross-chain, stablecoin-backed]
_lastUpdated: [YYYY-MM-DD hari ini]
_source: manual
---

## Deskripsi Lengkap

[2-3 paragraf:
- Apa asset ini dan cara kerjanya
- Siapa target investor
- Apa yang membedakan dari kompetitor]

## Catatan Analis

[Hal unik yang tidak masuk field terstruktur:
sejarah rebranding, relasi dengan protokol lain,
controversy, atau hal yang perlu dimonitor.
Isi "None noted" jika tidak ada.]

---

SETELAH output di atas, tambahkan:

## Sumber per Field

| Field | Nilai | URL Sumber | Confidence |
|-------|-------|------------|------------|
[isi satu baris per field yang terisi, bukan yang null]

---

SELF-VALIDASI sebelum kirim:
□ Semua field terisi punya baris di tabel sumber
□ Tidak ada field yang di-estimasi tanpa sumber
□ Format frontmatter valid (tidak ada syntax error)
□ Tidak ada field tambahan di luar template
□ Field null ditulis "null"
```

---

## Prompt 2 — `reserve.md`

> **Jalankan di:** ChatGPT (GPT-4o + Browse)
> **Input:** Nama asset + URL transparency page + audit report
> **Output:** Simpan ke `reserve.md`

```
KONTEKS:
Kamu adalah analis data RWA senior. Output kamu akan digunakan
sebagai data resmi di platform analytics institusional.

PRIORITAS: Akurasi di atas segalanya.
Data reserve yang salah bisa menyesatkan keputusan investasi.

ATURAN WAJIB:
- Field tanpa URL sumber yang bisa dibuka → wajib null
- Jangan estimasi angka collateralization atau reserve breakdown
- Jika ada konflik antar sumber → dokumentasikan di Red Flags
- Format output harus EXACT seperti template
- Setelah output, sertakan tabel Sumber per Field

ASSET: [NAMA ASSET]

SUMBER PRIMER — buka semua URL ini sebelum menjawab:
[paste URL: transparency page, audit report PDF, whitepaper]

---

TUGAS:
Analisis struktur reserve/backing asset di atas.
Output EXACTLY seperti format berikut:

---
backingType: [US Treasury|Corporate Bonds|Real Estate|Invoice|
              Receivables|Mixed|Commodity|Equity]
backingDescription: [1 kalimat singkat]
collateralizationRatio: [angka: 1.0=100%, 1.05=105%, atau null]
custodian: 
custodianUrl: 
hasProofOfReserves: [true|false]
porOracleAddress: [contract address atau null]
porOracleChain: [ethereum|base|dll atau null]
auditor: 
lastAuditDate: [YYYY-MM-DD atau null]
lastAuditUrl: 
reserveBreakdown:
  "[komponen 1]": [persentase angka]
  "[komponen 2]": [persentase angka]
redemptionAsset: [USD|USDC|USDT|ETH]
_lastUpdated: [YYYY-MM-DD hari ini]
_source: manual
---

## Analisis Backing

[Bagaimana aset underlying bekerja.
Seberapa aman struktur ini?
Apakah reserve breakdown transparan dan dapat diverifikasi secara on-chain?]

## Red Flags

[Hal yang perlu diperhatikan:
konsentrasi, single point of failure, audit yang sudah lama,
konflik data antar sumber.
Isi "None identified" jika tidak ada.]

---

SETELAH output di atas, tambahkan:

## Sumber per Field

| Field | Nilai | URL Sumber | Confidence |
|-------|-------|------------|------------|
[isi satu baris per field yang terisi]

---

SELF-VALIDASI sebelum kirim:
□ Semua field terisi punya baris di tabel sumber
□ reserveBreakdown total = 100% jika diisi
□ Tidak ada angka yang di-estimasi
□ Konflik data sudah di Red Flags
□ Field null ditulis "null"
```

---

## Prompt 3 — `legal.md`

> **Jalankan di:** ChatGPT (GPT-4o + Browse)
> **Input:** Nama asset + URL terms of service + offering memo + SEC filing
> **Output:** Simpan ke `legal.md`

```
KONTEKS:
Kamu adalah analis hukum RWA senior. Output kamu akan digunakan
sebagai data resmi di platform analytics institusional.

PRIORITAS: Akurasi regulasi adalah critical —
data legal yang salah bisa membuat investor mengambil
keputusan yang melanggar hukum di jurisdiksi mereka.

ATURAN WAJIB:
- Field tanpa URL sumber yang bisa dibuka → wajib null
- Jangan asumsikan regulasi berdasarkan negara asal issuer
- Jika ada konflik antar sumber → dokumentasikan
- Format output harus EXACT seperti template
- Setelah output, sertakan tabel Sumber per Field

ASSET: [NAMA ASSET]

SUMBER PRIMER — buka semua URL ini sebelum menjawab:
[paste URL: terms of service, offering memo, SEC EDGAR search,
legal disclaimer di website]

---

TUGAS:
Analisis struktur legal asset di atas.
Output EXACTLY seperti format berikut:

---
regulatoryStatus: [registered|exempt|unregulated|pending]
primaryRegulator: [SEC|MAS|FCA|FINMA|DFSA|CSSF|null]
regulatoryFramework: [Reg D|Reg S|MiCA|AIFMD|null]
issuerName: 
issuerCountry: [kode 2 huruf: US|SG|KY|IE|LU|BVI|dll]
legalStructure: [Delaware LLC|Cayman Islands Fund|BVI Company|dll]
fundManager: 
minimumInvestment: [angka USD atau null]
managementFee: [% per tahun atau null]
performanceFee: [% atau null]
targetInvestors: [retail|accredited|institutional]
prospectusUrl: [URL atau null]
kycRequired: [true|false]
accreditedOnly: [true|false]
blockedJurisdictions: [array kode negara ISO, misal: ["CN","KP","IR"]]
allowedJurisdictions: [kosongkan jika semua diizinkan kecuali blocked]
sanctionsScreening: [true|false]
amlPolicy: [nama KYC provider atau deskripsi singkat atau null]
legalOpinionUrl: [URL atau null]
_lastUpdated: [YYYY-MM-DD hari ini]
_source: manual
---

## Analisis Legal

[Penjelasan struktur legal.
Kenapa jurisdiksi ini dipilih?
Implikasi bagi investor retail vs institusi.]

## Investor Access

[Siapa yang bisa invest, proses onboarding,
estimasi waktu KYC, provider yang digunakan jika diketahui publik.]

## Regulatory Risk

[Potensi risiko regulasi: uncertainty, pending registration,
historical enforcement, atau area abu-abu.
Isi "Low — fully registered" jika tidak ada isu.]

---

SETELAH output di atas, tambahkan:

## Sumber per Field

| Field | Nilai | URL Sumber | Confidence |
|-------|-------|------------|------------|
[isi satu baris per field yang terisi]

---

SELF-VALIDASI sebelum kirim:
□ Semua field terisi punya baris di tabel sumber
□ blockedJurisdictions berdasarkan Terms of Service resmi
□ Tidak ada asumsi regulasi tanpa sumber
□ Konflik data sudah didokumentasikan
□ Field null ditulis "null"
```

---

## Prompt 4 — `risk.md`

> **Jalankan di:** Claude
> **Input:** Output dari Prompt 1, 2, 3
> **Output:** Simpan ke `risk.md`

```
KONTEKS:
Kamu adalah risk analyst RWA senior. Output kamu akan digunakan
sebagai data resmi di platform analytics institusional.

PRIORITAS: Risk assessment yang tidak akurat langsung
mempengaruhi kepercayaan investor terhadap platform.
Gunakan hanya data yang sudah ada di input — jangan cari data baru.

ATURAN WAJIB:
- Semua penilaian harus berdasarkan data dari layer yang disediakan
- Jika data tidak cukup untuk menilai suatu dimensi → tulis null dan jelaskan
- riskFactors dan mitigants harus konkret dan spesifik, bukan generik
- Format output harus EXACT seperti template
- Dokumentasikan reasoning di setiap section narasi

ASSET: [NAMA ASSET]

=== identity.md ===
[paste output Prompt 1]

=== reserve.md ===
[paste output Prompt 2]

=== legal.md ===
[paste output Prompt 3]

---

TUGAS:
Buat risk assessment berdasarkan semua data di atas.
Output EXACTLY seperti format berikut:

---
overallLevel: [LOW|MEDIUM|HIGH]
assessmentMethod: ai-assisted
lastAssessed: [YYYY-MM-DD hari ini]
riskFactors:
  - "[faktor konkret — referensikan data spesifik dari input]"
  - "[faktor konkret 2]"
mitigants:
  - "[mitigant konkret — referensikan data spesifik dari input]"
  - "[mitigant konkret 2]"
_lastUpdated: [YYYY-MM-DD hari ini]
_source: manual
---

## Metodologi Penilaian

[Jelaskan bagaimana tiap dimensi risiko dinilai
untuk asset ini secara spesifik.
Referensikan data konkret dari input.]

## Risk Factors (Detail)

[Elaborasi setiap item di riskFactors.
Seberapa material? Dalam kondisi apa terpicu?
Kutip data spesifik dari input sebagai basis.]

## Mitigants (Detail)

[Elaborasi setiap item di mitigants.
Seberapa efektif? Ada celah yang perlu diperhatikan?]

## Kesimpulan Risk

[Summary: cocok untuk investor retail atau institusi saja?
Kondisi apa yang bisa menaikkan risk level?
Bandingkan risk-adjusted yield vs kompetitor kategori yang sama.]

## Data Gaps untuk Risk Assessment

[Field mana dari input yang null dan mempengaruhi
kualitas risk assessment ini. Apa yang perlu dilengkapi?
Isi "None — data sufficient" jika lengkap.]

---

SELF-VALIDASI sebelum kirim:
□ overallLevel konsisten dengan narasi
□ Setiap riskFactor dan mitigant punya basis data dari input
□ Tidak ada penilaian yang berdasarkan asumsi tanpa data
□ Data gaps sudah didokumentasikan
□ Format frontmatter valid
```

---

## Prompt 5 — `metadata.json`

> **Jalankan di:** ChatGPT (GPT-4o + Browse)
> **Input:** Output dari Prompt 1, 2, 3
> **Output:** Simpan ke `metadata.json`

```
KONTEKS:
Kamu adalah data engineer RWA senior. File metadata.json yang kamu
hasilkan akan dibaca langsung oleh import script — satu karakter
salah bisa menyebabkan import gagal.

PRIORITAS:
1. JSON valid secara syntax
2. Setiap nilai punya sumber yang bisa diverifikasi
3. Kelengkapan data

ATURAN WAJIB:
- Output harus JSON valid — tidak ada komentar di dalam JSON
- Field tanpa sumber yang bisa dibuka → null
- Jangan estimasi liquidityScore tanpa basis redemptionType
- Jika ada konflik data → gunakan sumber reliability lebih tinggi
  dan dokumentasikan di section Catatan Konflik
- Setelah JSON, sertakan tabel Sumber per Field

ASSET: [NAMA ASSET]

SUMBER PRIMER — buka semua URL ini:
[paste URL: website, docs, DeFi Llama, Etherscan/explorer]

=== identity.md ===
[paste output Prompt 1]

=== legal.md ===
[paste output Prompt 3]

=== reserve.md ===
[paste output Prompt 2]

---

TUGAS:
Isi metadata.json berikut. Output harus EXACT JSON valid.
Cari juga: DeFi Llama protocol slug, pool ID, CoinGecko ID,
contract address di blockchain explorer.

Panduan liquidityScore:
  instant redemption + DEX pairs tersedia  →  85–100
  T+1                                      →  70–84
  T+3                                      →  55–69
  weekly                                   →  40–54
  monthly                                  →  20–39
  lock-up > 6 bulan                        →   0–19

{
  "slug": "",
  "isActive": true,
  "dataVersion": 1,

  "externalIds": {
    "defiLlamaProtocol": null,
    "defiLlamaPool":     null,
    "coingeckoId":       null,
    "rwaDotXyzId":       null,
    "cmcId":             null
  },

  "blockchain": [
    {
      "chain":                   null,
      "chainId":                 null,
      "contractAddress":         null,
      "tokenStandard":           null,
      "isTransferable":          true,
      "hasWhitelist":            false,
      "hasTransferRestrictions": false,
      "explorerUrl":             null,
      "deployedAt":              null,
      "isVerified":              false
    }
  ],

  "yield": {
    "currentYield":   null,
    "yieldType":      null,
    "yieldFrequency": null,
    "yieldBenchmark": null,
    "yieldCurrency":  "USD",
    "nextYieldDate":  null
  },

  "liquidity": {
    "redemptionType":       null,
    "redemptionPeriodDays": null,
    "lockupPeriodDays":     null,
    "earlyRedemptionFee":   null,
    "minRedemptionAmount":  null,
    "liquidityScore":       null,
    "liquidityNotes":       null,
    "dexPairs": []
  }
}

---

SETELAH JSON, tambahkan:

## Sumber per Field

| Field | Nilai | URL Sumber | Confidence |
|-------|-------|------------|------------|
[satu baris per field yang terisi]

## Catatan Konflik

[Dokumentasikan jika ada nilai berbeda antar sumber.
Isi "None" jika tidak ada konflik.]

---

SELF-VALIDASI sebelum kirim:
□ JSON bisa di-parse tanpa error (cek di jsonlint.com)
□ Tidak ada komentar di dalam JSON
□ Semua field terisi punya baris di tabel sumber
□ liquidityScore konsisten dengan redemptionType
□ contractAddress sudah diverifikasi di explorer
□ Field null ditulis null (bukan string "null")
```

---

## Prompt 6 — `scoring.json`

> **Jalankan di:** Claude
> **Input:** Output dari Prompt 1, 2, 3, 4
> **Output:** Simpan ke `scoring.json`

```
KONTEKS:
Kamu adalah risk scoring analyst RWA senior. Scoring yang kamu
hasilkan akan ditampilkan ke investor sebagai risk rating resmi.

PRIORITAS:
1. Konsistensi — scoring harus bisa direplikasi dengan reasoning yang sama
2. Basis data — setiap score harus ada data pendukungnya dari input
3. Format JSON valid

ATURAN WAJIB:
- Setiap sub-score harus punya scoringNote yang menjelaskan basis penilaian
- Gunakan hanya data dari input — jangan asumsi data yang tidak ada
- overallScore = hitung weighted average secara eksak, jangan estimasi
- Jika data tidak cukup untuk menilai → score 50 (neutral) + note penjelasan
- Format JSON valid, tidak ada komentar di dalam JSON

ASSET: [NAMA ASSET]

=== identity.md ===
[paste]

=== reserve.md ===
[paste]

=== legal.md ===
[paste]

=== risk.md ===
[paste]

---

PANDUAN SCORING (0–100, makin tinggi = makin AMAN):

smartContract (weight 20%):
  90–100  Audit ≥2 firms terpercaya, formal verification, bug bounty aktif
  70–89   Audit 1–2 firms, kode verified di explorer
  50–69   Audit ada tapi firm kurang dikenal atau sudah >1 tahun lalu
  30–49   Audit tidak ada atau tidak dipublikasi
  0–29    Known vulnerabilities atau exploit history

counterparty (weight 20%):
  90–100  Custodian Tier-1 bank, issuer regulated dan established >5 tahun
  70–89   Custodian regulated, issuer established >3 tahun
  50–69   Custodian atau issuer kurang dikenal tapi regulated
  30–49   Single point of failure atau issuer <1 tahun
  0–29    Custodian tidak jelas atau issuer anonymous

liquidity (weight 20%):
  90–100  Instant redemption + secondary market liquid
  70–89   T+1 redemption
  50–69   T+3 atau weekly redemption
  30–49   Monthly redemption
  0–29    Lock-up >6 bulan atau tidak ada mekanisme redemption

regulatory (weight 15%):
  90–100  Registered SEC/MAS/FCA, full compliance, audit rutin
  70–89   Exempt dalam framework yang jelas (Reg D)
  50–69   Status tidak jelas atau pending
  30–49   Unregulated di jurisdiksi major
  0–29    Regulatory issues atau enforcement history

market (weight 15%):
  90–100  TVL stabil >$500M, yield konsisten, holder tumbuh
  70–89   TVL >$100M, yield normal, holder stabil
  50–69   TVL $10M–$100M atau yield volatil
  30–49   TVL <$10M atau TVL turun signifikan
  0–29    TVL sangat kecil atau yield tidak masuk akal

concentration (weight 10%):
  90–100  >1000 holders, top 10 wallet <20% supply
  70–89   500–1000 holders
  50–69   100–500 holders
  30–49   <100 holders atau top 10 >50% supply
  0–29    <20 holders atau satu wallet dominan

overallScore formula:
  (smartContract × 0.20) + (counterparty × 0.20) + (liquidity × 0.20)
  + (regulatory × 0.15) + (market × 0.15) + (concentration × 0.10)

overallLevel:
  ≥ 70  →  LOW
  40–69 →  MEDIUM
  < 40  →  HIGH

---

TUGAS: Output EXACTLY JSON valid:

{
  "version": 1,
  "assessmentDate": "[YYYY-MM-DD]",
  "assessmentMethod": "ai-assisted",

  "subScores": {
    "_weights": {
      "smartContract": 0.20,
      "counterparty":  0.20,
      "liquidity":     0.20,
      "regulatory":    0.15,
      "market":        0.15,
      "concentration": 0.10
    },
    "smartContract": null,
    "counterparty":  null,
    "liquidity":     null,
    "regulatory":    null,
    "market":        null,
    "concentration": null
  },

  "scoringNotes": {
    "smartContract":  "[basis data konkret dari input]",
    "counterparty":   "[basis data konkret dari input]",
    "liquidity":      "[basis data konkret dari input]",
    "regulatory":     "[basis data konkret dari input]",
    "market":         "[basis data konkret dari input]",
    "concentration":  "[basis data konkret dari input]"
  },

  "overallScore": null,
  "overallLevel": null
}

---

SETELAH JSON, tambahkan:

## Kalkulasi overallScore

[Tunjukkan perhitungan eksak:
smartContract(XX) × 0.20 = XX
counterparty(XX) × 0.20  = XX
... dst
Total = XX → dibulatkan ke XX]

## Data yang Tidak Tersedia

[List dimensi yang datanya tidak ada di input
sehingga menggunakan score 50 neutral.
Isi "None" jika semua dimensi punya data.]

---

SELF-VALIDASI sebelum kirim:
□ JSON bisa di-parse tanpa error
□ Semua scoringNotes berisi basis data konkret dari input
□ overallScore = hasil kalkulasi yang ditunjukkan, bukan estimasi
□ overallLevel konsisten dengan overallScore
□ Tidak ada komentar di dalam JSON
```

---

## Prompt 7 — `sources.yaml`

> **Jalankan di:** ChatGPT (GPT-4o + Browse)
> **Input:** Output dari Prompt 1, 2, 3 + metadata.json
> **Output:** Simpan ke `sources.yaml`

```
KONTEKS:
Kamu adalah data librarian RWA senior. sources.yaml adalah
audit trail dari seluruh data asset — dokumen ini yang akan
digunakan jika ada pertanyaan "dari mana angka ini berasal?".

PRIORITAS:
1. Kelengkapan sumber — setiap layer harus punya primary source
2. Akurasi URL — semua URL harus bisa dibuka saat ini
3. Format YAML valid

ATURAN WAJIB:
- Cek setiap URL masih aktif sebelum dimasukkan
- URL yang redirect atau 404 → null + catat di notes
- reliabilityScore harus refleksikan kualitas sumber secara jujur
- dataGaps harus mencantumkan SEMUA field yang null di semua layer
- Format YAML valid

ASSET: [NAMA ASSET]

=== identity.md ===
[paste]

=== reserve.md ===
[paste]

=== legal.md ===
[paste]

=== metadata.json ===
[paste]

---

PANDUAN reliabilityScore:
  90–100  Official primary source (website resmi, SEC filing, audit report)
  70–89   Official secondary (docs, FAQ, blog resmi protokol)
  50–69   Aggregator terpercaya (DeFi Llama, CoinGecko)
  30–49   Community source (forum, third-party analysis)
  0–29    Tidak terverifikasi atau sumber tidak jelas

---

TUGAS: Output EXACTLY YAML valid:

identity:
  primary: null
  docs: null
  lastVerified: null
  notes: null

reserve:
  primary: null
  audit: null
  oracle: null
  lastVerified: null
  notes: null

legal:
  primary: null
  offeringMemo: null
  legalOpinion: null
  lastVerified: null
  notes: null

market:
  primary: defillama
  defiLlamaProtocol: null
  defiLlamaPool: null
  fallback: coingecko
  coingeckoId: null
  lastVerified: null
  notes: null

risk:
  methodology: ai-assisted
  lastAssessed: null
  reviewer: null
  nextReviewDate: null
  notes: null

reliabilityScores:
  identity: null
  reserve:  null
  legal:    null
  market:   null
  risk:     null

dataGaps:
  - layer: null
    field: null
    reason: null

---

SETELAH YAML, tambahkan:

## URL Status Check

| URL | Layer | Status | Notes |
|-----|-------|--------|-------|
[cek setiap URL yang dimasukkan, tulis Active/Redirect/404]

---

SELF-VALIDASI sebelum kirim:
□ Semua URL sudah dicek statusnya
□ URL yang 404 atau redirect sudah di-null-kan
□ dataGaps mencantumkan semua field null dari semua layer
□ reliabilityScores jujur refleksikan kualitas sumber
□ YAML bisa di-parse tanpa error
```

---

## Prompt 8 — `master.md`

> **Jalankan di:** Claude
> **Input:** Semua layer (Prompt 1–7)
> **Output:** Simpan ke `master.md`

```
KONTEKS:
Kamu adalah senior RWA analyst. master.md adalah dokumen
yang dibaca pertama kali oleh investor dan partner.
Kualitas narasi mencerminkan kredibilitas platform.

PRIORITAS:
1. Akurasi — semua fakta harus bersumber dari input
2. Kejelasan — dapat dipahami investor non-teknis
3. Keseimbangan — tidak promosi, tidak terlalu negatif

ATURAN WAJIB:
- Semua angka yang disebut harus ada di input
- Jangan tambahkan klaim yang tidak ada di layer manapun
- Analyst Summary harus berimbang: kelebihan DAN risiko
- Tandai index layer dengan status yang akurat
- Format output harus EXACT seperti template

ASSET: [NAMA ASSET]

=== identity.md ===
[paste]

=== reserve.md ===
[paste]

=== legal.md ===
[paste]

=== risk.md ===
[paste]

=== scoring.json ===
[paste]

=== metadata.json (yield + liquidity section) ===
[paste]

=== sources.yaml (reliabilityScores) ===
[paste]

---

TUGAS: Output EXACTLY seperti format berikut:

# [Asset Name] ([SYMBOL])
> **Status:** ✅ Complete — semua layer terisi

## TL;DR
[2–3 kalimat: apa ini, berapa yield, risk level, siapa yang cocok.
Harus bisa dibaca dalam 10 detik dan langsung paham.]

---

## Index Layer

| Layer | Status | Last Updated | Reliability |
|-------|--------|--------------|-------------|
| Identity | ✅ done | [dari _lastUpdated] | [dari sources.yaml] |
| Reserve | ✅ done | [dari _lastUpdated] | [dari sources.yaml] |
| Market | 🔄 auto-sync | — | via DeFi Llama |
| Legal | ✅ done | [dari _lastUpdated] | [dari sources.yaml] |
| Risk | ✅ done | [dari _lastUpdated] | [dari sources.yaml] |
| Scoring | ✅ done | [dari assessmentDate] | ai-assisted |
| AI Narrative | ⏳ pending | — | generate setelah 7 hari market data |

---

## Key Facts

| Metric | Value |
|--------|-------|
| Category | |
| Issuer | |
| Issuer Country | |
| Legal Structure | |
| Custodian | |
| Min. Investment | |
| Redemption Period | |
| Primary Regulator | |
| KYC Required | |
| Accredited Only | |
| Risk Score | [overallScore] — [overallLevel] |

---

## Analyst Summary

[Paragraf 1 — Positioning:
Asset ini berada di mana dalam landscape RWA?
Kompetitor terdekat siapa, apa diferensiasinya?]

[Paragraf 2 — Kelebihan:
2–3 kelebihan konkret dengan angka pendukung dari input.
Contoh: yield, custodian tier, regulatory clarity.]

[Paragraf 3 — Risiko:
2–3 risiko utama dari riskFactors, ditulis berimbang.
Bukan menakut-nakuti, tapi investor perlu tahu.]

[Paragraf 4 — Outlook:
Tren TVL, arah regulasi di jurisdiksi ini,
potensi expansion ke chain lain atau investor base baru.]

---

## Change Log

| Date | Layer | Change | Author |
|------|-------|--------|--------|
| [hari ini] | All | Initial creation | AI-assisted |

---

SELF-VALIDASI sebelum kirim:
□ TL;DR bisa dipahami dalam 10 detik
□ Semua angka di Key Facts dan Analyst Summary ada di input
□ Analyst Summary berimbang (ada kelebihan DAN risiko)
□ Index layer status akurat sesuai data yang tersedia
□ Tidak ada klaim tanpa basis data dari input
```

---

## Quick Reference

| # | Prompt | File | Model | Input | Estimasi |
|---|--------|------|-------|-------|----------|
| 1 | Identity | identity.md | ChatGPT | Nama + URL primer | 5 menit |
| 2 | Reserve | reserve.md | ChatGPT | Nama + URL transparency | 10 menit |
| 3 | Legal | legal.md | ChatGPT | Nama + URL ToS + SEC | 10 menit |
| 4 | Risk | risk.md | Claude | Output 1–3 | 5 menit |
| 5 | Metadata | metadata.json | ChatGPT | Output 1, 2, 3 | 5 menit |
| 6 | Scoring | scoring.json | Claude | Output 1–4 | 3 menit |
| 7 | Sources | sources.yaml | ChatGPT | Output 1–3 + metadata | 3 menit |
| 8 | Master | master.md | Claude | Output semua | 5 menit |
| | | | | **Total per asset** | **~46 menit** |

---

## 6 Aturan Akurasi (Ringkasan)

```
1. Konteks peran     Setiap prompt dimulai dengan "kamu adalah [role] senior"
2. Null wajib        Field tanpa URL sumber → null, bukan estimasi
3. Tabel sumber      Setiap nilai terisi punya baris di tabel sumber
4. Confidence level  HIGH / MEDIUM / LOW per field
5. Handling konflik  Dokumentasikan, jangan pilih diam-diam
6. Self-validasi     AI cek checklist sebelum deliver output
```

---

## Definition of Done per Asset

```
□ Semua 9 file ada di folder asset
□ Tidak ada field wajib null di identity + legal
□ scoring.json semua sub-scores terisi (bukan null)
□ sources.yaml semua layer punya primary source + URL aktif
□ Market data: minimal 1x sync berhasil
□ History: minimal 7 hari data (tunggu auto-sync)
□ Minimal 1 event jika ada catalyst/berita penting
□ AI narrative ter-generate (setelah 7 hari market data stabil)
□ master.md Analyst Summary terisi dan berimbang
□ master.md status badge: ✅ Complete
```
