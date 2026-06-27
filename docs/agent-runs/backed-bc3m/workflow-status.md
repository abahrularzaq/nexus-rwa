# Asset Workflow Status - Backed bC3M

## Asset metadata

- Name: Backed GOVIES 0-6 Months Euro Investment Grade
- Symbol: bC3M
- Slug: backed-bc3m
- Category: Treasury
- Issuer/protocol: Backed Assets
- Task type: Existing asset refresh with integration remediation
- Branch: pilot/backed-bc3m-research
- Started: 2026-06-24
- Last updated: 2026-06-25

## Current workflow status

- Current stage: Integration remediation
- Current status: blocked
- Current owner agent: Build Agent
- Next agent: Coordinator Agent / environment owner
- Human decision required: yes

## Coordinator decision

- Decision gate: `advance`
- Selected option: **B - importer plus Prisma nullable-boolean migration**
- Reason: Importer-only remediation cannot preserve reviewed unknown boolean states because the previous Prisma columns were non-null booleans. Keeping the old schema would force `null` evidence into a factual `true` or `false` value, violating Nexus RWA data-honesty rules.

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Initial scope approved |
| 2 | Research Agent | done | 2026-06-24 | 2026-06-24 | research layers | Blockchain correction completed |
| 3 | Source Verification Agent | done | 2026-06-24 | 2026-06-24 | source-review.md | `safeToProceed: true` |
| 4 | Risk & Grading Agent | done | 2026-06-24 | 2026-06-24 | risk.json and grade-baseline.json | Research grade assigned |
| 5A | Build Agent | blocked | 2026-06-24 | 2026-06-24 | build-report.md | BLD-001 through BLD-003 found |
| 5B | Build Agent - integration remediation | blocked | 2026-06-25 | 2026-06-25 | code, migration, tests, updated build-report.md | BLD-001, BLD-002, and BLD-003A fixed; BLD-003B still blocked by local DB TLS credentials |
| 6 | QA Review Agent | pending | | | qa-review.md | Must wait for remaining remediation checks |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

| ID | Blocking issue | Required resolution | Status |
|---|---|---|---|
| BLD-001 | Explicit null booleans are converted to default true/false values | Make relevant Prisma booleans nullable and preserve explicit null through the importer | fixed_by_build |
| BLD-002 | Explicit numeric nulls do not clear stale existing DB values | Distinguish absent fields from explicit null and pass null to nullable Prisma fields | fixed_by_build |
| BLD-003A | Normalized asset validator rejects approved nullable evidence booleans | Permit `boolean | null` only for the four approved evidence fields | fixed_by_build |
| BLD-003B | Asset verification cannot connect to configured PostgreSQL database | Classify or resolve the local database/TLS credential issue, then rerun `verify:assets` | blocked_environment |

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
   - an actually absent field follows existing default/update behavior without inventing evidence;
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
- `api/prisma/migrations/20260625000000_nullable_evidence_booleans/migration.sql`
- `api/src/lib/asset-file-import.ts`
- `api/src/scripts/validate-normalized-assets.ts`
- `api/src/scripts/import-from-files.ts` only if required to preserve explicit null during update
- focused test files under existing API test conventions
- `docs/agent-runs/backed-bc3m/build-report.md`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

## Forbidden files

- All files under `data/assets/backed-bc3m/`
- `docs/agent-runs/backed-bc3m/source-review.md`
- `docs/agent-runs/backed-bc3m/qa-review.md`
- unrelated assets
- web application files
- unrelated API routes, services, or validation scripts
- seed data unless Coordinator re-approves
- unrelated Prisma models, migrations, or schema fields
- dependencies and lockfiles
- automatic merge or publication

## Implementation semantics

### Boolean tri-state

For each approved boolean field:

| JSON state | Import meaning | Build status |
|---|---|---|
| `true` | Store `true` | implemented and tested |
| `false` | Store `false` | implemented and tested |
| `null` | Store `null` | implemented and tested |
| field absent | Preserve absence as `undefined` in payload mapping | implemented and tested |

Normalized validation now permits `boolean | null` only for:

- `reserve.hasProofOfReserves`
- `blockchain[].hasWhitelist`
- `compliance.kycRequired`
- `compliance.sanctionsScreening`

Normalized validation still requires non-null booleans for:

- `blockchain[].isTransferable`
- `blockchain[].hasTransferRestrictions`
- `blockchain[].isVerified`
- `compliance.accreditedOnly`

### Numeric nullable fields

For nullable numeric fields involved in this existing asset refresh:

| JSON state | Import meaning | Build status |
|---|---|---|
| number | Store number | implemented and tested |
| `null` | Clear existing DB value by storing `null` | implemented and tested in payload mapping |
| field absent | Leave existing DB value unchanged | implemented and tested in helper mapping |

Invalid non-null numeric values remain `undefined`; they are not silently converted to `null`.

## Command status

| Command | Result |
|---|---|
| `npm.cmd exec --workspace=api -- prisma format --schema prisma/schema.prisma` | passed |
| `npm.cmd exec --workspace=api -- prisma validate --schema prisma/schema.prisma` | passed |
| `node --import tsx --test src/lib/asset-file-import.test.ts` | passed |
| `node --import tsx --test src/scripts/validate-normalized-assets.test.ts` | passed |
| `npm.cmd run validate:asset-files --workspace=api -- --slug=backed-bc3m` | passed with warnings |
| `npm.cmd run validate:normalized-assets --workspace=api -- --slug=backed-bc3m` | passed with warnings: 0 errors, optional `monitoring.json` missing |
| `npm.cmd run verify:assets --workspace=api` | failed due local PostgreSQL TLS credentials |
| `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run lint` | passed with warnings |
| `npm.cmd run test:backend` | passed: 68 tests, 0 failed |
| `npm.cmd run build` | passed |

## Final status

- Workflow completed: no
- Safe to merge: no
- Safe to publish: no
- `readyForQA: false`
- Final recommendation: classify or resolve the asset-verification environment issue, then rerun `verify:assets` with working database credentials before QA.
- Human approval required: yes before QA, merge, or publication
