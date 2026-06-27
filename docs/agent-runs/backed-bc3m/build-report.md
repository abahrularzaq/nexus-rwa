# Build Report - Backed bC3M Integration Remediation

## Metadata

- Task type: Narrow integration remediation
- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Slug: `backed-bc3m`
- Branch: `pilot/backed-bc3m-research`
- Date: 2026-06-25
- Agent: Build Agent

## Approved scope

Included:

- Implement Coordinator option B: importer plus Prisma nullable-boolean migration.
- Make only these Prisma fields nullable booleans:
  - `AssetBlockchain.hasWhitelist`
  - `AssetReserve.hasProofOfReserves`
  - `AssetCompliance.kycRequired`
  - `AssetCompliance.sanctionsScreening`
- Preserve explicit boolean `null` for those evidence fields through asset-file mapping.
- Preserve explicit numeric `null` for at least `liquidity.liquidityScore` and `market.aumUsd`.
- Add focused API regression tests.
- Run Prisma validation, asset validation, dry-run import, typecheck, lint, backend tests, and production build.

Excluded:

- Changes under `data/assets/backed-bc3m/`.
- Research, source-review, risk, grade, QA, web, dependency, unrelated asset, or unrelated model changes.
- Real database import.
- QA approval, merge, or publication.

## Files changed

### Created

- `api/prisma/migrations/20260625000000_nullable_evidence_booleans/migration.sql`
- `api/src/lib/asset-file-import.test.ts`
- `api/src/scripts/validate-normalized-assets.test.ts`

### Modified

- `api/prisma/schema.prisma`
- `api/src/lib/asset-file-import.ts`
- `api/src/scripts/validate-normalized-assets.ts`
- `docs/agent-runs/backed-bc3m/build-report.md`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

### Intentionally unchanged

- `api/src/scripts/import-from-files.ts`
- All files under `data/assets/backed-bc3m/`
- Research, source-review, risk, grade, QA, web, dependency, and unrelated Prisma files

`api/src/scripts/import-from-files.ts` did not need changes. It already passes `payload.reserve`, `payload.compliance`, `payload.liquidity`, `payload.market`, and `payload.blockchain` directly into Prisma upsert/create operations. Once the mapper produces `null`, the script does not strip it.

## Implementation summary

- Added property-presence aware helpers in `api/src/lib/asset-file-import.ts` so approved evidence booleans distinguish `true`, `false`, explicit `null`, and absent properties.
- Removed fallback defaults only for `hasWhitelist`, `hasProofOfReserves`, `kycRequired`, and `sanctionsScreening`.
- Kept implementation-default boolean behavior for fields such as `isTransferable`, `hasTransferRestrictions`, `isVerified`, and `accreditedOnly`.
- Added narrowly scoped nullable numeric mapping for `liquidityScore` and `aumUsd`.
- Left invalid non-null numeric values as `undefined`; they are not silently converted to `null`.
- Updated only the four approved Prisma boolean fields to `Boolean?` while preserving existing database defaults.
- Added a PostgreSQL migration that only drops `NOT NULL` from the four approved columns.
- Updated normalized-asset validation so only `reserve.hasProofOfReserves`, `blockchain[].hasWhitelist`, `compliance.kycRequired`, and `compliance.sanctionsScreening` accept `boolean | null`.
- Kept `blockchain[].isTransferable`, `blockchain[].hasTransferRestrictions`, `blockchain[].isVerified`, and `compliance.accreditedOnly` as required non-null booleans.

## Migration SQL

```sql
ALTER TABLE "AssetBlockchain" ALTER COLUMN "hasWhitelist" DROP NOT NULL;
ALTER TABLE "AssetReserve" ALTER COLUMN "hasProofOfReserves" DROP NOT NULL;
ALTER TABLE "AssetCompliance" ALTER COLUMN "kycRequired" DROP NOT NULL;
ALTER TABLE "AssetCompliance" ALTER COLUMN "sanctionsScreening" DROP NOT NULL;
```

The migration does not update any row values, so existing `true` and `false` values are preserved.

## Commands run

| Command | Result | Notes |
|---|---|---|
| `npm exec --workspace=api -- prisma format --schema prisma/schema.prisma` | failed | PowerShell blocked `npm.ps1` due local execution policy. Reran with `npm.cmd`. |
| `npm exec --workspace=api -- prisma validate --schema prisma/schema.prisma` | failed | Same PowerShell `npm.ps1` execution policy issue. Reran with `npm.cmd`. |
| `npm.cmd exec --workspace=api -- prisma format --schema prisma/schema.prisma` | passed | Schema formatted. |
| `npm.cmd exec --workspace=api -- prisma validate --schema prisma/schema.prisma` | passed | Prisma schema valid. |
| `node --import tsx --test src/lib/asset-file-import.test.ts` | passed | 5 tests passed. |
| `node --import tsx --test src/scripts/validate-normalized-assets.test.ts` | passed | 4 tests passed. Covers true/false/null for approved fields, string/number rejection, non-null boolean rejection, and bC3M zero normalized errors. |
| `npm.cmd run validate:asset-files --workspace=api -- --slug=backed-bc3m` | passed with warnings | Expected nullable-evidence warnings for missing reserve/compliance URLs and auditor/oracle fields. |
| `npm.cmd run validate:normalized-assets --workspace=api -- --slug=backed-bc3m` | passed with warnings | 0 errors, 1 warning: optional `monitoring.json` missing. |
| `npm.cmd run verify:assets --workspace=api` | failed | Local Prisma connection failed: `Error opening a TLS connection: No credentials are available in the security package (os error -2146893042)`. |
| `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run` | passed | Dry-run only; no database changes. Source evidence dry-run discovered 14 rows, duplicates 0, skipped invalid 0. |
| `npm.cmd run typecheck` | passed | All workspaces passed; Prisma client regenerated with nullable booleans. |
| `npm.cmd run lint` | passed with warnings | No errors. Existing warnings in web hook deps and several API unused variables/directives. |
| `npm.cmd run test:backend` | passed | 68 tests passed, 0 failed. The suite logged the existing local PostgreSQL TLS credential error in fallback paths, but tests completed successfully. |
| `npm.cmd run build` | passed | Shared, web, and API production builds passed. Next.js generated `/assets/backed-bc3m`; API Prisma client generation and TypeScript build passed. |

## Focused regression coverage

`api/src/lib/asset-file-import.test.ts` covers:

- boolean `true` remains `true`;
- boolean `false` remains `false`;
- explicit boolean `null` remains `null`;
- absent boolean property remains `undefined`;
- bC3M `hasWhitelist`, `hasProofOfReserves`, `kycRequired`, and `sanctionsScreening` map to `null`;
- bC3M blockchain payload contains Ethereum only;
- explicit `liquidityScore: null` remains `null`;
- explicit `aumUsd: null` remains `null`;
- absent numeric fields remain `undefined`;
- invalid non-null numeric values remain `undefined`, not `null`;
- existing true/false implementation booleans remain compatible;
- unrelated existing null-valued fields such as `collateralizationRatio` and `redemptionPeriodDays` are not newly cleared by the scoped numeric helper.

`api/src/scripts/validate-normalized-assets.test.ts` covers:

- approved nullable evidence booleans accept `true`;
- approved nullable evidence booleans accept `false`;
- approved nullable evidence booleans accept `null`;
- approved nullable evidence booleans reject strings and numbers with `must be boolean or null`;
- non-null boolean fields still reject `null`;
- bC3M normalized validation returns zero errors.

## Errors and fixes

1. Error: Approved nullable evidence booleans could not be represented in Prisma.
   - Cause: Four evidence fields were required booleans.
   - Fix: Changed only those four fields to `Boolean?` and added a migration that drops `NOT NULL`.
   - Rerun result: Prisma validate, typecheck, tests, and build passed.

2. Error: Importer converted explicit boolean nulls into factual defaults.
   - Cause: `asBool(...) ?? default` on evidence fields.
   - Fix: Added property-presence aware nullable boolean mapping for the four approved fields.
   - Rerun result: Focused regression and backend tests passed.

3. Error: Importer converted explicit numeric nulls to `undefined`.
   - Cause: `asNumber` / `asInt` treats `null` as absent.
   - Fix: Added scoped nullable numeric mapping for `liquidityScore` and `aumUsd`.
   - Rerun result: Focused regression and dry-run import passed.

4. Error: Normalized asset validation rejects approved nullable booleans.
   - Cause: `validate-normalized-assets` still treats the four evidence fields as required booleans.
   - Fix: Added a narrow `boolean | null` validator path for only the four approved evidence fields.
   - Rerun result: `validate:normalized-assets --slug=backed-bc3m` passed with 0 errors.

5. Error: Asset verification cannot connect to the configured database.
   - Cause: Local PostgreSQL TLS credential/security-package failure.
   - Fix: Not applied; environment/database credential issue.
   - Rerun result: Not rerun in this validator-remediation pass; readiness remains blocked until the asset-verification environment issue is classified or resolved.

## Data honesty review

- Fake fallback introduced: no
- Unsupported research value changed: no
- Explicit boolean null preserved in payload: yes
- Explicit numeric null preserved in payload: yes
- Reviewed grade changed: no
- bC3M data files modified: no
- Real database import run: no

## Diff review

- Unrelated files changed: no
- Secrets exposed: no
- Generated noise removed: yes
- Scope matched approved files: yes, except the remaining normalized-validator failure cannot be fixed within the allowed file list
- `api/src/scripts/import-from-files.ts` changed: no, not required

## Remaining warnings

1. `verify:assets` previously failed in this environment due PostgreSQL TLS credential/security-package error and remains the outstanding QA-readiness blocker.
2. `validate:asset-files` passes with existing bC3M evidence warnings for nullable reserve/compliance fields.
3. `validate:normalized-assets` passes with one warning for optional missing `monitoring.json`.
4. `lint` passes with pre-existing warnings:
   - web `dashboard/monitoring/page.tsx` hook dependency warning;
   - API unused variable/directive warnings in `redis.ts`, `x402.ts`, `asset.repository.ts`, `admin.ts`, `generate-monitoring.ts`, `test-sync.ts`, and `validate-asset-files.ts`.

## Final status

- Implementation complete: true
- Prisma migration/schema validation passed: true
- Focused regression tests passed: true
- Dry-run import passed: true
- Typecheck passed: true
- Lint passed: true, with warnings
- Backend tests passed: true
- Production build passed: true
- Validator-remediation checks passed: true
- QA readiness checks passed: false
- `readyForQA: false`

Blocking reasons:

1. Asset verification requires a classified or resolved local database/TLS credential setup before QA handoff.

Recommended next action: classify or resolve the asset-verification environment issue, then rerun `verify:assets` in an environment with working database credentials before QA.
