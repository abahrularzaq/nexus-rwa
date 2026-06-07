# Nexus RWA Public Demo Script

Date: 2026-06-07  
Status: Draft for public demo / launch content  
Primary demo asset: `franklin-benji`  
Supporting assets: `blackrock-buidl`, `paxos-paxg`, `ondo-usdy`, `ondo-ousg`

## Purpose

This document provides a practical public demo script for Nexus RWA after the x402 Pro access flow has stabilized.

Use this for:

- recorded product demo,
- live walkthrough,
- X / LinkedIn launch thread,
- investor preview,
- grant/application demo,
- landing page narrative,
- founder update post.

The goal is to show that Nexus RWA is not just an asset list. It is an evidence-based RWA intelligence layer that helps users compare tokenized real-world assets beyond surface metrics like yield or brand name.

## Core demo message

> Nexus RWA helps users compare tokenized real-world assets using structured 12-layer intelligence: identity, issuer, legal structure, reserve, compliance, blockchain, market, yield, liquidity, risk, sources, and grade.

Simpler version:

> Nexus RWA makes RWA assets easier to compare by showing not only yield, but also the evidence behind issuer quality, reserves, compliance, liquidity, risk, and source reliability.

## Recommended demo title

```text
Compare institutional RWA products beyond yield: BENJI vs BUIDL vs PAXG
```

Alternative titles:

```text
How Nexus RWA analyzes tokenized real-world assets in minutes
```

```text
From yield chasing to evidence-based RWA analysis
```

```text
A 12-layer intelligence dashboard for tokenized real-world assets
```

## Target audience

Primary:

- crypto investors,
- RWA researchers,
- DeFi analysts,
- builders looking for RWA datasets,
- AI agents or apps that need structured asset data.

Secondary:

- traditional finance people exploring tokenized funds,
- compliance-aware web3 users,
- institutional data/API users.

## Demo duration options

### Short demo

Target: 2–3 minutes

Use this for X video, short Loom, or quick landing page embed.

### Standard demo

Target: 5–7 minutes

Use this for public product walkthrough.

### Long demo

Target: 10–12 minutes

Use this for grant, investor, or partner explanation.

## Demo setup checklist

Before recording or presenting:

- [ ] Use production frontend URL.
- [ ] Use production API URL.
- [ ] Confirm `/health` is OK.
- [ ] Confirm paid wallet shows `PRO ACTIVE`.
- [ ] Confirm `/dashboard/assets/franklin-benji` loads.
- [ ] Confirm all BENJI tabs render.
- [ ] Confirm Risk & Grade tab renders.
- [ ] Confirm Sources tab renders.
- [ ] Confirm Market & Yield tab renders.
- [ ] Confirm AI insight returns 200 or fallback.
- [ ] Confirm x402 modal still works with unpaid wallet if showing checkout.
- [ ] Hide unrelated browser tabs/bookmarks if recording.

## Demo asset order

Recommended order:

1. `franklin-benji`
2. `blackrock-buidl`
3. `paxos-paxg`
4. `ondo-usdy`
5. `ondo-ousg`

Reason:

- BENJI is currently the strongest flagship-ready asset.
- BUIDL has high brand recognition but remains analytics-grade, making it useful to explain evidence-based scoring.
- PAXG shows a commodity-backed RWA model.
- USDY/OUSG show yield-bearing and treasury-style product comparisons.

Avoid leading with:

```text
tether-gold-xaut
```

Reason:

- It has current blockers: missing legal structure and missing custodian.

## Short demo script: 2–3 minutes

### Scene 1 — Hook

Say:

> Real-world assets are becoming one of the biggest narratives in crypto. But most dashboards still make users compare assets mostly by TVL, yield, or brand name.

> The problem is: yield alone is not enough. For RWA products, we also need to understand issuer quality, legal structure, reserve backing, compliance restrictions, liquidity, risk, and source reliability.

Show:

- Landing page or dashboard asset list.

### Scene 2 — Introduce Nexus RWA

Say:

> Nexus RWA is a 12-layer intelligence dashboard for tokenized real-world assets. It helps users compare RWA assets using structured data, risk scoring, and source trails.

Show:

- `/dashboard/assets`
- asset catalog.

### Scene 3 — Open BENJI

Open:

```text
/dashboard/assets/franklin-benji
```

Say:

> Let’s start with Franklin BENJI, one of the strongest assets in the current dataset.

Show:

- Overview tab.
- grade badge.
- key metrics.
- layer completeness.

Say:

> Nexus does not just show basic market data. It also evaluates whether the asset has enough evidence across issuer, reserve, compliance, liquidity, risk, and sources.

### Scene 4 — Risk & Grade

Open:

```text
Risk & Grade
```

Say:

> Here, Nexus shows a structured risk and grade view. The goal is not to tell users what to buy, but to show the quality of evidence and the main risk factors behind each asset.

Show:

- score gauge.
- grade.
- risk factors.

### Scene 5 — Sources

Open:

```text
Sources
```

Say:

> Every serious RWA dataset needs an evidence trail. Nexus tracks sources so users can understand where the data comes from and which fields are supported by official documents or reliable third-party sources.

Show:

- field/source list.

### Scene 6 — Compare with BUIDL or PAXG

Open:

```text
/dashboard/assets/blackrock-buidl
```

Say:

> Now compare that with BUIDL. BUIDL has strong brand recognition, but Nexus still evaluates it based on evidence quality, not brand name alone.

Optional:

Open:

```text
/dashboard/assets/paxos-paxg
```

Say:

> PAXG is different again because it is commodity-backed. This is where reserve and custody layers become more important.

### Scene 7 — x402 Pro access

If showing unpaid wallet:

Say:

> Public data is free, but deeper layers like full risk breakdown, source trail, history, and AI insight are gated with x402 USDC access.

Show:

- locked layer.
- paywall.

If already paid wallet:

Say:

> This wallet already has an active Pro session, so the gated layers open directly without paying again until the session expires.

Show:

- `PRO ACTIVE` badge.

### Scene 8 — Close

Say:

> Nexus RWA is building an evidence-based data layer for tokenized real-world assets, designed for investors, analysts, builders, and AI agents.

> The goal is simple: compare RWA assets beyond yield.

## Standard demo script: 5–7 minutes

### 1. Start with the market problem

Say:

> The RWA market is growing, but comparing RWA assets is still difficult. Many products look similar from the outside: they may all be called tokenized treasuries, yield products, or gold-backed tokens.

> But underneath, they can be very different. Different issuer, different legal structure, different custody, different reserve reporting, different transfer restrictions, different redemption mechanics, and different risk profile.

Show:

- landing page,
- asset catalog,
- market overview if available.

### 2. Explain the 12-layer model

Say:

> Nexus RWA breaks each asset into structured layers. Instead of only looking at TVL or APY, we look at identity, institutional structure, compliance, reserve, blockchain, market, yield, liquidity, risk, sources, and grade.

Show:

- asset detail tabs.
- layer completeness matrix.

### 3. Use BENJI as the primary example

Open:

```text
/dashboard/assets/franklin-benji
```

Say:

> BENJI is a strong example because it has a high current grade, strong source score, and good completeness. This makes it a good flagship asset for showing how Nexus works.

Show:

- Overview.
- Grade card.
- Layer completeness.

Explain:

> The grade is not just a single opinion. It is built from completeness, source quality, legal, reserve, liquidity, and risk components.

### 4. Open Issuer & Legal

Say:

> For RWA assets, issuer and legal structure matter a lot. Two assets can have similar yield, but very different legal and investor-access profiles.

Show:

- issuer fields,
- compliance fields,
- KYC/accredited restrictions if present.

### 5. Open Reserve

Say:

> Reserve and backing are critical. Nexus separates the asset’s claimed backing from verifiable evidence like custodian, reserve breakdown, reports, and proof-of-reserves if available.

Show:

- backing type,
- custodian,
- audit/report fields,
- proof-of-reserves status.

### 6. Open Market & Yield

Say:

> Market and yield data help users understand adoption and return profile, but Nexus treats them as only part of the picture.

Show:

- market metrics,
- current yield,
- history chart.

Explain:

> A higher yield does not automatically mean a better asset. It needs to be understood together with legal, reserve, liquidity, and source quality.

### 7. Open Liquidity

Say:

> Liquidity is one of the most important RWA questions. Can users redeem? How long does it take? Is liquidity issuer-based, on-chain, or secondary-market based?

Show:

- redemption type,
- redemption period,
- lockup,
- liquidity score.

### 8. Open Risk & Grade

Say:

> Risk & Grade gives a structured summary of the asset’s risk profile. This is useful for comparing assets across the same category.

Show:

- gauge,
- score,
- factors.

Important disclaimer:

> This is not investment advice. It is a structured data and evidence scoring layer.

### 9. Open Sources

Say:

> Nexus RWA is designed to be source-aware. For institutional data, knowing the source is as important as the value itself.

Show:

- field-level sources.

Say:

> This is important for AI agents too. Agents should not just receive numbers; they need structured data with evidence and reliability context.

### 10. Compare BUIDL

Open:

```text
/dashboard/assets/blackrock-buidl
```

Say:

> BUIDL is a brand-important asset, but Nexus does not automatically give perfect scores because of brand name. It still checks evidence gaps like reserve breakdown, legal documents, reports, and proof-of-reserves.

Show:

- grade,
- warnings if visible,
- reserve/legal/source tabs.

Message:

> This is the value of an evidence-based system: it can respect brand credibility while still showing data gaps.

### 11. Compare PAXG

Open:

```text
/dashboard/assets/paxos-paxg
```

Say:

> PAXG shows a different type of RWA: gold-backed tokens. Here reserve, custody, redemption, and commodity backing become more central than yield.

Show:

- reserve tab,
- liquidity tab,
- risk score.

### 12. Show x402 access

If active Pro session:

Say:

> The wallet has an active Pro session, shown here. Because the session is active, gated endpoints open directly.

Show:

- `PRO ACTIVE` badge.
- dropdown expiry.

If unpaid wallet:

Say:

> If a wallet is not active, gated endpoints return 402 Payment Required. The user can unlock access with a USDC x402 pass.

Show:

- locked paywall.
- x402 modal.

### 13. Close with product positioning

Say:

> Nexus RWA is building a structured intelligence layer for tokenized real-world assets. The goal is to help users, builders, and AI agents compare RWA products based on evidence, not hype.

## Long demo extension: 10–12 minutes

For a longer demo, add these segments:

### A. API Docs

Open:

```text
/dashboard/api-docs
```

Say:

> Nexus RWA is not only a dashboard. It is also designed as an API/data product. Public endpoints are free, while Pro and Enterprise endpoints use x402 wallet-session access.

Show:

- `/v1/assets`
- `/v1/assets/:id/full`
- `/v1/assets/:id/risk`
- `/v1/assets/:id/history`
- `/v1/session`

Explain:

> After checkout, gated API requests include `X-Wallet-Address`. If the wallet has an active session, the API returns 200. If not, it returns 402.

### B. Pricing

Open landing pricing section.

Say:

> The access model is simple: free discovery, Pro 24h for analyst-grade access, and Enterprise for API/export/agent workflows.

Show:

- Free,
- Pro,
- Enterprise.

### C. Monitoring

Open:

```text
/dashboard/monitoring
```

Say:

> Behind the scenes, Nexus also needs monitoring because RWA data changes over time. Source health, freshness, and review tasks matter for long-term credibility.

Only show if the page is safe for public/internal demo.

## Recording checklist

Before recording:

- [ ] Open browser in clean profile if possible.
- [ ] Set zoom to 90% or 100%.
- [ ] Use dark theme.
- [ ] Make sure wallet address exposure is acceptable.
- [ ] Use BENJI as first asset.
- [ ] Avoid XAUT as public flagship.
- [ ] Prepare one unpaid-wallet scene if showing paywall.
- [ ] Prepare one paid-wallet scene if showing `PRO ACTIVE`.
- [ ] Keep the demo focused on comparison, not every menu item.

## Suggested voiceover in Indonesian

### Opening

> Sekarang RWA lagi jadi salah satu narasi besar di crypto. Tapi masalahnya, kebanyakan orang masih membandingkan aset RWA hanya dari TVL, yield, atau nama besar issuer.

> Padahal untuk RWA, yield saja tidak cukup. Kita perlu tahu siapa issuer-nya, legal structure-nya seperti apa, reserve backing-nya apa, compliance-nya bagaimana, likuiditasnya seperti apa, dan sumber datanya seberapa kuat.

### Product intro

> Nexus RWA mencoba menyelesaikan masalah itu dengan pendekatan 12-layer intelligence. Jadi setiap aset RWA tidak hanya dilihat dari market data, tapi juga dari identity, institutional, compliance, reserve, blockchain, liquidity, yield, risk, sources, dan grade.

### BENJI section

> Kita mulai dari Franklin BENJI. Saat ini BENJI adalah salah satu aset paling kuat di dataset Nexus RWA, dengan grade institutional dan source score yang tinggi.

> Di sini kita bisa lihat bukan cuma angka yield atau TVL, tapi juga struktur data yang lebih lengkap: issuer, legal, compliance, reserve, liquidity, sampai risk dan source trail.

### BUIDL comparison

> Sekarang kita bandingkan dengan BUIDL dari BlackRock. Brand-nya tentu sangat kuat, tapi Nexus tetap menilai berdasarkan evidence. Jadi walaupun brand besar, kalau ada gap di reserve breakdown, audit report, atau proof-of-reserves, itu tetap dicatat.

### PAXG comparison

> Lalu kalau kita buka PAXG, ini jenis RWA yang berbeda karena backed by gold. Jadi layer reserve, custodian, redemption, dan liquidity jadi jauh lebih penting dibanding yield.

### x402 section

> Untuk akses dasar, user bisa melihat public data secara gratis. Tapi untuk layer yang lebih dalam seperti full 12-layer profile, risk breakdown, source trail, history, dan AI insight, Nexus menggunakan x402 USDC access pass.

> Kalau wallet sudah punya session aktif, user akan melihat status PRO ACTIVE dan bisa membuka layer premium tanpa bayar ulang sampai session-nya expired.

### Closing

> Jadi intinya, Nexus RWA bukan hanya daftar aset RWA. Ini adalah evidence-based intelligence layer untuk membantu investor, builder, dan AI agent membandingkan aset RWA secara lebih objektif.

> Bukan cuma melihat yield, tapi melihat evidence di balik aset tersebut.

## Suggested X thread

### Post 1

RWA is growing fast, but comparing tokenized assets is still messy.

Most dashboards show TVL, yield, and market data.

But for RWA, that is not enough.

You also need issuer, legal structure, reserve evidence, compliance, liquidity, risk, and sources.

### Post 2

That is why I am building Nexus RWA.

A 12-layer intelligence dashboard for tokenized real-world assets.

It helps compare RWA products beyond yield.

### Post 3

Each asset is structured across layers:

- Identity
- Institutional
- Compliance
- Reserve
- Blockchain
- Market
- Yield
- Liquidity
- Risk
- Sources
- Grade
- Events / narrative

### Post 4

Example: Franklin BENJI.

Instead of only asking “what is the yield?”, Nexus checks:

- issuer quality
- fund/legal structure
- reserve/backing
- liquidity terms
- source reliability
- risk score

### Post 5

Brand is not enough either.

Even with assets like BUIDL, the system still tracks evidence gaps: reserve breakdown, audit/report URLs, proof-of-reserves, legal documentation, and source confidence.

### Post 6

For gold-backed assets like PAXG, the key questions are different:

- where is the gold held?
- who is the custodian?
- is there an audit/report?
- how does redemption work?
- how liquid is the token?

### Post 7

Nexus RWA now also supports x402 USDC access passes.

Public discovery is free.

Pro unlocks deeper layers like risk breakdown, source trail, history, and AI insight.

No traditional subscription required.

### Post 8

My goal with Nexus RWA:

Build an evidence-based data layer for tokenized real-world assets.

For analysts, investors, builders, and AI agents.

Compare RWA assets beyond yield.

## Suggested LinkedIn post

Real-world assets are becoming one of the most important categories in blockchain, but comparing tokenized RWA products is still difficult.

Most dashboards focus on TVL, yield, and market data. Those are useful, but not enough.

For RWA assets, we also need to understand:

- who the issuer is,
- what the legal structure is,
- what backs the asset,
- who holds the reserve,
- what compliance restrictions apply,
- how redemption works,
- how liquid the asset is,
- what the risk factors are,
- and which sources support each claim.

That is the idea behind Nexus RWA.

Nexus RWA is a 12-layer intelligence dashboard for tokenized real-world assets. It helps users compare products like Franklin BENJI, BlackRock BUIDL, Ondo OUSG/USDY, and Paxos PAXG based on structured evidence rather than yield alone.

The platform now also supports x402 USDC access passes: public discovery is free, while deeper layers like risk breakdowns, source trails, historical data, and AI insights can be unlocked through wallet-native payment.

The goal is simple:

Make RWA asset comparison more transparent, structured, and evidence-based.

## Demo do and don't

### Do

- Lead with BENJI.
- Use BUIDL as a brand-recognition comparison.
- Use PAXG as commodity-backed comparison.
- Explain that scores are evidence-based.
- Mention that it is not investment advice.
- Show sources.
- Show Pro Active badge or x402 paywall.

### Don't

- Do not claim all assets are institutional-grade.
- Do not lead with XAUT yet.
- Do not overfocus on yield.
- Do not present scores as financial recommendations.
- Do not hide evidence gaps; use them as a strength of the product.

## Final demo CTA

Use this line at the end:

> Nexus RWA helps compare tokenized real-world assets beyond yield — using structured data, risk scoring, and source-backed evidence.
