# Nexus RWA Public Demo Production Workflow

Date: 2026-06-07  
Status: Practical workflow for Loom demo recording  
Related script: `docs/public-demo-script.md`

---

## 1. Goal

This document is the simplest practical workflow to produce a public demo video for Nexus RWA using:

- Loom for screen recording,
- ElevenLabs for voice-over,
- Canva or CapCut for light editing,
- X / LinkedIn / landing page for distribution.

The demo should position Nexus RWA as an evidence-based intelligence layer for tokenized real-world assets, not just another asset list.

Core message:

> Nexus RWA helps users compare tokenized real-world assets beyond yield using structured data, risk scoring, and source-backed evidence.

---

## 2. Recommended Demo Format

Use the short public demo first.

Recommended duration:

```text
3-5 minutes
```

Why:

- Easier to record.
- Easier to post on X / LinkedIn.
- Easier for early users to understand.
- Less chance of bugs appearing during recording.
- Enough to show the product value without explaining every feature.

Avoid starting with a long 10-12 minute demo unless it is for grant, investor, or partner context.

---

## 3. Demo Storyline

Use this simple storyline:

```text
Problem → Nexus RWA solution → BENJI example → Compare BUIDL/PAXG → Sources/Risk → x402 Pro → Closing CTA
```

### Scene order

| Scene | Page / Action | Main Message |
|---|---|---|
| 1 | Landing page or asset catalog | RWA comparison is still messy if users only look at TVL, yield, or brand. |
| 2 | `/dashboard/assets` | Nexus RWA structures assets using a 12-layer intelligence model. |
| 3 | `/dashboard/assets/franklin-benji` | BENJI is the flagship example because it has strong completeness and evidence. |
| 4 | Risk & Grade tab | Nexus shows evidence-based grading, not financial advice. |
| 5 | Sources tab | Every serious RWA dataset needs source trails. |
| 6 | `/dashboard/assets/blackrock-buidl` | Strong brand is useful, but Nexus still checks evidence gaps. |
| 7 | `/dashboard/assets/paxos-paxg` | Gold-backed RWA has different key questions: reserve, custody, redemption, liquidity. |
| 8 | x402 paywall or `PRO ACTIVE` badge | Public discovery is free; deeper intelligence is unlocked by x402 USDC access pass. |
| 9 | Closing | Compare RWA assets beyond yield. |

---

## 4. Asset Selection

Use this asset order for the public demo:

1. `franklin-benji`
2. `blackrock-buidl`
3. `paxos-paxg`
4. `ondo-usdy` or `ondo-ousg` only if needed

Do not lead with:

```text
tether-gold-xaut
```

Reason: if legal structure, custodian, or other important fields are still incomplete, it can weaken the first impression.

---

## 5. Minimum Data Completeness Before Recording

Before recording, make sure the demo assets are presentable.

### A. Franklin BENJI — flagship asset

Required:

- Overview loads correctly.
- Grade badge is visible.
- Risk score is visible.
- Layer completeness is visible.
- Issuer / institutional data is filled.
- Compliance data is filled where available.
- Reserve data is filled where available.
- Market and yield tab loads.
- Liquidity section loads.
- Sources tab has usable source list.
- Warnings are acceptable and explainable.

Recommended positioning:

```text
BENJI is the strongest example in the current dataset and is used to show how Nexus RWA works when the evidence base is strong.
```

### B. BlackRock BUIDL — brand comparison

Required:

- Asset page loads.
- Grade or score is visible.
- Source gaps or warnings are acceptable.
- Reserve/legal/source sections do not look empty.

Recommended positioning:

```text
BUIDL has strong brand recognition, but Nexus RWA still evaluates it based on evidence, not brand name alone.
```

### C. Paxos PAXG — commodity-backed comparison

Required:

- Asset page loads.
- Reserve/backing information is visible.
- Custody / redemption / liquidity fields are present where verified.
- Yield is not overemphasized because PAXG is gold-backed, not yield-focused.

Recommended positioning:

```text
PAXG shows that different RWA categories need different analysis. For gold-backed assets, reserve, custodian, redemption, and liquidity matter more than yield.
```

---

## 6. Technical Pre-Recording Checklist

Use this checklist before opening Loom.

### App readiness

- [ ] Production frontend URL works.
- [ ] Production API URL works.
- [ ] `/health` returns OK.
- [ ] `/dashboard/assets` loads.
- [ ] `/dashboard/assets/franklin-benji` loads.
- [ ] BENJI tabs render correctly.
- [ ] Risk & Grade tab renders correctly.
- [ ] Sources tab renders correctly.
- [ ] Market & Yield tab renders correctly.
- [ ] AI insight works or fallback is acceptable.
- [ ] x402 modal works if showing unpaid wallet.
- [ ] `PRO ACTIVE` badge works if showing paid wallet.

### Browser readiness

- [ ] Use a clean browser profile.
- [ ] Hide unrelated bookmarks.
- [ ] Close private tabs.
- [ ] Use dark theme if it looks better.
- [ ] Set browser zoom to 90% or 100%.
- [ ] Make sure wallet address exposure is acceptable.
- [ ] Prepare exact URLs in pinned tabs.
- [ ] Turn off noisy notifications.

### Recording readiness

- [ ] Record in 1080p if available.
- [ ] Use 16:9 format.
- [ ] Do one silent practice run.
- [ ] Do not click too fast.
- [ ] Pause 1-2 seconds before moving between tabs.
- [ ] Keep cursor movement calm.
- [ ] Avoid explaining every field.

---

## 7. Loom Recording Workflow

### Option A — easiest workflow

Use Loom to record screen only, then add voice-over later.

Steps:

1. Open all required tabs first.
2. Start Loom screen recording.
3. Record the product walkthrough silently.
4. Move slowly between sections.
5. Stop recording.
6. Download the video from Loom.
7. Generate voice-over in ElevenLabs.
8. Combine video + voice-over in CapCut or Canva.
9. Export final video.

Best for:

- non-native English voice-over,
- cleaner narration,
- fewer recording mistakes,
- easier editing.

### Option B — fast workflow

Use Loom with live voice.

Steps:

1. Open script beside browser.
2. Start Loom.
3. Read the script naturally while recording.
4. Stop if major mistake happens.
5. Trim beginning and ending in Loom.
6. Publish directly or download for editing.

Best for:

- fast founder update,
- casual product update,
- internal demo.

Recommendation:

```text
Use Option A for public demo.
```

---

## 8. ElevenLabs Voice-Over Workflow

### Voice style

Use a calm, founder-style narration.

Recommended settings:

- Language: Indonesian or English.
- Tone: calm, confident, educational.
- Speed: normal or slightly slow.
- Avoid overly dramatic voice.
- Avoid salesy tone.

### Suggested Indonesian voice-over script

```text
Sekarang RWA lagi jadi salah satu narasi besar di crypto.
Tapi masalahnya, kebanyakan orang masih membandingkan aset RWA hanya dari TVL, yield, atau nama besar issuer.

Padahal untuk RWA, yield saja tidak cukup.
Kita perlu tahu siapa issuer-nya, legal structure-nya seperti apa, reserve backing-nya apa, compliance-nya bagaimana, likuiditasnya seperti apa, dan sumber datanya seberapa kuat.

Nexus RWA mencoba menyelesaikan masalah itu dengan pendekatan 12-layer intelligence.
Jadi setiap aset RWA tidak hanya dilihat dari market data, tapi juga dari identity, institutional, compliance, reserve, blockchain, market, yield, liquidity, risk, sources, dan grade.

Kita mulai dari Franklin BENJI.
Di sini kita bisa lihat bukan cuma angka yield atau TVL, tapi juga struktur data yang lebih lengkap: issuer, legal, compliance, reserve, liquidity, sampai risk dan source trail.

Bagian Risk and Grade membantu user memahami kualitas evidence dan faktor risiko utama dari sebuah aset.
Ini bukan financial advice, tapi structured intelligence untuk membantu analisis.

Lalu di bagian Sources, Nexus RWA menampilkan jejak sumber data.
Ini penting karena untuk RWA, angka saja tidak cukup. Kita perlu tahu data itu berasal dari mana dan seberapa kredibel sumbernya.

Sekarang kita bandingkan dengan BUIDL dari BlackRock.
Brand-nya tentu sangat kuat, tapi Nexus tetap menilai berdasarkan evidence, bukan nama besar saja.
Kalau ada gap di reserve breakdown, audit report, proof-of-reserves, atau legal documentation, itu tetap dicatat.

Lalu untuk PAXG, ini contoh RWA yang berbeda karena backed by gold.
Jadi layer reserve, custodian, redemption, dan liquidity menjadi lebih penting dibanding yield.

Untuk akses dasar, user bisa melihat public data secara gratis.
Tapi untuk layer yang lebih dalam seperti full profile, risk breakdown, source trail, history, dan AI insight, Nexus menggunakan x402 USDC access pass.

Jadi intinya, Nexus RWA bukan hanya daftar aset RWA.
Ini adalah evidence-based intelligence layer untuk membantu investor, builder, dan AI agent membandingkan aset RWA secara lebih objektif.

Bukan cuma melihat yield, tapi melihat evidence di balik aset tersebut.
```

### Voice-over tips

- Generate per paragraph, not all at once, if the output sounds unnatural.
- Leave small pauses between sections.
- Export as MP3 or WAV.
- Keep total voice-over around 3-5 minutes.
- Match screen movement to the narration.

---

## 9. Editing Workflow

Use CapCut if you want easiest timeline editing. Use Canva if you want cleaner branding and intro/outro slides.

### Recommended simple stack

```text
Loom → ElevenLabs → CapCut → Export MP4 → Upload to X / LinkedIn / YouTube / Landing page
```

### Editing steps in CapCut

1. Import Loom video.
2. Import ElevenLabs audio.
3. Remove original silent audio if needed.
4. Align voice-over with screen movement.
5. Cut boring pauses.
6. Add simple intro text.
7. Add simple closing CTA.
8. Export MP4.

### Suggested intro text overlay

```text
Nexus RWA
Compare tokenized real-world assets beyond yield
```

### Suggested section labels

Use only a few labels:

- Problem
- 12-Layer Intelligence
- BENJI Example
- Risk & Sources
- BUIDL / PAXG Comparison
- x402 Access

### Suggested outro text overlay

```text
Nexus RWA
Evidence-based RWA intelligence layer
```

---

## 10. Visual Direction

Keep the video clean and serious.

Recommended visual style:

- dark UI,
- slow cursor movement,
- minimal zoom effects,
- no excessive transitions,
- no meme sound effects,
- no overdesigned animation,
- focus on product credibility.

Avoid:

- too many popups,
- too many tabs,
- switching pages too fast,
- showing incomplete asset as the first example,
- overclaiming institutional-grade status for all assets.

---

## 11. What To Say and What Not To Say

### Say

- Nexus RWA helps compare RWA assets beyond yield.
- The scoring is evidence-based.
- The product tracks data gaps instead of hiding them.
- Sources are part of the product, not an afterthought.
- This is not investment advice.
- Different RWA categories require different analysis.

### Do not say

- This asset is safe.
- This asset is guaranteed.
- This is the best RWA asset.
- All assets are institutional-grade.
- Nexus RWA gives investment recommendations.
- Higher yield means better asset.

---

## 12. Final Export Checklist

Before posting:

- [ ] Video length is 3-5 minutes.
- [ ] Audio is clear.
- [ ] No sensitive wallet data is exposed.
- [ ] No private API keys are visible.
- [ ] No local/dev URL is visible unless intentional.
- [ ] BENJI appears first.
- [ ] BUIDL/PAXG comparison is clear.
- [ ] Sources tab is shown.
- [ ] Risk/Grade disclaimer is included.
- [ ] x402 access is shown briefly.
- [ ] Ending CTA is included.

---

## 13. Distribution Plan

### X

Post the video with a short founder-style caption.

Suggested caption:

```text
I’m building Nexus RWA — an evidence-based intelligence layer for tokenized real-world assets.

Most RWA dashboards show TVL, yield, and market data.
But for RWA, that is not enough.

Nexus RWA helps compare assets beyond yield: issuer, legal structure, reserve, compliance, liquidity, risk, sources, and grade.

Here’s the first public demo.
```

### LinkedIn

Use a more professional caption.

Suggested caption:

```text
Real-world assets are becoming one of the most important categories in blockchain, but comparing tokenized RWA products is still difficult.

Nexus RWA is my attempt to build a structured intelligence layer for RWA assets — covering issuer, legal structure, reserve, compliance, liquidity, risk, source reliability, and grade.

The goal is simple: help users compare tokenized real-world assets beyond yield.
```

### Landing page

Embed the video near:

- hero section,
- product demo section,
- pricing section,
- x402 access explanation.

Recommended CTA below video:

```text
Explore Nexus RWA Dashboard
```

---

## 14. Best Simple Production Flow

Use this final flow:

```text
1. Final check data and pages
2. Open all demo tabs
3. Record silent walkthrough in Loom
4. Generate Indonesian voice-over in ElevenLabs
5. Edit in CapCut
6. Add simple intro/outro text
7. Export MP4
8. Post on X and LinkedIn
9. Embed on landing page
```

This is the easiest workflow with the most professional result.

---

## 15. Public Demo Acceptance Criteria

The demo is ready to publish if it successfully communicates these five points:

1. Nexus RWA is not just an asset list.
2. Nexus RWA compares assets using a structured 12-layer model.
3. BENJI is used as the strongest flagship example.
4. BUIDL and PAXG show why evidence-based comparison matters.
5. x402 access can monetize deeper intelligence without a traditional subscription.

Final CTA:

> Compare RWA assets beyond yield — using structured data, risk scoring, and source-backed evidence.
