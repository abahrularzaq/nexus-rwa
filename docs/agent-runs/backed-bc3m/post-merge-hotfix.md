# Post-Merge Hotfix — Backed bC3M Null Clearing

## Metadata

- Task type: Post-merge hotfix / remediation
- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Symbol: bC3M
- Slug: `backed-bc3m`
- Branch: `fix/backed-bc3m-null-clearing`
- Related PR: #85
- Trigger: Codex post-merge review comments on PR #85
- Coordinator date: 2026-06-27
- Build date: 2026-06-27
- QA date: 2026-06-27
- Validation update: 2026-06-27
- Current stage: Human merge decision
- Human approval required: yes

## Issue classification

This is a narrow post-merge importer remediation, not a full asset research or grading workflow.

Codex identified two valid P2 issues after PR #85 was merged:

1. `data/assets/backed-bc3m/liquidity.json` sets `earlyRedemptionFee` to `null`, but `mapAssetFilesToImportPayload` maps `liquidity.earlyRedemptionFee` through `asNumber`. Because `asNumber(null)` returns `undefined`, Prisma omits the field on update and may preserve a stale DB value such as `0.5`.
2. `data/assets/backed-bc3m/reserve.json` sets `redemptionAsset` to `null`, but `mapAssetFilesToImportPayload` maps `reserve.redemptionAsset` through `asString`. Because `asString(null)` returns `undefined`, Prisma omits the field on update and may preserve a stale DB value such as `"Cash value of the underlying exposure"`.

The issue is implementation-level null-clearing behavior during existing asset refresh import. It does not require changing the reviewed bC3M research files, source verification, risk, grade, or product evidence.

## Coordinator decision

- Decision gate: `advance`
- Decision: route directly to Build Agent for narrow importer remediation.
- Research Agent needed: no
- Source Verification Agent needed: no
- Risk & Grading Agent needed: no
- Build Agent needed: yes
- QA Review Agent needed after Build: yes, narrow QA only

## Rationale

The bC3M asset files already represent unsupported values honestly as `null`. The remaining risk is that the importer converts those explicit `null` values into `undefined`, which prevents existing DB rows from being cleared during update. This is a data-honesty preservation bug in the import mapping layer, not an evidence dispute.

Nexus RWA data-honesty rules require unknown or unsupported values to remain `null` rather than stale factual values. The fix should preserve explicit `null` only for the two Codex-identified fields and should avoid a broad nullable-field refactor.

## Approved scope

### Included

- Add a narrow nullable string field helper if needed.
- Preserve explicit `null` for `reserve.redemptionAsset`.
- Preserve explicit `null` for `liquidity.earlyRedemptionFee`.
- Preserve absent-field semantics as `undefined` so absent fields do not unintentionally clear existing DB values.
- Add focused regression tests for the two Codex findings.
- Record Build Agent command results in this document.
- Run focused importer tests, bC3M dry-run import when environment permits, and typecheck when environment permits.

### Excluded

- Changes under `data/assets/backed-bc3m/`.
- Changes to source verification, risk, or grade files.
- Changes to `docs/agent-runs/backed-bc3m/source-review.md`.
- Prisma schema or migrations unless Build Agent proves they are strictly required.
- Web files.
- Unrelated assets.
- Dependencies or lockfiles.
- Broad nullability refactor across all importer fields.
- Real database import.
- Merge or publication.

## Allowed files

- `api/src/lib/asset-file-import.ts`
- `api/src/lib/asset-file-import.test.ts`
- `docs/agent-runs/backed-bc3m/post-merge-hotfix.md`

## Forbidden files

- `data/assets/backed-bc3m/`
- `docs/agent-runs/backed-bc3m/source-review.md`
- `data/assets/backed-bc3m/risk.json`
- `data/assets/backed-bc3m/grade-baseline.json`
- Prisma schema or migrations unless strictly required and separately justified
- Web files
- Unrelated assets
- Dependencies or lockfiles
- Merge or publication

## Build Agent result

### Files changed

#### Created

- `docs/agent-runs/backed-bc3m/post-merge-hotfix.md`

#### Modified

- `api/src/lib/asset-file-import.ts`
- `api/src/lib/asset-file-import.test.ts`

#### Intentionally unchanged

- `data/assets/backed-bc3m/`
- `docs/agent-runs/backed-bc3m/source-review.md`
- `data/assets/backed-bc3m/risk.json`
- `data/assets/backed-bc3m/grade-baseline.json`
- Prisma schema and migrations
- Web files
- Unrelated assets
- Dependencies and lockfiles

### Implementation summary

- Added `asNullableStringField`, matching the existing property-presence pattern used by nullable boolean and nullable number helpers.
- `asNullableStringField` preserves these states distinctly:
  - absent field -> `undefined`
  - explicit `null` -> `null`
  - non-empty string -> trimmed string
  - empty string -> `undefined`
  - non-string value -> `String(value)`, following existing `asString` behavior
- Exported `asNullableStringField` through `assetFileImportTestHelpers` for focused regression testing.
- Updated `reserve.redemptionAsset` to use `asNullableStringField(reserve, 'redemptionAsset')`.
- Updated `liquidity.earlyRedemptionFee` to use `asNullableNumberField(liquidity, 'earlyRedemptionFee')`.
- Added tests for nullable string behavior, bC3M `redemptionAsset: null`, bC3M `earlyRedemptionFee: null`, and absent-field semantics.

### Commands run

| Command | Result | Notes |
|---|---|---|
| `node --import tsx --test src/lib/asset-file-import.test.ts` | passed | Local run on `fix/backed-bc3m-null-clearing`: 7 tests, 1 suite, 7 pass, 0 fail, duration 1548.8452ms. |
| `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run` | passed | Dry-run completed with no database changes. Import plan loaded bC3M, skipped layers none, source evidence dry-run discovered 14, duplicates 0, skippedInvalid 0. |
| `npm.cmd run typecheck` | passed | Workspace typecheck completed for `web`, `api`, and `shared`; Prisma Client generated successfully. |

### Errors and fixes

1. Error: `reserve.redemptionAsset` explicit `null` mapped to `undefined`.
   - Cause: field used `asString(reserve.redemptionAsset)`, and `asString(null)` returns `undefined`.
   - Fix: added `asNullableStringField` and mapped `redemptionAsset` through it.
   - Rerun result: focused importer tests passed.

2. Error: `liquidity.earlyRedemptionFee` explicit `null` mapped to `undefined`.
   - Cause: field used `asNumber(liquidity.earlyRedemptionFee)`, and `asNumber(null)` returns `undefined`.
   - Fix: mapped `earlyRedemptionFee` through existing `asNullableNumberField`.
   - Rerun result: focused importer tests passed.

### Data honesty review

- Fake fallback introduced: no
- Unsupported data changed: no
- Asset research data changed: no
- Source verification changed: no
- Risk or grade changed: no
- Null handling preserved: yes, for the two Codex-identified fields
- Absent-field semantics preserved: yes
- Broad nullability refactor introduced: no

### Diff review

- Changed files: 3
- Scope matched allowed files: yes
- Unrelated files changed: no
- Prisma schema or migration changed: no
- Web files changed: no
- Dependencies or lockfiles changed: no
- Secrets exposed: no
- Generated noise: none observed

### Build final status

- Implementation complete: true
- Focused tests added: true
- Focused tests passed: true
- Dry-run import passed: true
- Typecheck passed: true
- Build passed: true for requested validation scope
- Import passed: true for dry-run
- Ready for QA Review Agent: true

## QA Review Agent result

### Metadata

- Review type: Narrow QA for post-merge hotfix
- Review date: 2026-06-27
- Reviewed branch: `fix/backed-bc3m-null-clearing`
- Base branch: `main`
- QA scope: importer null-clearing fix only

### Verdict

- `safeToMerge: true`
- `safeToMergeRecommendation: true`
- Recommendation: `APPROVE FOR HUMAN MERGE`
- Human approval required: yes

### Reason for verdict

The code-level hotfix addresses both Codex findings, the diff is scoped correctly, and the previously missing validation evidence has now been recorded as passing. Focused importer tests pass, bC3M dry-run import completes without database changes, and workspace typecheck passes.

### Changed files reviewed

- `api/src/lib/asset-file-import.ts`
- `api/src/lib/asset-file-import.test.ts`
- `docs/agent-runs/backed-bc3m/post-merge-hotfix.md`

### Codex issue verification

| Codex issue | QA result | Evidence |
|---|---|---|
| Preserve `null` when clearing `reserve.redemptionAsset` | fixed | `redemptionAsset` maps through `asNullableStringField(reserve, 'redemptionAsset')`. |
| Preserve `null` when clearing `liquidity.earlyRedemptionFee` | fixed | `earlyRedemptionFee` maps through `asNullableNumberField(liquidity, 'earlyRedemptionFee')`. |
| Explicit `null` maps to `null` for both fields | passed | Focused test run passed; bC3M payload tests assert both payload values are `null`. |
| Absent field remains `undefined` for both fields | passed | Focused test run passed; absent nullable field tests assert `undefined`. |

### Scope review

- Scope matched: yes
- Changed files match approved scope: yes
- Unrelated files changed: no
- Asset data changed: no
- Source-review changed: no
- Risk or grade files changed: no
- Prisma schema/migration changed: no
- Web files changed: no
- Dependencies or lockfiles changed: no
- Changed files: 3

### Data honesty review

- Unsupported material claims introduced: none
- Fake fallback values introduced: none
- `null` replaced by misleading defaults: no
- Stale-value clearing behavior improved: yes
- Research values changed: no
- Source verification changed: no
- Risk/grade changed: no
- Broad nullability refactor introduced: no

### Code and repository safety review

- Nullable string helper is narrow and property-presence aware: yes
- Nullable number helper reused for `earlyRedemptionFee`: yes
- Absent field semantics preserved: yes
- No schema/API contract change observed: yes
- No secrets or environment values committed: yes
- Test coverage added for new helper and bC3M payload assertions: yes

### Validation summary

| Check | Result | Evidence/notes |
|---|---|---|
| Focused importer tests | passed | `node --import tsx --test src/lib/asset-file-import.test.ts`: 7 tests, 7 pass, 0 fail. |
| bC3M dry-run import | passed | Dry-run complete, no database changes; discovered 14 source evidence entries, duplicates 0, skippedInvalid 0. |
| Typecheck | passed | `npm.cmd run typecheck` passed for web, api, and shared workspaces. |
| Diff scope | passed | Only 3 approved files changed. |
| Code review | passed | Both Codex issues are addressed in mapper and tests. |

### Blocking issues

None.

### Non-blocking warnings

1. This hotfix should remain narrow; any broader explicit-null mapping audit should be handled as a separate follow-up.
2. PR #85 was already merged, so this hotfix should be handled through a separate PR into `main`.

### Required fixes

None.

### Follow-up tasks

1. Consider adding CI coverage for focused importer tests on hotfix PRs.
2. Consider a future audit for other field mappings where explicit `null` may need to clear stale DB values, but keep that out of this hotfix scope.

### Final QA recommendation

The implementation is correct, validation evidence is recorded, and the diff remains within the approved hotfix scope. This branch is ready for a human merge decision.

```text
safeToMerge: true
safeToMergeRecommendation: true
Recommendation: APPROVE FOR HUMAN MERGE
Human approval required: yes
Do not publish: yes
```

## Stage plan

| Stage | Agent | Status | Output | Notes |
|---|---|---|---|---|
| 1 | Coordinator Agent | done | `post-merge-hotfix.md` | Classified as post-merge importer remediation |
| 2 | Build Agent | done | code/test changes plus Build addendum | Explicit null preserved for two fields |
| 3 | QA Review Agent | done | QA section in this file | `safeToMergeRecommendation: true` |
| 4 | Human merge decision | pending | PR decision | Human approval required |

## Current blockers

None.

## Warnings

- PR #85 has already been merged, so this must be handled as a new hotfix branch and PR.
- The fix should remain narrow because broad null-clearing semantics could unintentionally clear unrelated stale data.

## Final recommendation

Proceed to create a small hotfix PR from `fix/backed-bc3m-null-clearing` into `main`. Do not publish automatically.

```text
Recommended action: APPROVE FOR HUMAN MERGE
Human approval required: yes
Do not publish: yes
```
