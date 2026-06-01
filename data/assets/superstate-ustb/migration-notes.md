# Superstate USTB Migration Notes

## Status

Pilot migration status: `analytics-grade baseline`

This asset has been migrated from legacy research files into the normalized production dataset under:

```text
data/assets/superstate-ustb/
```

## Cross-check source availability

Expected legacy master file:

```text
api/src/data/asset/superstate-ustb/master.md
```

Status: `not found in remote repository at migration time`.

Because `master.md` was unavailable, this cross-check was performed against the available legacy files:

```text
identity.md
metadata.json
sources.yaml
reserve.md
legal.md
risk.md
scoring.json
```

## Migrated normalized files

The following normalized files have been created or updated:

```text
identity.json
blockchain.json
sources.json
reserve.json
yield.json
liquidity.json
institutional.json
compliance.json
risk.json
```

## Field coverage summary

### Identity

Status: `complete for analytics-grade`

Migrated fields:

```text
name
symbol
fullName
description
category
subcategory
websiteUrl
docsUrl
twitterUrl
tags
launchDate
isin
```

Known gap:

```text
logoUrl = null
```

Reason: no verified logo URL was present in the legacy identity layer.

### Blockchain

Status: `complete for analytics-grade`

Migrated chains:

```text
ethereum
solana
plume
```

Known gaps:

```text
ethereum.deployedAt = null
solana.chainId = null
solana.deployedAt = null
plume.deployedAt = null
```

Reason: deployment dates were not verified in legacy metadata. Solana does not use an EVM-style numeric chain ID in the same way.

### Reserve

Status: `partial; not institutional-grade`

Migrated fields:

```text
backingType
backingDescription
custodian
custodianUrl
hasProofOfReserves
auditor
redemptionAsset
```

Known gaps:

```text
collateralizationRatio = null
porOracleAddress = null
porOracleChain = null
lastAuditDate = null
lastAuditUrl = null
reserveBreakdown = null
```

Reason: no verified collateralization ratio, proof-of-reserves oracle, public audit URL, audit date, or normalized 100% reserve breakdown was available in legacy reserve data.

### Institutional

Status: `complete for analytics-grade`

Migrated fields:

```text
issuerName
issuerType
issuerCountry
fundManager
legalStructure
minimumInvestment
managementFee
performanceFee
targetInvestors
metadata.qualifiedPurchaserOnly
```

Known gaps:

```text
fundAdmin = null
transferAgent = null
prospectuUrl = null
```

Reason: no verified normalized values were migrated for these fields. Note: schema currently uses `prospectuUrl`, preserving the existing Prisma field name.

### Compliance

Status: `strong for analytics-grade`

Migrated fields:

```text
regulatoryStatus
primaryRegulator
regulatoryFramework
kycRequired
accreditedOnly
allowedJurisdictions
sanctionsScreening
amlPolicy
lastComplianceCheck
```

Known gaps:

```text
blockedJurisdictions = []
legalOpinionUrl = null
```

Reason: legacy legal layer did not provide an official blocked-jurisdiction ISO list or public legal opinion URL.

### Risk

Status: `complete for analytics-grade`

Migrated fields:

```text
overallScore
overallLevel
smartContractRisk
counterpartyRisk
liquidityRisk
regulatoryRisk
marketRisk
concentrationRisk
riskFactors
mitigants
lastAssessed
assessmentMethod
```

Known limitation:

```text
risk scoring is ai-assisted and should receive manual reviewer sign-off before institutional-grade use
```

### Market

Status: `not yet normalized`

Known gaps:

```text
tvl
tvl7dChange
tvl30dChange
price
priceChange24h
marketCap
volume24h
circulatingSupply
totalSupply
holderCount
holderChange7d
aumUsd
lastUpdated
sources
confidence
```

Reason: market data is time-sensitive and should be populated from fresh DeFiLlama, RWA.xyz, CoinGecko, or explorer data rather than assumed from stale notes.

### Yield

Status: `partial; time-sensitive`

Migrated fields:

```text
currentYield
yieldType
yieldFrequency
yieldBenchmark
yieldCurrency
```

Known gaps:

```text
yieldVsBenchmark = null
yieldAvg7d = null
yieldAvg30d = null
yieldAvg90d = null
yieldMin52w = null
yieldMax52w = null
yieldStdDev30d = null
nextYieldDate = null
```

Reason: yield metrics are time-sensitive and should be refreshed before production publication.

### Liquidity

Status: `complete for analytics-grade; not institutional-grade`

Migrated fields:

```text
redemptionType
redemptionPeriodDays
dexPairs
liquidityScore
liquidityNotes
```

Known gaps:

```text
lockupPeriodDays = null
earlyRedemptionFee = null
minRedemptionAmount = null
onchainLiquidity = null
bidAskSpread = null
```

Reason: legacy metadata did not provide verified lockup, fee, minimum redemption, on-chain liquidity, or bid/ask spread values.

## Source conflicts

### Custodian conflict

Legacy reserve and risk layers noted a conflict between official Superstate sources:

```text
The Bank of New York Mellon
UMB Bank, N.A.
```

Resolution used for normalized data:

```text
custodian = The Bank of New York Mellon
```

Reason: the current USTB asset page was treated as the higher-specificity source for the USTB asset-level custodian field.

Action required before institutional grade:

```text
Manually re-verify current custodian from the latest official Superstate asset page, security docs, and any fund filings.
```

## Current grade baseline

Latest local import result reported by operator:

```text
grade = analytics
score = 67
completenessScore = 89
sourceScore = 57
legalScore = 85
reserveScore = 65
liquidityScore = 74
riskScore = 0 before risk score migration
```

After migrating numeric risk scores from `scoring.json`, expected riskScore should no longer be 0 after re-import.

## Remaining institutional blockers

The following warnings are considered valid and should remain until verified sources are added:

```text
Missing legal opinion or legal document URL
Missing reserve breakdown
No proof-of-reserves confirmed
Missing audit/report URL
Missing on-chain liquidity
```

## Next actions

1. Populate `market.json` using verified, current market sources.
2. Re-run import and record updated baseline score after numeric risk migration.
3. Verify whether a public audit/report URL exists.
4. Verify whether official holdings can be normalized into `reserveBreakdown` without inference.
5. Verify whether any proof-of-reserves or oracle mechanism exists.
6. Verify whether public legal documents or legal opinion URLs exist.
7. Re-check custodian conflict before any institutional-grade claim.

## Migration decision

Do not promote Superstate USTB to `institutional` grade until reserve auditability, proof-of-reserves, reserve breakdown, legal document coverage, and on-chain liquidity evidence are materially improved.
