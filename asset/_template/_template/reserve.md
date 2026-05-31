---
backingType: US Treasury
backingDescription: USTB represents tokenized shares of the Superstate Short Duration U.S. Government Securities Fund, investing in short-duration U.S. government securities for Treasury-bill exposure.
collateralizationRatio: null
custodian: Anchorage Digital Bank N.A.
custodianUrl: null
hasProofOfReserves: false
porOracleAddress: null
porOracleChain: null
auditor: null
lastAuditDate: null
lastAuditUrl: null
reserveBreakdown: null
redemptionAsset: USDC
_lastUpdated: 2026-05-31
_source: manual
---

## Backing Analysis

USTB is a tokenized money market fund whose underlying holdings consist of short-duration U.S. government securities, providing Treasury-bill exposure. The fund is issued by Superstate Trust, a Delaware statutory trust registered with the SEC as an open-end management investment company (CIK 0001982577, File Nos. 333-272932 and 811-23886). Tokenized shares are the official fund shares — not derivatives or wrappers — recorded on Ethereum, Solana, and Plume Mainnet.

Underlying assets are custodied offchain at Anchorage Digital Bank N.A., with cash and USDC temporarily held at Circle during mint/redeem transactions. Private key management is facilitated by Turnkey. Superstate maintains overlapping, redundant records of ownership at the fund calculation agent, internally, and on-chain.

The safety of this structure depends primarily on the creditworthiness of U.S. government securities, which are among the lowest-risk asset classes available. However, the specific reserve composition — the percentage allocation between Treasury bills, Treasury notes, repurchase agreements, or other government instruments — is not publicly disclosed in the sources reviewed. NAV-based continuous pricing is provided via a custom onchain oracle (the USTB Oracle), with additional Chainlink and Chronicle oracle integrations, enabling composable DeFi usage and Protocol Mint/Redeem at per-second pricing.

## Red Flags

1. **SEC registration status:** The SEC EDGAR page for Superstate Trust (CIK 1982577) states that "This company's Exchange Act registration has been revoked" and that its Municipal Advisor registration has been revoked and cancelled. The fund's Securities Act (333-272932) and Investment Company Act (811-23886) registrations referenced by DefiLlama appear to be separate filing categories. Investors should verify the current regulatory standing of the fund directly with the SEC or Superstate, as this discrepancy was not resolvable from the provided sources alone.

2. **No disclosed auditor or audit date:** Superstate's security documentation states that "Each core component of our platform has been audited," but no auditor name, audit firm, or audit date is provided in any of the reviewed sources. This makes independent verification of audit claims impossible.

3. **Reserve composition not disclosed:** While the fund targets short-duration U.S. government securities, the specific percentage breakdown of holdings (e.g., T-bills vs. overnight repos vs. other instruments) is not available in any of the sources reviewed. This limits the ability to assess precise duration and credit risk.

4. **Partial source availability:** Two of the seven primary sources (app.superstate.co/ustb and app.rwa.xyz/protocols/superstate) failed to load, reducing data completeness.

5. **DeFi TVL concentration:** Approximately 65% of the fund's ~$190.8M DeFi active TVL is concentrated in two protocol ecosystems (Aave Horizon RWA at ~$66.6M and Frax/Frax USD at ~$57.5M each). While this reflects DeFi usage rather than reserve risk, it represents concentration in composability exposure.

---

## Source Table

| Field | Value | Source URL | Confidence |
|-------|-------|------------|------------|
| backingType | US Treasury | https://defillama.com/rwa/asset/USTB ("investing in short‑duration U.S. government securities"); https://superstate.com ("short Duration US Government Securities Fund") | High |
| backingDescription | (compiled) | https://defillama.com/rwa/asset/USTB; https://superstate.com | High |
| collateralizationRatio | null | — | — |
| custodian | Anchorage Digital Bank N.A. | https://docs.superstate.com/introduction-to-superstate/security ("Fund digital assets and cash are held at Anchorage Digital Bank N.A.") | High |
| custodianUrl | null | — | — |
| hasProofOfReserves | false | No explicit PoR system described in https://docs.superstate.com/introduction-to-superstate/security or other sources; redundant ownership records noted but not equivalent to PoR | Medium |
| porOracleAddress | null | — | — |
| porOracleChain | null | — | — |
| auditor | null | https://docs.superstate.com/introduction-to-superstate/security ("Each core component of our platform has been audited" — no auditor named) | High (null confirmed) |
| lastAuditDate | null | No audit date found in any source | High (null confirmed) |
| lastAuditUrl | null | No audit report URL found in any source | High (null confirmed) |
| reserveBreakdown | null | No specific percentage breakdown of underlying holdings found in any source | High (null confirmed) |
| redemptionAsset | USDC | https://superstate.com/newsroom/introducing-protocol-mint-and-redeem-for-ustb ("transfers USDC from the investor's wallet for newly minted USTB"; "burns USTB from the investor's wallet for USDC") | High |
