# Ondo Short-Term US Government Treasuries (OUSG)
> **Status:** ✅ Complete — all layers populated

## TL;DR
OUSG is a tokenized U.S. Treasury fund issued by Ondo Finance, providing on-chain exposure to short-duration government securities and institutional money market instruments across Ethereum, Solana, Polygon, and XRP Ledger. Current yield tracks short-term U.S. Treasury rates (real-time figure not disclosed); risk is rated **Medium** (score 69.25/100). Suitable for accredited and institutional investors only, with a $100,000 minimum investment and mandatory KYC/AML onboarding.

---

## Layer Index

| Layer | Status | Last Updated | Reliability |
|-------|--------|--------------|-------------|
| Identity | ✅ done | 2026-05-31 | 92 |
| Reserve | ✅ done | 2026-05-31 | 84 |
| Market | 🔄 auto-sync | — | via DeFi Llama |
| Legal | ✅ done | 2026-05-31 | 81 |
| Risk | ✅ done | 2026-05-31 | 74 |
| Scoring | ✅ done | 2026-05-31 | ai-assisted |
| AI Narrative | ⏳ pending | — | generate after 7 days of market data |

---

## Key Facts

| Metric | Value |
|--------|-------|
| Category | Treasury — Tokenized US Treasury Fund |
| Issuer | Ondo I LP |
| Issuer Country | United States |
| Legal Structure | Delaware Limited Partnership |
| Custodian | Ankura Trust Company, LLC |
| Min. Investment | $100,000 |
| Redemption Period | T+1 |
| Primary Regulator | SEC |
| KYC Required | Yes |
| Accredited Only | Yes |
| Risk Score | 69.25 — MEDIUM |

---

## Analyst Summary

**Positioning.** OUSG occupies the institutional tier of the tokenized U.S. Treasury market alongside products such as Hashnote USYC, Superstate USTB, and Franklin Templeton's BENJI. Its primary differentiators are multi-chain deployment across four major networks (Ethereum, Solana, Polygon, XRP Ledger), an instant-redemption infrastructure integrated with stablecoin liquidity rails, and a reserve portfolio composed entirely of regulated, institutional-grade money market and treasury fund vehicles from recognized asset managers. The product is positioned explicitly for crypto-native institutions, DAOs, and qualified investors seeking on-chain access to sovereign-backed yield, rather than retail or general-purpose stablecoin use cases.

**Strengths.** The reserve portfolio consists entirely of short-duration U.S. government-backed instruments, representing the lowest credit-risk asset class available globally. The portfolio is distributed across five regulated fund managers — BlackRock (BUIDL), WisdomTree (WTGXX), Franklin Templeton (BENJI), Fundbridge (FBOXX), and Superstate (USTB) — providing some structural diversification at the fund-manager level. Ankura Trust Company, LLC serves as independent custodian, creating legal separation between issuer and investor assets. The T+1 redemption period and explicitly documented instant-redemption infrastructure place OUSG's liquidity profile above many tokenized treasury peers, reflected in a liquidity sub-score of 80 and a liquidity score of 78 from metadata.

**Risks.** The most material structural risk is reserve concentration: BlackRock BUIDL represents 82.57% of the disclosed reserve portfolio, creating a single-counterparty dependency that would disproportionately affect redemptions under any stress scenario affecting BUIDL specifically. Transparency limitations compound this: `hasProofOfReserves` is false, no on-chain proof-of-reserves oracle is disclosed, no independent reserve auditor is identified, and the collateralization ratio is not publicly stated — meaning reserve verification depends on issuer disclosures and third-party aggregators such as rwa.xyz rather than cryptographic attestation. Additionally, OUSG operates under a Reg D exemption rather than full SEC registration, which restricts eligible investors, limits secondary market liquidity, and exposes the product to evolving regulatory treatment of tokenized securities across its four deployed blockchain ecosystems.

**Outlook.** OUSG's regulatory framework (Reg D, Delaware LP, SEC oversight, blocked jurisdictions explicitly listed) is stable and well-understood in the U.S. institutional context, providing a predictable compliance baseline. The multi-chain deployment strategy reflects deliberate expansion into high-growth blockchain ecosystems, with XRP Ledger and Solana integrations positioning OUSG for institutional adoption in non-EVM environments. The primary near-term risk to product trajectory is regulatory: if U.S. or international regulators apply additional requirements to on-chain transfers of tokenized securities, multi-chain compliance costs could increase or access could be restricted. Fee disclosure gaps (management fee and performance fee both null) remain unresolved and should be addressed before the asset is benchmarked against net-yield competitors on institutional analytics platforms.

---

## Change Log

| Date | Layer | Change | Author |
|------|-------|--------|--------|
| 2026-05-31 | All | Initial creation | AI-assisted |