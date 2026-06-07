# Nexus RWA Public Launch Checklist

Date: 2026-06-07  
Status: Pre-launch operational checklist  
Primary demo asset: `franklin-benji`  
Main demo narrative: Compare RWA assets beyond yield

## Purpose

This checklist prepares Nexus RWA for a public demo or soft launch after the x402 Pro access flow has stabilized.

Use it before publishing:

- X thread,
- LinkedIn post,
- product demo video,
- Loom demo,
- grant/application demo,
- investor preview,
- community post.

The goal is to avoid launching with broken links, confusing paywall behavior, weak demo flow, or incomplete messaging.

## Launch positioning

Use this positioning:

> Nexus RWA helps compare tokenized real-world assets beyond yield using structured data, risk scoring, and source-backed evidence.

Avoid saying:

```text
All Nexus RWA assets are institutional-grade.
```

Use instead:

```text
Nexus RWA classifies assets as institutional, analytics, or research grade based on evidence quality.
```

## Pre-launch technical checklist

### Deploy status

- [ ] Latest `main` is deployed to Vercel.
- [ ] Latest API is deployed to Railway.
- [ ] Vercel deployment has no build error.
- [ ] Railway deployment has no startup error.
- [ ] API `/health` returns OK.
- [ ] Database connection is healthy.
- [ ] x402 env vars are present.
- [ ] Redis is not required for session access.

### Critical pages

Open and verify:

- [ ] `/`
- [ ] `/dashboard`
- [ ] `/dashboard/assets`
- [ ] `/dashboard/assets/franklin-benji`
- [ ] `/dashboard/assets/blackrock-buidl`
- [ ] `/dashboard/assets/paxos-paxg`
- [ ] `/dashboard/api-docs`
- [ ] `/dashboard/monitoring` if showing internal/admin flow

### Landing page

- [ ] Hero section loads.
- [ ] Asset preview loads.
- [ ] x402 section loads.
- [ ] Pricing section loads.
- [ ] Use cases load.
- [ ] API reference preview loads.
- [ ] Footer links are not broken.

### Pricing CTA

- [ ] `Start Free` opens `/dashboard/assets`.
- [ ] `Unlock Pro` opens `/dashboard/assets/franklin-benji`.
- [ ] `Start API Access` opens `/dashboard/api-docs`.

### Wallet/session UI

- [ ] Wallet connect button appears.
- [ ] Connected wallet shows compact address.
- [ ] Active Pro wallet shows `PRO ACTIVE`.
- [ ] Expiry is visible on desktop.
- [ ] Mobile badge remains compact.
- [ ] Dropdown shows wallet, session status, expiry, refresh session, API docs.

## x402 flow checklist

### Paid wallet

- [ ] Paid wallet still has active Pro session.
- [ ] `/v1/session?wallet=...` returns `active: true`.
- [ ] `/full` returns 200.
- [ ] `/risk` returns 200.
- [ ] `/history` returns 200.
- [ ] `/insight` returns 200 or fallback 200.
- [ ] Refreshing browser does not lose access.

### Unpaid wallet

- [ ] Unpaid wallet sees paywall for gated layers.
- [ ] Gated endpoint returns 402.
- [ ] Paywall modal opens.
- [ ] Payment amount and token are correct.
- [ ] User can complete checkout if you choose to demo payment live.

### Do not demo live payment unless necessary

For public video, safest option:

- show locked state with unpaid wallet,
- then switch to paid wallet showing `PRO ACTIVE`,
- avoid spending USDC repeatedly during recording.

## Flagship asset checklist

### Primary asset: `franklin-benji`

- [ ] Overview tab loads.
- [ ] Grade is visible.
- [ ] Risk level is visible.
- [ ] Layer completeness is visible.
- [ ] Issuer & Legal tab loads.
- [ ] Reserve tab loads.
- [ ] Market & Yield tab loads.
- [ ] Liquidity tab loads.
- [ ] Blockchain tab loads.
- [ ] Risk & Grade tab loads.
- [ ] Sources tab loads.
- [ ] AI Insight card loads or fallback works.

### Supporting asset: `blackrock-buidl`

- [ ] Overview loads.
- [ ] Risk & Grade loads.
- [ ] Reserve/legal/source gaps are explainable.
- [ ] Do not call it institutional-grade if current grade is analytics.

### Supporting asset: `paxos-paxg`

- [ ] Overview loads.
- [ ] Reserve tab is useful for gold-backed explanation.
- [ ] Liquidity/risk tab does not crash.
- [ ] Position as commodity-backed comparison.

### Avoid leading with `tether-gold-xaut`

- [ ] Do not use XAUT as first public demo asset.
- [ ] If mentioned, describe it as research/backlog due to legal/custody evidence gaps.

## Demo recording checklist

### Browser setup

- [ ] Use clean browser window.
- [ ] Close unnecessary tabs.
- [ ] Hide bookmarks bar if distracting.
- [ ] Set zoom to 90% or 100%.
- [ ] Use stable internet connection.
- [ ] Turn off desktop notifications.
- [ ] Make sure wallet popups will not expose sensitive info.

### Recording setup

- [ ] Mic works.
- [ ] Screen resolution is readable.
- [ ] Cursor is visible.
- [ ] Test 10-second recording first.
- [ ] Keep first demo under 7 minutes if possible.
- [ ] Prepare backup screenshots in case live UI becomes slow.

### Demo flow

Use this sequence:

```text
Landing page
→ Pricing section
→ Unlock Pro CTA
→ franklin-benji overview
→ Risk & Grade
→ Sources
→ blackrock-buidl comparison
→ paxos-paxg comparison
→ x402 Pro Active badge / paywall
→ API docs
→ closing CTA
```

### Speaking points

Must mention:

- [ ] RWA comparison is not only about yield.
- [ ] Nexus uses structured 12-layer intelligence.
- [ ] Source-backed evidence matters.
- [ ] Grades are evidence-based classifications.
- [ ] x402 enables wallet-native USDC access.
- [ ] Not investment advice.

Avoid:

- [ ] Promising investment returns.
- [ ] Saying all assets are institutional-grade.
- [ ] Overclaiming AI accuracy.
- [ ] Hiding known data gaps.
- [ ] Leading with incomplete assets.

## Public content checklist

### X thread

Before posting:

- [ ] Thread has a strong hook.
- [ ] First post explains the problem.
- [ ] Middle posts explain 12-layer model.
- [ ] Include screenshot or video.
- [ ] Mention x402 only after explaining value.
- [ ] End with clear CTA.
- [ ] Avoid excessive technical jargon.

Suggested CTA:

```text
Try the demo and compare RWA assets beyond yield.
```

### LinkedIn post

Before posting:

- [ ] Tone is more professional than X.
- [ ] Explain RWA data problem clearly.
- [ ] Mention structured evidence.
- [ ] Mention wallet-native access pass only as product detail.
- [ ] Avoid hype terms without explanation.
- [ ] Add image/video.

### Video/Loom description

Include:

```text
Nexus RWA is a 12-layer intelligence dashboard for tokenized real-world assets.
This demo compares BENJI, BUIDL, and PAXG beyond yield using grade, risk, sources, reserve, compliance, and liquidity layers.
```

## Assets/screenshots to prepare

Recommended screenshots:

- [ ] Landing hero.
- [ ] Pricing cards.
- [ ] BENJI overview.
- [ ] BENJI Risk & Grade.
- [ ] BENJI Sources.
- [ ] BUIDL overview or grade.
- [ ] PAXG reserve tab.
- [ ] PRO ACTIVE badge.
- [ ] API docs `/session` or `/full` endpoint.

Recommended video segments:

- [ ] 5-second landing scroll.
- [ ] 10-second pricing CTA click.
- [ ] 20-second BENJI overview.
- [ ] 20-second Risk & Grade.
- [ ] 20-second Sources.
- [ ] 10-second x402 paywall or Pro badge.

## Soft launch checklist

Soft launch means sharing with a small audience first.

Target audience:

- [ ] trusted builders,
- [ ] crypto/RWA friends,
- [ ] small X audience,
- [ ] potential testers,
- [ ] AI/data builders.

Ask them to test:

- [ ] Can they understand what Nexus RWA does within 30 seconds?
- [ ] Do they understand Free vs Pro?
- [ ] Do they understand why source trail matters?
- [ ] Does the dashboard feel credible?
- [ ] Did any route break?
- [ ] Did paywall flow confuse them?

Questions to ask:

```text
1. What do you think Nexus RWA does?
2. Which part feels most valuable?
3. Which part feels confusing?
4. Would you use this for RWA research?
5. What asset would you want added next?
6. Does the pricing model make sense?
```

## Post-launch monitoring checklist

After posting:

- [ ] Check landing page still loads.
- [ ] Check dashboard still loads.
- [ ] Check API logs for errors.
- [ ] Check Railway logs for 500s.
- [ ] Check Vercel logs for frontend errors.
- [ ] Check `/session` calls.
- [ ] Check 402 vs 200 behavior.
- [ ] Check if any users get stuck at wallet connect.
- [ ] Save user feedback.
- [ ] Create issues for bugs.

## Bug triage labels

Suggested labels if creating GitHub issues:

```text
bug
x402
frontend
api
data-quality
demo-blocker
launch-feedback
```

Severity guide:

### P0 demo blocker

- landing page down,
- dashboard down,
- asset detail crashes,
- payment succeeds but Pro not active,
- all gated endpoints return 402 for paid wallet.

### P1 important

- one tab crashes,
- API docs mismatch,
- source tab empty for flagship asset,
- Pro badge missing but endpoints work.

### P2 polish

- copy unclear,
- alignment issue,
- slow chart,
- weak empty state,
- missing helper text.

## Launch-ready criteria

Nexus RWA is ready for public soft launch if:

- [ ] Landing page works.
- [ ] Pricing CTA works.
- [ ] BENJI demo flow works.
- [ ] Pro wallet shows `PRO ACTIVE`.
- [ ] Gated layers open for active wallet.
- [ ] Free wallet sees paywall safely.
- [ ] API docs match live behavior.
- [ ] Demo script is prepared.
- [ ] Screenshots/video are ready.
- [ ] Known limitations are understood.

## Final public CTA

Use one of these:

```text
Compare RWA assets beyond yield.
```

```text
Explore source-backed RWA intelligence.
```

```text
Unlock deeper RWA layers with wallet-native USDC access.
```

## Final reminder

Do not position Nexus RWA as a finished institutional data terminal yet.

Position it as:

```text
an early but working evidence-based RWA intelligence layer
```

That is more honest, more credible, and easier to defend while the dataset continues to improve.
