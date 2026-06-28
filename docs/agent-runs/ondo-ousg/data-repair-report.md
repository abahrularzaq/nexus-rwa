# Data Repair Report — OUSG

## Summary
- Files changed: `api/src/data/asset/ondo-ousg/metadata.json`, canonical normalized files under `data/assets/ondo-ousg/` (`blockchain.json`, `liquidity.json`, `reserve.json`, `compliance.json`, `sources.json`, `monitoring.json`), and this report.
- Fields corrected: Ethereum contract address/explorer URL, blocked jurisdictions evidence, proof-of-reserves notes, smart-contract audit evidence classification, redemption-currency evidence, and monitoring source-health URLs.
- Fields set to null: `liquidity.redemptionType`, `liquidity.redemptionPeriodDays`, `liquidity.minRedemptionAmount`, canonical `reserve.reserveBreakdown`, and `reserve.reserveBreakdown` source value.
- Sources replaced: contract address now uses Ondo Smart Contract Addresses; reserve breakdown/PoR context now uses Ondo Trust & Security; blocked jurisdictions now uses OUSG Eligibility; redemption evidence now uses OUSG Minting & Redeeming; smart-contract audit evidence now uses Ondo Smart Contract Audits.
- Remaining unresolved issues: no proof-of-reserves oracle confirmed, no dated exact reserve percentages, T+1 timing unverified, current minimum redemption amount unverified, and institutional upgrade remains blocked until Source Verification Agent reruns.

## Contract address repair
- Old value: `0x1bfe8cb57a0f5ecca7e7666798d9fb3f3a9befae`.
- New value: `0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92`.
- Source: `https://docs.ondo.finance/addresses`.
- Reason: Official Ondo docs list the new active Ethereum OUSG address; the old repository value was not confirmed by the reviewed official address source.

## Reserve evidence repair
- Previous reserve breakdown: BUIDL 82.57%; WTGXX 8.13%; BENJI 4.88%; FBOXX 2.39%; USTB 2.03%.
- New value: `null` for exact percentages in both canonical `reserve.json` and source evidence.
- Source: `https://docs.ondo.finance/trust-and-security`.
- Observation date: none; no stable dated observation source was retained for exact reserve composition.
- Remaining limitation: official Ondo docs support high-level backing/fund investment description only, not a current exact percentage breakdown.

## Compliance / jurisdiction repair
- Old value: `CN,KP,IR,SY,CU,RU`.
- New value: `Albania, Afghanistan, Belarus, Bosnia and Herzegovina, Bulgaria, Burma, Central African Republic, Croatia, Cuba, DRC, Darfur Region of Sudan, Ethiopia, Iran, Iraq, Kosovo, Lebanon, Libya, Mali, Montenegro, Nicaragua, North Korea, North Macedonia, Romania, Russia, Serbia, Slovenia, Somalia, South Korea, South Sudan, Syria, Venezuela, West Bank, Ukraine: Crimea, Donetsk, Kherson, Luhansk, Zaporizhzhia, Sevastopol, Yemen`.
- Source: `https://docs.ondo.finance/qualified-access-products/eligibility`.
- Reason: OUSG Eligibility is the reviewed product-specific source for issuance/redemption/economic restrictions. China/CN was removed because the current reviewed source does not list it.

## Audit terminology repair
- Smart contract audit source: `https://docs.ondo.finance/audits`.
- Reserve audit status: not added as reserve audit evidence.
- PoR status: remains false; no on-chain proof-of-reserves oracle confirmed.

## Liquidity / redemption repair
- Redemption timing: set to `null`; T+1 was not verified in the reviewed official source.
- Minimum redemption: set to `null`; current minimum redemption amount was not verified in the reviewed official source.
- DEX liquidity: `dexPairs` remains `[]`; issuer redemption is not conflated with DEX/secondary-market liquidity.
- Remaining limitation: official docs confirm redemption currencies only: USDC, PYUSD, RLUSD, or USD bank wire.

## Handoff recommendation
- Return to Source Verification Agent.
- Expected safeToProceed after repair: needs review.
