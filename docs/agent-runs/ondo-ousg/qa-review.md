# QA Review — OUSG

## Summary
- Asset: `ondo-ousg` (OUSG)
- Reviewed PRs: PR #88 evidence repair; PR #89 grade-baseline re-baseline
- Final grade: `analytics`
- Final score: `77`
- QA verdict: fail

## Checks performed
- Grade-baseline consistency: Pass. `grade-baseline.json` keeps `grade: analytics`, `score: 77`, component scores at completeness 82, source 92, legal 85, reserve 65, liquidity 58, and risk 66. The `asset_backed` weighted formula computes `round(82*0.20 + 92*0.20 + 85*0.20 + 65*0.20 + 58*0.10 + 66*0.10) = 77`. `profileScores` matches the top-level component scores, and status/notes explicitly keep Analytics rather than implying an Institutional upgrade.
- Canonical evidence consistency: Mostly pass, with one blocker. The blockchain layer uses the official Ondo Ethereum OUSG address `0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92`; reserve breakdown remains `null`; proof-of-reserves remains `false`; blocked jurisdictions do not include CN/China; redemption type, redemption period days, and minimum redemption amount remain `null`; `dexPairs` remains `[]`; smart-contract audit evidence is scoped as security evidence only. However, `monitoring.json` still has a stale `gradeBaseline.score` of `82` and `baselineDate` of `2026-06-01`, inconsistent with the re-baselined grade-baseline score of `77` dated `2026-06-28`.
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
- `data/assets/ondo-ousg/monitoring.json` is stale relative to the corrected baseline: `gradeBaseline.score` remains `82` and `baselineDate` remains `2026-06-01`, while `data/assets/ondo-ousg/grade-baseline.json` is re-baselined to score `77` with baseline date `2026-06-28`. Update monitoring metadata to align with the canonical grade baseline before closing QA.

## Final recommendation
- Fail: return to the relevant agent to align `data/assets/ondo-ousg/monitoring.json` with the corrected Analytics baseline (`score: 77`, `baselineDate: 2026-06-28`) without upgrading grade, adding inferred values, or changing risk/grading logic.
