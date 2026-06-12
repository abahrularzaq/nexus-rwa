# Clearpool CPOOL Source Discovery

## Asset

- Slug: `clearpool-cpool`
- Name: Clearpool
- Symbol: CPOOL
- Classification: `rwa_infrastructure / protocol_token / protocol_utility / governance_protocol`
- Public segment: `RWA Protocols`

## Classification note

CPOOL is Clearpool's native utility and governance token. It is **not** a direct claim on a specific loan pool, treasury reserve, receivable-backed vault, or redeemable RWA asset. For Nexus RWA grading, it should be evaluated under the governance/protocol profile.

## Primary sources

1. Official website — https://clearpool.finance/
2. Official docs introduction — https://docs.clearpool.finance/clearpool
3. CPOOL docs — https://docs.clearpool.finance/clearpool/token/cpool
4. Tokenomics — https://docs.clearpool.finance/clearpool/token/cpool/tokenomics
5. Utility — https://docs.clearpool.finance/clearpool/token/cpool/utility
6. Staking — https://docs.clearpool.finance/clearpool/token/staking
7. Contracts & audits — https://docs.clearpool.finance/clearpool/security/smart-contracts
8. Official links — https://docs.clearpool.finance/clearpool/resources/official-links
9. Restricted countries — https://docs.clearpool.finance/clearpool/terms-and-conditions/restricted-countries

## Market and analytics sources

1. CoinGecko — https://www.coingecko.com/en/coins/clearpool
2. DeFiLlama — https://defillama.com/protocol/clearpool

## Evidence summary

- Official docs identify CPOOL as Clearpool's native utility and governance token.
- Official docs list initial total supply of 1,000,000,000 CPOOL.
- Official docs list Ethereum, Solana, Polygon, Mantle, Optimism, and Polygon zkEVM CPOOL contract addresses.
- Official utility docs list delegated staking, borrower staking, and LP rewards.
- Official staking docs state rewards are calculated and distributed at the end of each two-week epoch.
- Clearpool docs list restricted countries for Clearpool app usage.
- DeFiLlama classifies Clearpool under RWA and tracks TVL, fees, yields, liquidity, and active loans.
- CoinGecko tracks CPOOL market cap, price, supply, volume, and exchange markets.

## Non-applicable fields

Because CPOOL is a protocol token:

- reserve/collateral backing: not applicable
- custodian: not applicable
- issuer redemption: not applicable
- on-chain proof of reserves: not applicable
- AUM: not applicable

## Follow-up verification

- Manually confirm non-Ethereum token addresses on native explorers before marking all deployments verified.
- Refresh CoinGecko and DeFiLlama market data before production publication.
- Consider separate entries for direct Clearpool credit-pool/vault exposures if Nexus wants to cover RWA claim tokens rather than protocol tokens.
