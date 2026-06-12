# Nexus AI Insight Pro Feature Guide

## Purpose

Nexus AI Insight is the interpretation layer for Nexus RWA.

The goal is not to build a generic chatbot. The goal is to turn the existing normalized RWA dataset into clear, evidence-based analyst notes that help users understand:

- what an asset is,
- why it matters,
- what the main strengths are,
- what the main risks are,
- which evidence is missing,
- and whether the asset is suitable for a certain user profile.

This feature should become part of the Pro experience because it adds analytical interpretation on top of raw asset data.

---

## Product Positioning

Nexus RWA should separate raw data from intelligence.

Free users can access basic market and asset data. Pro users unlock interpretation, narrative, and decision-support context.

```text
Raw data tells users what exists.
AI Insight tells users what it means.
```

Nexus AI Insight should feel like an institutional research assistant, not a casual AI chat feature.

---

## Access Model

### Free Access

Free users may access:

- dashboard overview,
- basic asset list,
- basic asset detail,
- limited market metrics,
- short preview of daily narrative,
- basic grade display.

### Pro Access

Pro users unlock:

- full Daily Market Narrative,
- Asset AI Insight per asset,
- key strengths,
- key risks,
- investor fit,
- data confidence,
- missing evidence,
- watchlist reasons,
- deeper risk interpretation,
- future compare insight.

### Enterprise Access

Enterprise can later unlock:

- API access to insight output,
- bulk export,
- portfolio-level insight,
- custom risk templates,
- team workflows,
- white-label intelligence feed.

---

## Feature Structure

Nexus AI Insight should be developed in three layers.

```text
Nexus AI Insight
├─ Dashboard Insight
│  └─ Daily Market Narrative
│     ├─ Market condition
│     ├─ TVL movement
│     ├─ Yield movement
│     ├─ Holder movement
│     ├─ Risk tone
│     └─ Watchlist
│
├─ Asset Insight
│  └─ Per asset detail
│     ├─ What this asset is
│     ├─ Why it matters
│     ├─ Key strengths
│     ├─ Key risks
│     ├─ Investor fit
│     ├─ Data confidence
│     └─ Missing evidence
│
└─ Compare Insight
   └─ Asset vs asset explanation
      ├─ Structure comparison
      ├─ Backing comparison
      ├─ Legal/compliance comparison
      ├─ Liquidity comparison
      ├─ Risk comparison
      └─ Best-fit context
```

---

## Phase 1 — Daily Market Narrative Upgrade

The current Daily Narrative should become the first visible part of Nexus AI Insight.

Recommended UI label:

```text
Nexus AI Insight
Daily Market Narrative
```

Alternative label:

```text
AI Market Brief
Generated from Nexus RWA dataset
```

### Required Sections

```text
Market Interpretation
Key Driver
What Changed
Watchlist
Risk Tone
Generated Timestamp
```

### Example Output

```text
Market Interpretation:
The tracked RWA market remains stable, with TVL still concentrated in institutional treasury-style products. Average yield remains elevated, but the headline figure should be read carefully because higher-yielding credit and protocol-linked assets may pull the average upward.

Key Driver:
The main driver today is yield dispersion across tracked assets, while total TVL remains broadly stable.

What Changed:
BENJI leads 7d yield movement, while selected higher-risk assets remain under watch.

Watch:
GFI remains on watch due to weaker risk tone and score distribution.
```

### Free Preview Behavior

Free users should see a short teaser only.

Example:

```text
The RWA market remains stable across tracked assets.

Unlock Pro to view:
- key market driver,
- watchlist reason,
- risk interpretation,
- asset-level AI Insight.
```

---

## Phase 2 — Asset AI Insight

Asset AI Insight should live on the asset detail page.

It should summarize the asset based only on existing Nexus RWA data layers.

### Recommended File

Each asset may include:

```text
data/assets/{asset-slug}/ai-insight.json
```

### Initial JSON Schema

```json
{
  "summary": "",
  "whatThisAssetIs": "",
  "whyItMatters": "",
  "keyStrengths": [],
  "keyRisks": [],
  "investorFit": "",
  "dataConfidence": "medium",
  "missingEvidence": [],
  "watchReason": null,
  "accessTier": "pro",
  "generatedFrom": [
    "identity.json",
    "reserve.json",
    "institutional.json",
    "compliance.json",
    "liquidity.json",
    "risk.json",
    "grade-baseline.json",
    "sources.json"
  ],
  "lastUpdated": "YYYY-MM-DD"
}
```

### Allowed `dataConfidence` Values

```text
high
medium
low
```

### Confidence Rules

Use `high` only when:

- core fields are complete,
- official sources are present,
- no major blockers exist,
- legal and reserve evidence are strong,
- `sources.json` covers key fields.

Use `medium` when:

- asset identity and backing are reasonably clear,
- some fields are missing,
- warnings exist but no severe blockers exist.

Use `low` when:

- multiple core fields are missing,
- sources are weak,
- legal or reserve evidence is incomplete,
- blockers exist,
- important claims cannot be verified.

---

## Phase 3 — Compare Insight

Compare Insight should be added after Asset AI Insight is stable.

Example user-facing output:

```text
Compared with BENJI, bC3M offers different jurisdictional and issuer exposure. BENJI benefits from Franklin Templeton's regulated fund structure, while bC3M depends on Backed Finance's issuance, collateral, and redemption framework. BENJI may be more suitable for users prioritizing institutional fund structure, while bC3M may appeal to users looking for tokenized European bond exposure.
```

Compare Insight should never declare one asset as universally better. It should explain fit, trade-offs, and evidence quality.

---

## Data Sources

AI Insight must be generated only from Nexus RWA internal asset layers:

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
grade-baseline.json
```

The system may also use generated market brief data for dashboard-level insight.

External information should not be introduced directly into AI Insight unless it has first been added to the relevant asset layer and cited in `sources.json`.

---

## Anti-Hallucination Rules

Nexus AI Insight must follow strict rules.

1. Do not invent missing data.
2. Do not claim proof-of-reserves unless `reserve.hasProofOfReserves` is explicitly true.
3. Do not claim an audit exists unless `reserve.lastAuditUrl` or equivalent evidence exists.
4. Do not claim regulatory approval unless compliance data explicitly supports it.
5. Do not describe an asset as low-risk unless risk scores and evidence support that framing.
6. Do not hide missing evidence.
7. Do not convert warnings into positive language.
8. Do not use promotional wording such as "best", "safest", "guaranteed", or "risk-free".
9. Do not provide financial advice.
10. Always frame the output as data-driven analysis, not investment recommendation.

Recommended disclaimer:

```text
This insight is generated from Nexus RWA asset data and is not financial advice.
```

---

## Tone and Writing Style

Nexus AI Insight should be:

- concise,
- analytical,
- neutral,
- evidence-aware,
- easy to understand,
- not promotional,
- not overly technical.

Avoid:

- hype language,
- vague AI wording,
- generic explanations,
- long paragraphs,
- claims without evidence.

Preferred tone:

```text
This asset appears to...
The available data suggests...
The main risk to watch is...
The evidence is currently incomplete for...
```

Avoid:

```text
This is the best RWA asset...
This asset is safe...
Investors should buy...
Guaranteed yield...
Fully risk-free...
```

---

## UI Placement

### Dashboard

Place Daily Market Narrative in the dashboard overview.

Recommended card title:

```text
Nexus AI Insight
Daily Market Narrative
```

### Asset Detail Page

Place Asset AI Insight near the top of the asset detail page, after identity/grade summary and before detailed layers.

Recommended sections:

```text
Summary
Key Strengths
Key Risks
Investor Fit
Data Confidence
Missing Evidence
```

### Screener

For Pro users, later add small AI-generated badges:

```text
Strong legal structure
Watch liquidity
Missing PoR
Institutional-grade evidence
High yield dispersion
```

### Compare Page

For Pro users, later add:

```text
AI Compare Insight
```

---

## Paywall Behavior

If the user does not have Pro access, show a preview card.

Example:

```text
Nexus AI Insight is available for Pro users.

Preview:
This asset provides tokenized exposure to a real-world financial instrument.

Unlock Pro to view:
- strengths,
- risks,
- investor fit,
- data confidence,
- missing evidence.
```

The paywall should use the existing Pro tier flow.

Recommended required tier:

```text
pro
```

---

## Implementation Roadmap

### Step 1 — Documentation

Create this guide as the reference document for the feature.

### Step 2 — Static Asset Insight

Add `ai-insight.json` manually to 2–3 selected assets first.

Recommended initial assets:

```text
franklin-benji
ondo-ousg
superstate-ustb
```

### Step 3 — Frontend Reader

Update local asset reader so asset detail can read:

```text
ai-insight.json
```

### Step 4 — Asset AI Insight Card

Create component:

```text
web/src/components/assets/AssetAiInsightCard.tsx
```

### Step 5 — Pro Gate

Use existing access/paywall logic to gate the full card behind Pro.

### Step 6 — Daily Narrative Upgrade

Rename and expand current Daily Narrative into Nexus AI Insight / Daily Market Narrative.

### Step 7 — Generator Script

Create a script to generate `ai-insight.json` from asset layers.

Recommended path:

```text
api/src/scripts/generate-ai-insight.ts
```

### Step 8 — LLM-Assisted Generation

Only after the template version is stable, allow LLM-assisted rewriting.

The LLM must only receive normalized asset JSON and should not browse or introduce new facts.

---

## Suggested Generator Logic

The first generator does not need an external AI model.

It can use deterministic template logic.

Input:

```text
identity.json
reserve.json
institutional.json
compliance.json
liquidity.json
risk.json
grade-baseline.json
sources.json
```

Output:

```text
ai-insight.json
```

Basic logic:

- If `reserve.backingType` exists, describe backing.
- If `institutional.issuerName` exists, identify issuer.
- If `compliance.kycRequired` is true, mention permissioned access.
- If `liquidity.redemptionPeriodDays` exists, explain redemption timeline.
- If `grade-baseline.warnings` exists, convert important warnings into missing evidence.
- If `grade-baseline.blockers` exists, lower confidence.
- If `risk.overallScore` is low, strengthen risk warning.
- If source coverage is strong, increase confidence.

---

## Example Asset AI Insight

```json
{
  "summary": "BENJI is a tokenized representation of a regulated money market fund structure associated with Franklin Templeton. It appears suitable for users seeking institutional-style treasury exposure, but access and transferability may depend on compliance restrictions.",
  "whatThisAssetIs": "BENJI represents tokenized exposure to a real-world fund structure backed by traditional financial instruments.",
  "whyItMatters": "It is an example of a large traditional asset manager using blockchain infrastructure for regulated fund access and recordkeeping.",
  "keyStrengths": [
    "Recognizable institutional issuer",
    "Clear fund-style legal structure",
    "Strong source coverage across core fields"
  ],
  "keyRisks": [
    "Access may be restricted by investor eligibility and jurisdiction",
    "Redemption depends on issuer and fund process",
    "On-chain proof-of-reserves is not confirmed unless explicitly documented"
  ],
  "investorFit": "Best suited for users researching institutional-grade tokenized treasury or money market exposure, not users seeking fully permissionless DeFi assets.",
  "dataConfidence": "high",
  "missingEvidence": [
    "Public legal opinion URL may still need confirmation",
    "On-chain proof-of-reserves is not confirmed"
  ],
  "watchReason": null,
  "accessTier": "pro",
  "generatedFrom": [
    "identity.json",
    "reserve.json",
    "institutional.json",
    "compliance.json",
    "liquidity.json",
    "risk.json",
    "grade-baseline.json",
    "sources.json"
  ],
  "lastUpdated": "2026-06-12"
}
```

---

## Success Criteria

The feature is successful if users can quickly answer:

```text
What is this asset?
Why does it matter?
What are the key risks?
What evidence supports the claims?
What evidence is missing?
Is this asset more suitable for institutional, analytical, or research-level users?
```

The feature should make Nexus RWA feel less like a static database and more like an intelligence terminal.

---

## Development Priority

Recommended build order:

1. Add this documentation.
2. Add static `ai-insight.json` schema to selected assets.
3. Add frontend card for asset detail.
4. Gate full insight behind Pro.
5. Upgrade Daily Narrative label and content.
6. Add deterministic generator script.
7. Add compare insight.
8. Add LLM-assisted rewriting only after the data flow is stable.

---

## Final Product Principle

Nexus AI Insight should not replace the underlying dataset.

It should sit on top of the dataset as a clear, evidence-aware explanation layer.

```text
Dataset first.
Sources always.
Insight second.
No unsupported claims.
```
