# QA Review — OUSG

## Summary
- Asset: `ondo-ousg` (OUSG)
- Reviewed PRs: PR #88 evidence repair; PR #89 grade-baseline re-baseline
- Final grade: `analytics`
- Final score: `77`
- QA verdict: pass

## Checks performed
- Grade-baseline consistency: Pass. `grade-baseline.json` keeps `grade: analytics`, `score: 77`, component scores at completeness 82, source 92, legal 85, reserve 65, liquidity 58, and risk 66. The `asset_backed` weighted formula computes `round(82*0.20 + 92*0.20 + 85*0.20 + 65*0.20 + 58*0.10 + 66*0.10) = 77`. `profileScores` matches the top-level component scores, and status/notes explicitly keep Analytics rather than implying an Institutional upgrade.
- Canonical evidence consistency: Pass. The blockchain layer uses the official Ondo Ethereum OUSG address `0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92`; reserve breakdown remains `null`; proof-of-reserves remains `false`; blocked jurisdictions do not include CN/China; redemption type, redemption period days, and minimum redemption amount remain `null`; `dexPairs` remains `[]`; smart-contract audit evidence is scoped as security evidence only. `monitoring.json` grade-baseline metadata now aligns with `grade-baseline.json` at grade `analytics`, score `77`, baseline date `2026-06-28`, and the analytics re-baseline status.
- Source evidence consistency: Pass with known strict-monitoring gap. `sources.json` aligns with repaired canonical claims and states that smart-contract audit evidence must not be treated as reserve audit, fund audit, attestation, or proof-of-reserves. Strict production validation still reports missing market-layer source evidence, which is an expected known gap for this QA scope.
- Validation: Normalized validation passed with the known optional `source-discovery.md` warning. Strict asset-production validation failed only for the known `sources.json.market` error and optional `source-discovery.md` warning. JSON syntax checks passed for `grade-baseline.json` and `sources.json`. `git diff --check` passed.
- Forbidden changes: Pass. No changes were made to `risk.json`, Prisma schema files, migrations, grading logic, or unrelated assets during this QA run.

## Findings
### Pass
- Grade-baseline remains `analytics`; it was not upgraded to Institutional.
- Top-level final score matches the current `asset_backed` formula: `77`.
- `profileScores` mirrors top-level component scores exactly.
- Official Ethereum OUSG contract address is present in `blockchain.json`.
- `reserve.reserveBreakdown` is `null` and `reserve.hasProofOfReserves` is `false`.
- `compliance.blockedJurisdictions` no longer includes CN or China.
- Redemption timing, redemption type, and minimum redemption amount remain unset pending official evidence.
- `liquidity.dexPairs` remains empty; issuer redemption is not conflated with DEX/secondary-market liquidity.
- Smart-contract audit evidence is identified as security evidence only, not reserve assurance.
- No forbidden files or systems were modified.

### Non-blocking warnings
- `npm run validate:normalized-assets --workspace=api -- --slug=ondo-ousg` reports the optional `source-discovery.md` file is missing.
- `npm run validate:asset-production --workspace=api -- --slug=ondo-ousg` reports the known strict-monitoring gap: missing market-layer source evidence in `sources.json`, plus the optional missing `source-discovery.md` warning.

### Blockers
- None.

## Final recommendation
- Pass: OUSG review cycle complete; keep Analytics. The stale monitoring metadata blocker has been resolved without upgrading grade, adding inferred values, or changing risk/grading logic.
