---
# ─── MARKET LAYER ─────────────────────────────────────────
# CATATAN: Field ini di-sync otomatis oleh sync.service setiap 6 jam.
# Isi manual hanya untuk initial seed atau koreksi data.

tvl: null               # USD total value locked
tvl7dChange: null       # persentase, misal -1.31
tvl30dChange: null      # persentase

price: null             # USD per token
priceChange24h: null    # persentase

marketCap: null         # USD
volume24h: null         # USD
circulatingSupply: null
totalSupply: null

holderCount: null
holderChange7d: null    # delta jumlah holder (bisa negatif)

aumUsd: null            # Assets Under Management jika berbeda dari TVL

# defillama | rwa_xyz | coingecko | manual
sources: ["defillama"]
# HIGH | MEDIUM | LOW
confidence: MEDIUM

_lastUpdated: null
_source: auto-sync
---

## Interpretasi Market

_Isi setelah data market stabil (minimal 7 hari sync)._
_Bagaimana TVL trend-nya? Apakah holder count tumbuh?_
_Bandingkan dengan kompetitor dalam kategori yang sama._

## Data Notes

_Catatan khusus tentang data ini:_
_misal "TVL di DeFi Llama undercount karena tidak include chain X"_
_atau "Price tidak tersedia, asset non-tradeable"_
