# QA Review — Backed bC3M Pilot Refresh

## Metadata

- Task type: Existing asset refresh with integration remediation
- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Slug: `backed-bc3m`
- Branch: `pilot/backed-bc3m-research`
- Review date: 2026-06-27
- Agent: QA Review Agent

## Approved scope

Included:

- Review the completed bC3M research, source verification, risk/grading, build, and integration-remediation outputs.
- Verify evidence-honest bC3M data representation.
- Verify Ethereum-only product-level deployment.
- Verify unresolved non-Ethereum deployments remain unresolved and are not represented as deployments.
- Verify nullable evidence booleans across Prisma schema, migration, importer, validator, and tests.
- Verify explicit `null` and explicit numeric `null` handling.
- Verify changed-file scope and disclosed command results.

Excluded:

- Primary research.
- Score or grade reassignment.
- Application-code fixes.
- Prisma/schema edits.
- Test edits.
- Asset-data edits.
- QA approval to merge without human review.
- Automatic merge or publication.

## Verdict

- `safeToMerge: false`
- Recommendation: `BLOCKED — ADDITIONAL INPUT REQUIRED`
- Human approval required: yes

## Reason for blocked verdict

QA entry was requested while the Build report and workflow status still state `readyForQA: false`. The remaining blocker is not a bC3M data-honesty or implementation regression; it is the unresolved asset-verification command failure caused by the local PostgreSQL TLS credential/security-package issue. Under the QA Review Agent guide, QA cannot approve merge while a Build-readiness blocker remains unresolved or unclassified.

## Changed files reviewed

### Asset data and agent-run files

- `data/assets/backed-bc3m/blockchain.json`
- `data/assets/backed-bc3m/compliance.json`
- `data/assets/backed-bc3m/grade-baseline.json`
- `data/assets/backed-bc3m/liquidity.json`
- `data/assets/backed-bc3m/market.json`
- `data/assets/backed-bc3m/reserve.json`
- `data/assets/backed-bc3m/risk.json`
- `data/assets/backed-bc3m/source-discovery.md`
- `data/assets/backed-bc3m/sources.json`
- `docs/agent-runs/backed-bc3m/source-review.md`
- `docs/agent-runs/backed-bc3m/build-report.md`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

### Integration remediation files

- `api/prisma/schema.prisma`
- `api/prisma/migrations/20260625000000_nullable_evidence_booleans/migration.sql`
- `api/src/lib/asset-file-import.ts`
- `api/src/lib/asset-file-import.test.ts`
- `api/src/scripts/validate-normalized-assets.ts`
- `api/src/scripts/validate-normalized-assets.test.ts`

## Blocking issues

1. **Asset verification remains unresolved**
   - File: `docs/agent-runs/backed-bc3m/build-report.md`, `docs/agent-runs/backed-bc3m/workflow-status.md`
   - Evidence: `npm.cmd run verify:assets --workspace=api` failed because the local Prisma connection could not open a TLS connection: `No credentials are available in the security package (os error -2146893042)`.
   - Impact: The Build report explicitly keeps `readyForQA: false`; QA cannot recommend merge while this required verification remains failed, unresolved, or not formally classified as non-applicable for bC3M by the Coordinator.
   - Required fix: Run `verify:assets` successfully in an environment with working database credentials, or have the Coordinator classify the check as environment-limited/non-applicable to this bC3M PR with an explicit replacement verification plan.
   - Owner agent: Coordinator Agent / environment owner, then Build Agent if rerun evidence must be recorded.

## Non-blocking warnings

1. Product-specific final terms were not located and the English KID link returned 404.
2. Legal evidence is primarily issuer-level rather than complete product-level documentation.
3. No product-specific reserve breakdown, collateral ratio, reserve audit, attestation, assurance report, auditor, or proof-of-reserves mechanism was verified.
4. Redemption settlement time, minimum amount, settlement asset, process, and suspension terms remain unavailable.
5. New bToken issuance is closed; product is operationally redemption-only for existing holders.
6. Market values are secondary, low-confidence, last-recorded observations with zero active 24-hour volume.
7. Market capitalization and supply must not be treated as issuer-reported AUM or NAV.
8. Only Ethereum is verified as product-level bC3M deployment; seven other networks remain unresolved.
9. Custodian relationships are issuer-published and not independently confirmed.
10. Investor access is limited to professional or qualified investors, excludes U.S. persons, and includes conditional UK restrictions.
11. `validate:normalized-assets` passes with one non-blocking warning for optional missing `monitoring.json`.
12. Lint passes with pre-existing warnings recorded by Build.

## Scope review

- Scope matched: yes
- Unrelated files changed: no
- Unapproved schema change: no; nullable-boolean migration was Coordinator-approved
- Unapproved dependency change: no
- Unrelated asset modified: no
- Web files modified: no
- Source-review modified during remediation: no
- QA report created by QA only: yes

The branch is reviewable and focused. Changes are limited to bC3M asset data, bC3M agent-run documentation, and the approved nullable evidence integration remediation.

## Data honesty review

- Unsupported material claims: none found in the reviewed package
- Invented contract addresses: none found
- Fake fallback values: none found in the bC3M mapping path
- Null handling preserved: yes for reviewed file-to-payload behavior
- Dynamic values dated/labeled: yes; market values remain labeled as secondary, low-confidence, and last-recorded
- Source traceability preserved: yes
- Unsupported proof-of-reserves claim: none found
- Unsupported AUM claim: none found
- Unsupported non-Ethereum deployments: omitted from `blockchain.json` and retained as unresolved warnings/gaps

## Source integrity review

- Source Verification verdict: `advance`
- `safeToProceed: true`: yes
- B-001 resolved: yes
- RC-001 resolved: yes
- RC-002 resolved: yes
- RC-003 resolved: yes
- Ethereum contract evidence retained: yes
- CoinGecko not used as contract evidence: yes
- General Backed network scope not treated as product-level bC3M deployment evidence: yes

## Grading integrity review

- Grade changed during Build: no
- Scores changed without Risk & Grading review: no
- Final grade: `research`
- Final score: `58`
- Blockers/warnings preserved: yes
- Baseline date valid: yes, `2026-06-24`
- Grade guardrail review: `research` remains appropriate because legal, reserve, redemption, and liquidity evidence gaps remain visible.

## Code and schema safety review

- Prisma nullable fields approved: yes
- Migration scope narrow: yes; only the four approved columns drop `NOT NULL`
- Importer explicit boolean `null` handling: implemented for `hasWhitelist`, `hasProofOfReserves`, `kycRequired`, and `sanctionsScreening`
- Importer explicit numeric `null` handling: implemented for `liquidityScore` and `aumUsd`
- Validator compatibility: implemented only for the four approved nullable evidence booleans
- Required non-null booleans remain strict: yes
- Tests added: yes
- Secrets committed: none observed
- Real database import performed: no

## Validation summary

| Check | Result | Evidence/notes |
|---|---|---|
| Prisma format | passed | Build report records pass via `npm.cmd` |
| Prisma validate | passed | Build report records pass via `npm.cmd` |
| Importer focused tests | passed | 5 tests passed |
| Normalized validator focused tests | passed | 4 tests passed |
| Asset file validation | passed with warnings | bC3M evidence warnings remain visible |
| Normalized asset validation | passed with warnings | 0 errors, optional `monitoring.json` missing |
| Asset verification | failed / blocked | local PostgreSQL TLS credential/security-package issue |
| Dry-run import | passed | no database changes; source evidence dry-run successful |
| Typecheck | passed | all workspaces passed |
| Lint | passed with warnings | warnings disclosed as pre-existing |
| Backend tests | passed | 68 tests, 0 failed |
| Production build | passed | shared, web, and API builds passed |
| Preview deployment | not reviewed | no preview evidence provided |

## Product behavior

- Asset loads: build report states production build generated `/assets/backed-bc3m`; no preview was reviewed by QA.
- Null fields safe: schema/importer/validator path supports the reviewed nulls; UI preview not independently reviewed.
- Links valid: not independently clicked by QA; Source Verification reviewed source classification and evidence mapping.
- Warnings visible: yes in source-review, grade-baseline, build-report, and workflow-status.
- Grade display correct: expected `research` grade with score `58`; preview not independently reviewed.

## Required fixes

1. Resolve or formally classify `verify:assets`.
   - Preferred: run `npm.cmd run verify:assets --workspace=api` in an environment with working database credentials and record the result in `build-report.md` and `workflow-status.md`.
   - Acceptable alternative: Coordinator explicitly classifies `verify:assets` as environment-limited/non-applicable for this bC3M branch, explains why it does not cover bC3M or why it cannot run locally, and defines a replacement verification gate before merge.

## Follow-up tasks

1. Add or update CI so branch pushes/PRs run the deterministic checks with a consistent environment.
2. Decide whether nullable evidence booleans should keep Prisma defaults or drop defaults in a future schema-hardening task. This is not blocking for this branch because explicit `null` is preserved in the reviewed bC3M import path.
3. Add product preview QA once a deployment is available.
4. Continue source follow-ups listed in `grade-baseline.json` before any future grade upgrade.

## Final recommendation

This branch is substantially ready from a data-honesty, scope, schema, importer, validator, testing, and build perspective. However, QA cannot recommend merge while the Build report still states `readyForQA: false` and the required `verify:assets` command remains unresolved. The correct recommendation is to block merge until the asset-verification issue is either resolved in a working database environment or explicitly reclassified by the Coordinator with a documented replacement gate.

```text
safeToMerge: false
safeToMergeRecommendation: false
Recommendation: BLOCKED — ADDITIONAL INPUT REQUIRED
Human approval required: yes
```
