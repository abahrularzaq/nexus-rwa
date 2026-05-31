# Asset Data Template

Folder ini adalah template untuk setiap asset baru.

## Cara Menggunakan

```bash
# Copy folder template untuk asset baru
cp -r _template/ ondo-ousg/

# Ganti nama file tidak perlu — semua sudah sesuai konvensi
```

## Urutan Pengisian

```
A → identity.md + metadata.json (blockchain section)
B → reserve.md + legal.md
C → market.md          ← sebagian besar auto-sync, minimal edit
D → risk.md + scoring.json
E → sources.yaml       ← isi paralel saat mengisi layer lain
F → master.md          ← isi terakhir setelah semua layer stabil
```

## Status per File

| File | Siapa mengisi | Frekuensi update |
|------|---------------|-----------------|
| `master.md` | Manual (analyst) | Saat ada perubahan signifikan |
| `identity.md` | Manual / AI-assisted | Jarang (launch, rebranding) |
| `reserve.md` | Manual / AI-assisted | Saat ada audit baru |
| `market.md` | Auto-sync | Setiap 6 jam |
| `legal.md` | Manual / AI-assisted | Saat ada perubahan regulasi |
| `risk.md` | AI-assisted + manual review | Bulanan |
| `scoring.json` | AI-assisted + manual review | Bulanan |
| `metadata.json` | Manual | Saat ada perubahan teknikal |
| `sources.yaml` | Manual | Saat ada sumber baru |

## Prompt AI per Layer

Gunakan prompt dari dokumen utama (lihat conversation history) untuk
mengisi setiap layer dengan bantuan Claude atau ChatGPT.

Urutan prompt yang efisien:
1. Prompt Identity → save identity.md
2. Prompt Reserve → save reserve.md
3. Prompt Legal → save legal.md
4. Prompt Risk (butuh output 1-3) → save risk.md + scoring.json
5. Isi metadata.json + sources.yaml manual (~5 menit)
6. Prompt Master (butuh output 1-4) → save master.md

## Validasi Sebelum Import

```bash
# Cek kelengkapan semua file
npm run validate:asset-files -- --slug=[slug]

# Dry run import
npm run import:asset-files -- --slug=[slug] --dry-run

# Import ke database (butuh asset sudah di-seed)
npm run import:asset-files -- --slug=[slug] --force
```

## Definition of Done per Asset

- [ ] Semua file ada (tidak ada yang missing)
- [ ] Tidak ada field wajib yang masih `null` di identity + legal
- [ ] `scoring.json` semua sub-scores terisi
- [ ] `sources.yaml` semua layer punya primary source
- [ ] Sync status: market data sudah masuk minimal 1x
- [ ] History: minimal 7 hari data (tunggu auto-sync)
- [ ] Minimal 1 event jika ada catalyst/berita penting
- [ ] AI narrative ter-generate
- [ ] `master.md` Analyst Summary terisi
