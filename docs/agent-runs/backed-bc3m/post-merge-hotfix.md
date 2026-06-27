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
- Current stage: Build Agent handoff
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

## Stage plan

| Stage | Agent | Status | Output | Notes |
|---|---|---|---|---|
| 1 | Coordinator Agent | done | `post-merge-hotfix.md` | Classified as post-merge importer remediation |
| 2 | Build Agent | pending | code/test changes plus Build addendum | Preserve explicit null for two fields |
| 3 | QA Review Agent | pending | QA section in this file | Narrow QA only |
| 4 | Human merge decision | pending | PR decision | Human approval required |

## Current blockers

None for Build handoff.

## Warnings

- PR #85 has already been merged, so this must be handled as a new hotfix branch and PR.
- The fix should be narrow because broad null-clearing semantics could unintentionally clear unrelated stale data.
- Dry-run import may still depend on local database/environment configuration; any environment-limited failure must be documented clearly.

## Final Coordinator recommendation

Proceed to Build Agent for the narrow importer fix. Do not run Research, Source Verification, or Risk & Grading again for this issue.

```text
Next agent: Build Agent
Recommended action: implement narrow hotfix
Human approval required: yes
Do not merge: yes
Do not publish: yes
```
