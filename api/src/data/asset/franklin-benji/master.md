# Franklin OnChain U.S. Government Money Fund (BENJI)
> **Status:** ✅ Complete — all layers populated

## TL;DR
BENJI is the tokenized share of FOBXX, a SEC-registered U.S. government money market fund issued by Franklin Templeton. With an onchain marketcap of $794.16M, a risk rating of 77/100 (LOW), and direct USD redemption at $1.00 NAV, it is one of the lowest-risk RWA tokens available — suited for both retail and institutional investors seeking yield-bearing Treasury exposure through a regulated, permissioned token deployed across 9 blockchains.

---

## Layer Index

| Layer | Status | Last Updated | Reliability |
|-------|--------|--------------|-------------|
| Identity | ✅ done | 2026-05-31 | 82 |
| Reserve | ✅ done | 2026-05-31 | 58 |
| Market | 🔄 auto-sync | — | 62 via DeFi Llama |
| Legal | ✅ done | 2026-05-31 | 75 |
| Risk | ✅ done | 2026-05-31 | 50 |
| Scoring | ✅ done | 2026-05-31 | ai-assisted |
| AI Narrative | ⏳ pending | — | generate after 7 days of market data |

---

## Key Facts

| Metric | Value |
|--------|-------|
| Category | Treasury |
| Issuer | Franklin Templeton Trust |
| Issuer Country | US |
| Legal Structure | Registered Investment Company (Series Fund, FL) |
| Custodian | null |
| Min. Investment | null |
| Redemption Period | null |
| Primary Regulator | SEC |
| KYC Required | true |
| Accredited Only | false |
| Risk Score | 77 — LOW |

---

## Analyst Summary

BENJI occupies a distinct position in the RWA token landscape as the world's first U.S.-registered money market fund deployed onchain. It competes most directly with BlackRock's BUIDL (tokenized Treasury fund, institutional-only, Ethereum-native), Ondo's USDY (Treasury-backed yield token, Reg S exempt, not SEC-registered), and Circle's USDC yield products (synthetic yield, not a direct fund). BENJI's differentiator is the combination of SEC registration under the Investment Company Act of 1940, retail accessibility on Stellar, and the institutional credibility of Franklin Templeton — a global asset manager managing over $1.5T in AUM and publicly traded on NYSE under ticker BEN.

The fund's strengths are anchored in its regulatory framework and issuer profile. Rule 2a-7 classification mandates at least 99.5% allocation to U.S. government securities, 60-day weighted average maturity limits, and daily/weekly liquidity minimums — structural protections that eliminate the types of reserve quality failures seen in unregulated RWA products. The onchain marketcap of $794.16M reflects meaningful institutional adoption. Smart contracts have been audited by two independent firms (Trail of Bits and Ancilia), and the fund is deployed across 9 chains (Stellar, Polygon, Arbitrum, Avalanche, Aptos, Ethereum, Base, Solana, Canton), providing operational redundancy. KYC/AML is required for all token operations — minting, redeeming, transferring, and holding — reducing illicit finance and regulatory enforcement risk.

Several data gaps warrant investor attention. The fund has no onchain proof-of-reserves mechanism; reserve verification depends entirely on SEC regulatory filings (N-MFP2), not real-time blockchain attestation. The custodian bank holding the underlying government securities is not disclosed in any available source, creating a gap in counterparty chain transparency. The specific portfolio composition (Treasury bills vs. agency securities vs. repurchase agreements) could not be verified from the five primary sources. Smart contract audit dates are not published, preventing assessment of audit recency across 9 separate chain deployments. The fund's management fee, minimum investment, and prospectus URL remain unavailable — the Franklin Templeton product page returned only cookie consent content, blocking access to offering details. SEC EDGAR flags the trust entity (CIK 0001786958) as having its Exchange Act registration revoked and Municipal Advisor registration revoked and cancelled, though the Investment Company Act registration governing the fund remains separately active.

TVL growth has been substantial — the onchain marketcap of $794.16M places BENJI among the largest tokenized Treasury products by AUM. However, DeFi Active TVL is reported as $0, indicating the fund operates primarily through issuer redemption rather than secondary DEX markets, limiting composability for DeFi-native use cases. The regulatory environment for tokenized securities in the U.S. remains supportive under SEC registration frameworks, though cross-chain expansion to permissionless environments may create jurisdictional grey areas for non-U.S. holders. Current yield data is not available from any of the five primary sources; investors should consult the fund's latest SEC filings or Franklin Templeton's fund page for current rates. Future data improvements — particularly identification of the custodian, publication of reserve breakdowns, and access to the prospectus — would meaningfully improve the completeness and reliability of this asset profile.

---

## Change Log

| Date | Layer | Change | Author |
|------|-------|--------|--------|
| 2026-05-31 | All | Initial creation | AI-assisted |