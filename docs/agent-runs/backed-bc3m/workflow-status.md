# Asset Workflow Status — Backed bC3M

## Asset metadata

- Name: Backed GOVIES 0-6 Months Euro Investment Grade
- Symbol: bC3M
- Slug: backed-bc3m
- Category: Treasury
- Issuer/protocol: Backed Assets
- Task type: Existing asset refresh with integration remediation
- Branch: pilot/backed-bc3m-research
- Started: 2026-06-24
- Last updated: 2026-06-24

## Current workflow status

- Current stage: Integration remediation
- Current status: pending
- Current owner agent: Build Agent
- Next agent: Build Agent
- Human decision required: no

## Coordinator decision

- Decision gate: `advance`
- Selected option: **B — importer plus Prisma nullable-boolean migration**
- Reason: Importer-only remediation cannot preserve reviewed unknown boolean states because the current Prisma columns are non-null booleans. Keeping the existing schema would force `null` evidence into a factual `true` or `false` value, violating Nexus RWA data-honesty rules.

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Initial scope approved |
| 2 | Research Agent | done | 2026-06-24 | 2026-06-24 | research layers | Blockchain correction completed |
| 3 | Source Verification Agent | done | 2026-06-24 | 2026-06-24 | source-review.md | `safeToProceed: true` |
| 4 | Risk & Grading Agent | done | 2026-06-24 | 2026-06-24 | risk.json and grade-baseline.json | Research grade assigned |
| 5A | Build Agent | blocked | 2026-06-24 | 2026-06-24 | build-report.md | BLD-001 through BLD-003 found |
| 5B | Build Agent — integration remediation | pending | | | code, migration, tests, updated build-report.md | Approved by Coordinator |
| 6 | QA Review Agent | pending | | | qa-review.md | Must wait for remediation build pass |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

| ID | Blocking issue | Required resolution | Status |
|---|---|---|---|
| BLD-001 | Explicit null booleans are converted to default true/false values | Make relevant Prisma booleans nullable and preserve explicit null through the importer | approved_for_fix |
| BLD-002 | Explicit numeric nulls do not clear stale existing DB values | Distinguish absent fields from explicit null and pass null to nullable Prisma fields | approved_for_fix |
| BLD-003 | Required repository checks were not executed | Run all required checks after remediation | approved_for_fix |

## Approved remediation scope

### Included

1. Change these Prisma fields from required Boolean to nullable Boolean:
   - `AssetBlockchain.hasWhitelist`
   - `AssetReserve.hasProofOfReserves`
   - `AssetCompliance.kycRequired`
   - `AssetCompliance.sanctionsScreening`

2. Add one PostgreSQL-compatible Prisma migration that alters only those four columns to allow null while preserving existing data.

3. Update the asset-file importer so that:
   - explicit JSON `null` for the four approved booleans remains `null`;
   - explicit JSON `true` or `false` remains unchanged;
   - an actually absent field follows the existing database/default behavior without inventing evidence;
   - explicit numeric `null` is passed as `null` for nullable numeric fields during existing-record updates;
   - absent numeric fields remain omitted rather than cleared.

4. Ensure the bC3M refresh can clear at minimum:
   - `AssetLiquidity.liquidityScore`
   - `AssetMarket.aumUsd`

5. Add regression tests covering mapping and existing-asset refresh behavior.

6. Run repository-native validation, import dry-run, typecheck, lint, tests, and production build.

7. Update the existing build report and workflow status with exact commands and results.

### Excluded

- Changes to research, source-verification, risk, or grading values.
- UI or API redesign.
- Changes to unrelated Prisma models or fields.
- Broad nullability refactor across the repository.
- New fallback values.
- Changes to unrelated assets.
- QA approval, merge, or publication.
- Real database import unless explicitly authorized after dry-run validation.

## Allowed files

- `api/prisma/schema.prisma`
- `api/prisma/migrations/<new_nullable_asset_evidence_migration>/migration.sql`
- `api/src/lib/asset-file-import.ts`
- `api/src/scripts/import-from-files.ts` only if required to preserve explicit null during update
- focused test files under existing API test conventions for:
  - asset-file payload mapping
  - existing-asset file import/upsert behavior
- `docs/agent-runs/backed-bc3m/build-report.md`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

## Forbidden files

- All files under `data/assets/backed-bc3m/`
- `docs/agent-runs/backed-bc3m/source-review.md`
- `docs/agent-runs/backed-bc3m/qa-review.md`
- unrelated assets
- web application files
- unrelated API routes or services
- seed data unless a deterministic test fixture cannot be implemented without it and the Coordinator re-approves
- unrelated Prisma models, migrations, or schema fields
- dependencies and lockfiles unless a pre-existing test framework requires no new package
- automatic merge or publication

## Required implementation semantics

### Boolean tri-state

For each approved boolean field:

| JSON state | Import meaning |
|---|---|
| `true` | Store `true` |
| `false` | Store `false` |
| `null` | Store `null` |
| field absent | Do not create an unsupported claim; preserve existing/default behavior according to create versus update semantics |

### Numeric nullable fields

For nullable numeric fields involved in an existing asset refresh:

| JSON state | Import meaning |
|---|---|
| number | Store number |
| `null` | Clear existing DB value by storing `null` |
| field absent | Leave existing DB value unchanged |

The implementation must not globally convert every invalid value to null. Invalid non-null types must continue to be rejected or reported through validation.

## Required tests

1. **Boolean mapping unit test**
   - `true` remains `true`.
   - `false` remains `false`.
   - explicit `null` remains `null`.
   - absent field does not become an evidence claim.

2. **bC3M payload regression test**
   - `hasWhitelist` maps to `null`.
   - `hasProofOfReserves` maps to `null`.
   - `kycRequired` maps to `null`.
   - `sanctionsScreening` maps to `null`.
   - blockchain payload contains Ethereum only.

3. **Explicit numeric null mapping test**
   - `liquidityScore: null` remains `null` in an update payload.
   - `aumUsd: null` remains `null` in an update payload.
   - omitted numeric fields remain omitted.

4. **Existing-record refresh regression test**
   - start with non-null stale liquidity score and AUM fixtures;
   - apply the bC3M refresh payload;
   - assert both values are cleared;
   - assert unrelated existing fields are not cleared.

5. **Migration compatibility test or verification**
   - migration uses PostgreSQL-compatible syntax;
   - only the four approved boolean columns become nullable;
   - existing true/false values remain unchanged.

6. **No-regression test**
   - an asset with explicit true/false boolean values still imports unchanged.

## Required commands

Inspect exact workspace conventions first, then run at minimum:

```bash
npm run validate:asset-files --workspace=api -- --slug=backed-bc3m
npm run validate:normalized-assets --workspace=api
npm run verify:assets --workspace=api
npm run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run
npm run typecheck
npm run lint
npm run test:backend
npm run build
```

Additionally run the focused regression test command and Prisma migration/schema validation command supported by the repository. Do not claim a command passed unless it actually ran.

## Acceptance criteria

- Prisma can store `null` for all four approved evidence booleans.
- Existing true/false records remain unchanged after migration.
- Explicit boolean null is preserved from JSON through payload and database update.
- Explicit numeric null clears stale nullable database values.
- Absent fields do not accidentally clear existing values.
- The bC3M dry-run payload contains:
  - Ethereum only;
  - `hasWhitelist: null`;
  - `hasProofOfReserves: null`;
  - `kycRequired: null`;
  - `sanctionsScreening: null`;
  - `liquidityScore: null`;
  - `aumUsd: null`.
- No research or grading file changes.
- No unrelated schema or application changes.
- Focused regression tests pass.
- Asset validation, normalized validation, verification, dry-run import, typecheck, lint, backend tests, and production build pass.
- Updated build report states `readyForQA: true` only when every required blocker is resolved and all required executable checks pass.

## Handoff

- Next agent: Build Agent
- Task type: Narrow integration remediation
- Required input:
  - `docs/agents/README.md`
  - `docs/agents/05-build-agent.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
  - `docs/agent-runs/backed-bc3m/build-report.md`
  - `api/src/lib/asset-file-import.ts`
  - `api/src/scripts/import-from-files.ts`
  - `api/prisma/schema.prisma`
  - relevant existing API tests and migration conventions
- Required output:
  - approved code and migration changes
  - focused regression tests
  - updated build-report.md
  - updated workflow-status.md
  - explicit `readyForQA: true | false`
- Stop condition: Stop after remediation implementation, all required checks, and QA handoff. Do not perform QA, merge, or publication.

## Final status

- Workflow completed: no
- Safe to merge: no
- Safe to publish: no
- Final recommendation: Implement option B, then rerun Build validation
- Human approval required: yes before merge or publication
