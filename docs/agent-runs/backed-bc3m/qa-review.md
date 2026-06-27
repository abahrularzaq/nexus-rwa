# QA Review — Backed bC3M Pilot Refresh

## Metadata

- Task type: Existing asset refresh with integration remediation
- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Slug: `backed-bc3m`
- Branch: `pilot/backed-bc3m-research`
- Review date: 2026-06-27
- Recheck date: 2026-06-27
- Agent: QA Review Agent

## Approved scope

Included:

- Review the completed bC3M research, source verification, risk/grading, build, and integration-remediation outputs.
- Verify evidence-honest bC3M data representation.
- Verify Ethereum-only product-level deployment.
- Verify unresolved non-Ethereum deployments remain unresolved and are not represented as deployments.
- Verify nullable evidence booleans across Prisma schema, migration, importer, validator, and tests.
- Verify explicit `null` and explicit numeric `null` handling.
- Narrow recheck only: Coordinator classification, replacement bC3M-specific verification gate, updated Build readiness, and previous blocker resolution.

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

- `safeToMerge: true`
- `safeToMergeRecommendation: true`
- Recommendation: `APPROVE FOR HUMAN MERGE`
- Human approval required: yes

## Reason for updated verdict

Initial QA blocked merge because `verify:assets` had failed locally and the Build report/workflow status still required formal classification before QA could approve. The Coordinator has now classified `verify:assets` as environment-limited and not bC3M-specific in its current hardcoded-registry form, and the Build Agent documented and passed a replacement bC3M-specific verification gate. This resolves the prior merge blocker without changing bC3M research, source-review, risk, grade, application code, Prisma schema, tests, or asset data during QA recheck.

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
- `api/src/scripts/verify-assets.ts` for narrow verification-gate classification only

## Blocking issues

None remain after the narrow QA recheck.

### Resolved prior blocker

1. **Asset verification remained unresolved**
   - Previous status: blocking.
   - Recheck status: resolved by Coordinator classification plus replacement gate.
   - Evidence: `verify:assets` failed due local PostgreSQL TLS credential/security-package configuration and does not include `backed-bc3m` in `VERIFIED_ASSETS`, so it is not a bC3M-specific verification gate in its current form.
   - Replacement: Build Agent documented and passed a bC3M-specific static/file-based verification gate covering `verify-assets.ts`, `blockchain.json`, source-verification fixes, dry-run import, and deterministic checks.
   - Merge impact: no longer blocking for this branch; remains a follow-up tooling/environment task.

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
13. `verify:assets` remains a follow-up tooling/environment issue because it depends on local/CI database access and does not currently support arbitrary asset slugs.

## Scope review

- Scope matched: yes
- Unrelated files changed: no
- Unapproved schema change: no; nullable-boolean migration was Coordinator-approved
- Unapproved dependency change: no
- Unrelated asset modified: no
- Web files modified: no
- Source-review modified during remediation: no
- QA recheck modified only allowed files: yes

The branch is reviewable and focused. Changes remain limited to bC3M asset data, bC3M agent-run documentation, and the approved nullable evidence integration remediation. The QA recheck did not modify forbidden files.

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

Previous QA findings for data honesty remain valid.

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

Source Verification B-001 and RC-001 through RC-003 remain resolved after recheck.

## Grading integrity review

- Grade changed during Build: no
- Scores changed without Risk & Grading review: no
- Final grade: `research`
- Final score: `58`
- Blockers/warnings preserved: yes
- Baseline date valid: yes, `2026-06-24`
- Grade guardrail review: `research` remains appropriate because legal, reserve, redemption, and liquidity evidence gaps remain visible.

Previous QA findings for grading integrity remain valid.

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

Previous QA findings for code/schema remediation remain valid.

## Narrow QA recheck addendum — 2026-06-27

### Recheck scope

This addendum is a narrow QA recheck only. It does not repeat full QA and does not change research, source verification, grading, asset data, application code, Prisma schema/migrations, tests, web files, dependencies, merge state, or publication state.

### Recheck findings

| Item | Result | Notes |
|---|---|---|
| `workflow-status.md` states `readyForQA: true` | passed | Final status now records `readyForQA: true`. |
| `build-report.md` records replacement bC3M-specific verification gate | passed | Replacement gate section and final status record the gate as passed. |
| `verify:assets` classification | passed | Correctly classified as environment-limited and not bC3M-specific in current hardcoded registry form. |
| `backed-bc3m` absent from `VERIFIED_ASSETS` | passed | `VERIFIED_ASSETS` does not include `backed-bc3m`; the script iterates hardcoded registry entries. |
| `blockchain.json` row count | passed | Exactly one product-level blockchain row. |
| Ethereum row values | passed | `chain: ethereum`, `chainId: 1`, address `0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7`, Etherscan address URL, `isVerified: true`, `hasWhitelist: null`. |
| Source Verification B-001 and RC-001 through RC-003 | passed | All remain resolved. |
| Previous QA findings | passed | Scope, data honesty, source integrity, grading integrity, and code/schema remediation findings remain valid. |
| New blockers | passed | No new blocker found. |

### Updated validation summary

| Check | Result | Evidence/notes |
|---|---|---|
| Prisma format | passed | Build report records pass via `npm.cmd`. |
| Prisma validate | passed | Build report records pass via `npm.cmd`. |
| Importer focused tests | passed | 5 tests passed. |
| Normalized validator focused tests | passed | 4 tests passed. |
| Asset file validation | passed with warnings | bC3M evidence warnings remain visible. |
| Normalized asset validation | passed with warnings | 0 errors, optional `monitoring.json` missing. |
| Asset verification | classified / replaced | `verify:assets` is environment-limited and not bC3M-specific; replacement bC3M-specific gate passed. |
| Dry-run import | passed | Dry-run only; no database changes. |
| Typecheck | passed | All workspaces passed. |
| Lint | passed with warnings | Warnings disclosed as pre-existing. |
| Backend tests | passed | 68 tests, 0 failed. |
| Production build | passed | Shared, web, and API builds passed. |
| Preview deployment | not reviewed | No preview evidence provided. |

## Product behavior

- Asset loads: build report states production build generated `/assets/backed-bc3m`; no preview was reviewed by QA.
- Null fields safe: schema/importer/validator path supports the reviewed nulls; UI preview not independently reviewed.
- Links valid: not independently clicked by QA; Source Verification reviewed source classification and evidence mapping.
- Warnings visible: yes in source-review, grade-baseline, build-report, workflow-status, and this QA report.
- Grade display correct: expected `research` grade with score `58`; preview not independently reviewed.

## Required fixes

None remain for this narrow QA recheck.

## Follow-up tasks

1. Add or update CI so branch pushes/PRs run deterministic checks with a consistent environment.
2. Decide whether nullable evidence booleans should keep Prisma defaults or drop defaults in a future schema-hardening task. This is not blocking for this branch because explicit `null` is preserved in the reviewed bC3M import path.
3. Add product preview QA once a deployment is available.
4. Continue source follow-ups listed in `grade-baseline.json` before any future grade upgrade.
5. Fix local PostgreSQL TLS credential/security-package setup or move database-backed verification into CI with valid secrets.
6. Update `api/src/scripts/verify-assets.ts` so it either includes `backed-bc3m` when appropriate or is replaced by a normalized-asset verification command that supports arbitrary slugs.

## Final recommendation

The narrow QA recheck resolves the only prior blocker. The branch remains evidence-honest, scoped, and consistent with the approved research, source verification, grading, schema/importer remediation, validation, dry-run import, tests, typecheck, backend tests, and build evidence. `verify:assets` is correctly treated as a follow-up tooling/environment issue rather than a bC3M-specific blocker because the current script does not include `backed-bc3m` and cannot run locally due the PostgreSQL TLS credential issue. The replacement bC3M-specific verification gate passed.

```text
safeToMerge: true
safeToMergeRecommendation: true
Recommendation: APPROVE FOR HUMAN MERGE
Human approval required: yes
```

Stop after QA recheck. Do not merge. Do not publish.
