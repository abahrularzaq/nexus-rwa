# Build Report - Backed bC3M Integration Remediation

## Metadata

- Task type: Narrow integration remediation plus replacement bC3M-specific verification gate
- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Slug: `backed-bc3m`
- Branch: `pilot/backed-bc3m-research`
- Date: 2026-06-27
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
- After QA/Coordinator classification, document and execute the replacement bC3M-specific verification gate because `verify:assets` is environment-limited and not bC3M-specific in its current hardcoded registry form.

Excluded:

- Changes under `data/assets/backed-bc3m/` during integration remediation and replacement verification.
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
- `api/src/scripts/verify-assets.ts`
- All files under `data/assets/backed-bc3m/` during replacement-gate update
- `docs/agent-runs/backed-bc3m/source-review.md`
- `docs/agent-runs/backed-bc3m/qa-review.md`
- Research, risk, grade, QA content, web, dependency, and unrelated Prisma files

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
| `npm.cmd run verify:assets --workspace=api` | failed, classified | Local Prisma connection failed: `Error opening a TLS connection: No credentials are available in the security package (os error -2146893042)`. Coordinator classified this script as environment-limited and not bC3M-specific in its current form because `backed-bc3m` is not included in `VERIFIED_ASSETS`. |
| `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run` | passed | Dry-run only; no database changes. Source evidence dry-run discovered 14 rows, duplicates 0, skipped invalid 0. |
| `npm.cmd run typecheck` | passed | All workspaces passed; Prisma client regenerated with nullable booleans. |
| `npm.cmd run lint` | passed with warnings | No errors. Existing warnings in web hook deps and several API unused variables/directives. |
| `npm.cmd run test:backend` | passed | 68 tests passed, 0 failed. The suite logged the existing local PostgreSQL TLS credential error in fallback paths, but tests completed successfully. |
| `npm.cmd run build` | passed | Shared, web, and API production builds passed. Next.js generated `/assets/backed-bc3m`; API Prisma client generation and TypeScript build passed. |

## Replacement bC3M-specific verification gate

Coordinator classified `verify:assets` as environment-limited and not sufficient/applicable as the bC3M-specific verification gate in its current form. Build Agent executed the replacement static/file-based gate below.

| Replacement gate item | Result | Evidence |
|---|---|---|
| `api/src/scripts/verify-assets.ts` does not include `backed-bc3m` in `VERIFIED_ASSETS` | passed | The hardcoded registry includes assets such as `ondo-usdy`, `ondo-ousg`, `backed-buidl`, `franklin-benji`, and others, but no `backed-bc3m`. |
| `verify:assets` is not bC3M-specific in current form | passed | The script iterates `VERIFIED_ASSETS`, queries `db.asset.findUnique({ where: { id: truth.id } })`, and compares DB contracts against that static list. Since bC3M is absent, a successful run would not independently verify bC3M. |
| `data/assets/backed-bc3m/blockchain.json` contains exactly one product-level deployment row | passed | File contains a single array item. |
| bC3M blockchain row is Ethereum only | passed | `chain: "ethereum"`, `chainId: 1`. |
| bC3M contract address matches verified Source Verification package | passed | `0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7`. |
| bC3M explorer URL is Etherscan address URL | passed | `https://etherscan.io/address/0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7`. |
| bC3M Ethereum deployment remains verified | passed | `isVerified: true`. |
| Unsupported whitelist value remains unknown | passed | `hasWhitelist: null`. |
| Source Verification B-001 resolved | passed | Seven unsupported non-Ethereum deployments removed; unresolved networks retained as research gaps. |
| Source Verification RC-001 resolved | passed | Ethereum address verified and no deterministic/general-network inference used for other chains. |
| Source Verification RC-002 resolved | passed | CoinGecko not used as final contract deployment evidence. |
| Source Verification RC-003 resolved | passed | `hasWhitelist` remains `null`. |
| bC3M dry-run import passed after remediation | passed | Recorded in command results. |
| Core deterministic checks passed | passed | Asset validation, normalized validation, focused tests, typecheck, backend tests, and production build passed as recorded above. |

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

5. Error: `verify:assets` cannot run locally and does not verify bC3M in current form.
   - Cause: Local PostgreSQL TLS credential/security-package failure; additionally, `backed-bc3m` is absent from the script's hardcoded `VERIFIED_ASSETS` registry.
   - Fix: Coordinator classified it as environment-limited and not bC3M-specific. Build Agent documented and executed a replacement bC3M-specific static verification gate.
   - Rerun result: Replacement gate passed. `verify:assets` remains a follow-up tooling/environment issue rather than a bC3M-specific merge blocker.

## Data honesty review

- Fake fallback introduced: no
- Unsupported research value changed during remediation: no
- Explicit boolean null preserved in payload: yes
- Explicit numeric null preserved in payload: yes
- Reviewed grade changed during remediation: no
- bC3M data files modified during integration remediation: no
- Real database import run: no
- Unsupported non-Ethereum deployments represented: no
- Unsupported proof-of-reserves claim introduced: no
- Unsupported AUM claim introduced: no

## Diff review

- Unrelated files changed: no
- Secrets exposed: no
- Generated noise removed: yes
- Scope matched approved files: yes
- `api/src/scripts/import-from-files.ts` changed: no, not required
- `api/src/scripts/verify-assets.ts` changed: no, follow-up tooling issue recorded instead

## Remaining warnings

1. `verify:assets` still cannot be used locally in the current environment due PostgreSQL TLS credential/security-package configuration.
2. `verify:assets` currently does not include `backed-bc3m`; add bC3M or replace the tool with normalized asset verification in a future tooling task.
3. `validate:asset-files` passes with existing bC3M evidence warnings for nullable reserve/compliance fields.
4. `validate:normalized-assets` passes with one warning for optional missing `monitoring.json`.
5. `lint` passes with pre-existing warnings:
   - web `dashboard/monitoring/page.tsx` hook dependency warning;
   - API unused variable/directive warnings in `redis.ts`, `x402.ts`, `asset.repository.ts`, `admin.ts`, `generate-monitoring.ts`, `test-sync.ts`, and `validate-asset-files.ts`.

## Follow-up tooling tasks

1. Fix local PostgreSQL TLS credential/security-package setup or move database-backed verification into CI with valid secrets.
2. Update `api/src/scripts/verify-assets.ts` so it either includes `backed-bc3m` when appropriate or is replaced by a normalized-asset verification command that supports arbitrary slugs.
3. Consider removing Prisma defaults from nullable evidence booleans in a separate schema-hardening task if future Coordinator approval is given.

## Final status

- Implementation complete: true
- Prisma migration/schema validation passed: true
- Focused regression tests passed: true
- Replacement bC3M-specific verification gate passed: true
- Dry-run import passed: true
- Typecheck passed: true
- Lint passed: true, with warnings
- Backend tests passed: true
- Production build passed: true
- Validator-remediation checks passed: true
- QA readiness checks passed: true
- `readyForQA: true`

Blocking reasons:

- None for Build handoff. The former `verify:assets` blocker is now classified as a follow-up tooling/environment issue and replaced by the bC3M-specific verification gate above.

Recommended next action: return to QA Review Agent for a recheck focused only on the Coordinator classification, replacement verification gate, and updated Build readiness. Do not merge or publish before QA passes and human approval is given.
