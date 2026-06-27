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
- Current stage: validation follow-up before human merge decision
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

## Required Build Agent handoff

### Target agent

Build Agent

### Files to read

- `docs/agents/README.md`
- `docs/agents/05-build-agent.md`
- `docs/agent-runs/backed-bc3m/post-merge-hotfix.md`
- `api/src/lib/asset-file-import.ts`
- `api/src/lib/asset-file-import.test.ts`

### Required implementation

1. Add a narrow nullable string helper, similar to the existing nullable boolean/number helpers:
   - field absent -> `undefined`
   - explicit `null` -> `null`
   - valid string -> trimmed string or `undefined` if empty
   - non-string value -> follow existing `asString` convention unless invalid for current type
2. Use the nullable string helper for:
   - `reserve.redemptionAsset`
3. Use the existing nullable number helper for:
   - `liquidity.earlyRedemptionFee`
4. Add focused tests proving:
   - bC3M `reserve.redemptionAsset` explicit `null` maps to `null`
   - bC3M `liquidity.earlyRedemptionFee` explicit `null` maps to `null`
   - absent `redemptionAsset` remains `undefined`
   - absent `earlyRedemptionFee` remains `undefined`
   - unrelated behavior is not broadened unnecessarily

### Commands to run

Use the platform-appropriate npm command. On Windows, prefer `npm.cmd` when PowerShell blocks `npm.ps1`.

- `node --import tsx --test src/lib/asset-file-import.test.ts`
- `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run`
- `npm.cmd run typecheck`

If a command cannot run due local environment constraints, document the exact failure and whether it is task-related.

### Build acceptance criteria

- Explicit `null` for `reserve.redemptionAsset` maps to `null`.
- Explicit `null` for `liquidity.earlyRedemptionFee` maps to `null`.
- Absent values remain `undefined`.
- Focused tests are added and pass.
- No bC3M research/data/source/risk/grade files are modified.
- No Prisma schema or migration changes unless strictly justified.
- No unrelated files are modified.
- Build results and any warnings are documented honestly in this file.

### Stop condition

Stop after Build Agent implementation and command-result documentation. Do not merge. Do not publish. Return to QA Review Agent for narrow QA.

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
| `node --import tsx --test src/lib/asset-file-import.test.ts` | not run | ChatGPT GitHub connector can edit repository files but cannot execute repository commands. A separate container attempt could not clone GitHub because DNS/network access to `github.com` is unavailable in this environment. Must be run locally or by CI. |
| `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run` | not run | Same environment limitation. Must be run locally or by CI. |
| `npm.cmd run typecheck` | not run | Same environment limitation. Must be run locally or by CI. |

### Errors and fixes

1. Error: `reserve.redemptionAsset` explicit `null` mapped to `undefined`.
   - Cause: field used `asString(reserve.redemptionAsset)`, and `asString(null)` returns `undefined`.
   - Fix: added `asNullableStringField` and mapped `redemptionAsset` through it.
   - Rerun result: not run in this environment; focused test was added for local/CI execution.

2. Error: `liquidity.earlyRedemptionFee` explicit `null` mapped to `undefined`.
   - Cause: field used `asNumber(liquidity.earlyRedemptionFee)`, and `asNumber(null)` returns `undefined`.
   - Fix: mapped `earlyRedemptionFee` through existing `asNullableNumberField`.
   - Rerun result: not run in this environment; focused test was added for local/CI execution.

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

- Branch compared against `main`: `ahead_by: 3`, `behind_by: 0`
- Changed files: 3
- Scope matched allowed files: yes
- Unrelated files changed: no
- Prisma schema or migration changed: no
- Web files changed: no
- Dependencies or lockfiles changed: no
- Secrets exposed: no
- Generated noise: none observed

### Remaining warnings

1. Deterministic commands were not run in this connector environment. They must be run locally or by CI before merge.
2. Because command execution is pending, QA should treat this as ready for narrow review of code and scope, but not fully merge-ready until focused test, dry-run import, and typecheck results are available.

### Build final status

- Implementation complete: true
- Focused tests added: true
- Commands run: false, environment/tool-limited
- Build passed: partial
- Import passed: not run
- Typecheck passed: not run
- Ready for QA Review Agent: true, with required validation follow-up
- Blocking reason, if false: n/a for implementation handoff; validation commands remain pending before merge

## QA Review Agent result

### Metadata

- Review type: Narrow QA for post-merge hotfix
- Review date: 2026-06-27
- Reviewed branch: `fix/backed-bc3m-null-clearing`
- Base branch: `main`
- QA scope: importer null-clearing fix only

### Verdict

- `safeToMerge: false`
- `safeToMergeRecommendation: false`
- Recommendation: `REQUEST CHANGES`
- Human approval required: yes

### Reason for verdict

The code-level hotfix addresses both Codex findings and the diff is scoped correctly. However, the requested deterministic checks have not been run or recorded as passed. Under the QA Review Agent rules, QA cannot recommend merge while focused tests, bC3M dry-run import, and typecheck have no pass evidence. This is not a code blocker; it is a validation-evidence blocker before human merge.

### Changed files reviewed

- `api/src/lib/asset-file-import.ts`
- `api/src/lib/asset-file-import.test.ts`
- `docs/agent-runs/backed-bc3m/post-merge-hotfix.md`

### Codex issue verification

| Codex issue | QA result | Evidence |
|---|---|---|
| Preserve `null` when clearing `reserve.redemptionAsset` | fixed in code | `redemptionAsset` now maps through `asNullableStringField(reserve, 'redemptionAsset')`. |
| Preserve `null` when clearing `liquidity.earlyRedemptionFee` | fixed in code | `earlyRedemptionFee` now maps through `asNullableNumberField(liquidity, 'earlyRedemptionFee')`. |
| Explicit `null` maps to `null` for both fields | covered by code and tests | Helper implementation returns `null` for explicit `null`; bC3M tests assert both payload values are `null`. |
| Absent field remains `undefined` for both fields | covered by code and tests | Helper implementation checks property presence first; tests assert absent `redemptionAsset` and `earlyRedemptionFee` remain `undefined`. |

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
- Branch status: ahead of `main` by 4 commits, behind by 0
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
| Focused importer tests | not run | Build report states connector environment cannot execute repository commands. Must run locally or in CI. |
| bC3M dry-run import | not run | Build report states connector environment cannot execute repository commands. Must run locally or in CI. |
| Typecheck | not run | Build report states connector environment cannot execute repository commands. Must run locally or in CI. |
| Diff scope | passed | Compare against `main` shows only 3 approved files changed. |
| Code review | passed | Both Codex issues are addressed in mapper and test assertions. |

### Blocking issues

1. **Required validation evidence missing**
   - File: `docs/agent-runs/backed-bc3m/post-merge-hotfix.md`
   - Evidence: Build command table records focused importer tests, dry-run import, and typecheck as `not run`.
   - Impact: QA cannot recommend human merge without evidence that the focused tests and typecheck pass, and without dry-run import evidence or a documented acceptable limitation.
   - Required fix: Run and record results for:
     - `node --import tsx --test src/lib/asset-file-import.test.ts`
     - `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run`
     - `npm.cmd run typecheck`
   - Owner agent: Build Agent / local environment owner

### Non-blocking warnings

1. The implementation is code-reviewed but not command-verified in this connector environment.
2. Dry-run import may still depend on local database configuration; if it fails for environment reasons, record the exact failure and classify it explicitly.
3. PR #85 was already merged, so this hotfix should be handled through a separate PR into `main` after validation passes.

### Required fixes

1. Run focused importer tests and record pass/fail output.
2. Run bC3M dry-run import and record pass/fail output, or document a precise environment-limited failure.
3. Run typecheck and record pass/fail output.
4. Re-run narrow QA after validation evidence is recorded.

### Follow-up tasks

1. Consider adding CI coverage for focused importer tests on hotfix PRs so this evidence is automatically available.
2. Consider a future audit for other field mappings where explicit `null` may need to clear stale DB values, but keep that out of this hotfix scope.

### Final QA recommendation

The implementation appears correct and scoped, but it is not ready for human merge until required validation evidence is recorded. Return to Build Agent or the local environment owner to run the focused test, dry-run import, and typecheck, then perform a short QA recheck.

```text
safeToMerge: false
safeToMergeRecommendation: false
Recommendation: REQUEST CHANGES
Human approval required: yes
Do not merge: yes
Do not publish: yes
```

## Stage plan

| Stage | Agent | Status | Output | Notes |
|---|---|---|---|---|
| 1 | Coordinator Agent | done | `post-merge-hotfix.md` | Classified as post-merge importer remediation |
| 2 | Build Agent | done | code/test changes plus Build addendum | Explicit null preserved for two fields; commands pending due environment limitation |
| 3 | QA Review Agent | needs_fix | QA section in this file | Code/scope pass; validation evidence missing |
| 4 | Human merge decision | pending | PR decision | Human approval required after QA pass |

## Current blockers

Validation evidence is missing. Focused importer tests, bC3M dry-run import, and typecheck must be run locally or by CI and recorded before QA can recommend merge.

## Warnings

- PR #85 has already been merged, so this must be handled as a new hotfix branch and PR.
- The fix should remain narrow because broad null-clearing semantics could unintentionally clear unrelated stale data.
- Dry-run import may still depend on local database/environment configuration; any environment-limited failure must be documented clearly.
- Current connector environment cannot execute the requested repository commands.

## Final Build Agent recommendation

Proceed to narrow QA Review Agent. QA should verify the code diff, scope discipline, test coverage, and require local/CI command evidence before final human merge.

```text
Next agent: QA Review Agent
Recommended action: narrow QA recheck
Human approval required: yes
Do not merge: yes
Do not publish: yes
```
