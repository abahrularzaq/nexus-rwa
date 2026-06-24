# Build Report — Backed bC3M Refresh

## Metadata

- Task type: Existing asset refresh integration
- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Slug: `backed-bc3m`
- Branch: `pilot/backed-bc3m-research`
- Date: 2026-06-24
- Agent: Build Agent

## Approved scope

Included:

- Validate the reviewed bC3M asset files and grading outputs.
- Inspect repository-native validation and import paths.
- Check null handling, enum compatibility, required files, and diff scope.
- Record deterministic blockers and hand off without broadening scope.

Excluded:

- Primary research or grading reinterpretation.
- Application-code, Prisma-schema, migration, architecture, or UI changes.
- Unrelated assets.
- QA approval, merge, or publication.

## Entry conditions

- Source Verification: passed.
- `safeToProceed: true`: confirmed.
- `risk.json`: present.
- `grade-baseline.json`: present.
- Risk & Grading stage: complete.

## Files changed before Build

The branch is 19 commits ahead of `main` and changes only:

- approved files under `data/assets/backed-bc3m/`
- `docs/agent-runs/backed-bc3m/source-review.md`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

No unrelated asset, application-code, schema, migration, or UI file appears in the branch diff.

## Files created by Build

- `docs/agent-runs/backed-bc3m/build-report.md`

## Files modified by Build

- `docs/agent-runs/backed-bc3m/workflow-status.md`

## Files intentionally unchanged

- All files under `data/assets/backed-bc3m/`
- Application code
- Prisma schema and migrations
- Unrelated assets
- QA report

No deterministic data correction could safely resolve the integration blockers without changing importer or schema behavior outside the approved scope.

## Static compatibility findings

### Passed static checks

1. **Required asset files are present**
   - The expected identity, blockchain, reserve, institutional, compliance, liquidity, market, yield, sources, risk, and grade-baseline files exist in the asset folder.

2. **Blockchain deployment scope**
   - `blockchain.json` contains only the verified Ethereum deployment.
   - The contract address is non-null and therefore will not be skipped by the current importer.
   - Removed chain entries will be deleted by the importer because the blockchain relation uses `deleteMany: {}` followed by recreation from the payload.

3. **Grade value compatibility**
   - `grade: "research"` follows an existing repository convention used by other grade-baseline files.
   - Existing baseline field names and profile structure are preserved.

4. **Risk file field compatibility**
   - `risk.json` uses the fields consumed by `mapAssetFilesToImportPayload`, including `overallScore`, `overallLevel`, component risk fields, factors, mitigants, date, and method.
   - `overallLevel: "MEDIUM"` is accepted by the importer's level normalizer.

5. **Nullable liquidity score at file level**
   - Prisma defines `AssetLiquidity.liquidityScore` as nullable.
   - The file value `null` is semantically valid for unknown or deliberately removed evidence.

6. **Unsupported AUM removed at file level**
   - `market.json` no longer represents market capitalization as `aumUsd`.

7. **Warnings preserved**
   - Legal, reserve, redemption, market, issuance, source, and unresolved deployment warnings remain visible in `grade-baseline.json`, `risk.json`, `source-review.md`, and workflow status.

## Deterministic integration blockers

### BLD-001 — Nullable booleans are coerced into unsupported claims

Affected path: `api/src/lib/asset-file-import.ts`

The current importer maps booleans using defaults:

- `hasWhitelist: asBool(row.hasWhitelist) ?? false`
- `hasProofOfReserves: asBool(reserve.hasProofOfReserves) ?? false`
- `kycRequired: asBool(compliance.kycRequired) ?? true`
- `sanctionsScreening: asBool(compliance.sanctionsScreening) ?? false`

Consequences for this refresh:

- `blockchain.hasWhitelist: null` becomes `false`.
- `reserve.hasProofOfReserves: null` becomes `false`.
- `compliance.kycRequired: null` becomes `true`.
- `compliance.sanctionsScreening: null` becomes `false`.

These conversions overwrite evidence-honesty decisions with inferred values. Prisma currently defines these fields as non-null booleans with defaults, so the database schema cannot preserve the reviewed unknown state.

Resolution required:

- Coordinator must approve a separate importer/schema compatibility task; or
- the data model must explicitly define how unknown boolean evidence is represented without converting it into a factual true/false claim.

The Build Agent did not change application code or schema because both were forbidden in this scope.

### BLD-002 — Null numeric values do not clear stale database values during refresh

Affected path: `api/src/lib/asset-file-import.ts` and `api/src/scripts/import-from-files.ts`

The importer maps `null` numeric values to `undefined` through `asNumber` / `asInt`. The existing-asset import performs Prisma upserts using these payloads. In Prisma updates, omitted or undefined fields are not cleared.

Consequences:

- `liquidity.liquidityScore: null` may leave the previous database score unchanged.
- `market.aumUsd: null` may leave the previous unsupported AUM unchanged.
- Other intentionally cleared optional numeric fields may have the same behavior.

This is material because the task is an existing asset refresh rather than a new record creation.

Resolution required:

- Update the importer to distinguish explicit JSON `null` from an absent field and pass `null` to nullable Prisma columns; then add a regression test for existing-asset refreshes.

The Build Agent did not make this application-code change because it was outside the allowed files.

## Commands and checks

| Command or check | Result | Notes |
|---|---|---|
| `git clone --branch pilot/backed-bc3m-research ...` | not run successfully | Execution environment could not resolve `github.com`; no local checkout was available |
| Branch compare against `main` | passed | GitHub compare reports branch ahead by 19 commits with changes confined to bC3M asset and agent-run files |
| GitHub Actions runs for current head | not available | No workflow runs were associated with the checked head commit |
| JSON parsing | not run | No executable checkout was available; files were inspected through GitHub content API only |
| Required-file validation | static pass | Required files were individually present; repository script was not executed |
| `npm run validate:asset-files --workspace=api -- --slug=backed-bc3m` | not run | No local checkout/dependencies |
| `npm run validate:normalized-assets --workspace=api` | not run | No local checkout/dependencies |
| `npm run verify:assets --workspace=api` | not run | No local checkout/dependencies |
| `npm run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run` | blocked before execution | Static inspection shows payload coercion and stale-null behavior would make the dry-run plan misleading |
| `npm run typecheck` | not run | No local checkout/dependencies |
| `npm run lint` | not run | No local checkout/dependencies |
| `npm run test:backend` | not run | No local checkout/dependencies |
| `npm run build` | not run | No local checkout/dependencies |
| Final diff scope review | passed | No unrelated changed paths found |

## Errors and fixes

### Environment limitation

- Error: Git checkout failed because the execution environment could not resolve `github.com`.
- Impact: Repository-native validation, typecheck, lint, tests, import dry-run, and production build could not be executed.
- Fix applied: None; results are reported as not run rather than passed.

### Task-related deterministic blockers

- BLD-001 and BLD-002 were identified through static inspection.
- No fix was applied because the required changes affect forbidden application-code and schema paths.

## Data honesty review

- Fake fallback introduced: no
- Unsupported research value changed by Build: no
- File-level null handling preserved: yes
- Import-path null handling safe: no
- Reviewed grade changed by Build: no
- Unsupported AUM present in file: no
- Unsupported multi-chain deployment present: no

## Diff review

- Unrelated files changed: no
- Secrets exposed: none observed
- Generated noise introduced: no
- Scope matched: yes
- Application-code changes made: no
- Schema changes made: no

## Remaining warnings

1. Current bC3M final terms and working KID remain unavailable.
2. Product-page freshness is limited.
3. Custodian evidence remains issuer-published only.
4. Market values are inactive last-recorded observations.
5. Redemption settlement mechanics remain unknown.
6. Seven non-Ethereum deployments remain unresolved.
7. Product-specific reserve/audit/attestation evidence remains unavailable.
8. New issuance remains closed.
9. Full repository checks remain unexecuted due environment limitations.

## Final status

- Build passed: false
- Import passed: not run
- `readyForQA: false`
- Blocking reasons:
  1. Current importer/schema cannot preserve reviewed unknown boolean values.
  2. Explicit null numeric values may fail to clear stale database values during existing-asset refresh.
  3. Repository-native validation, typecheck, lint, tests, dry-run import, and production build were not executed.

## Required next action

Return to the Coordinator Agent for a narrowly scoped integration-remediation decision. A follow-up task should authorize changes to the importer and, if needed, Prisma nullability, with regression tests proving that:

- explicit JSON null remains unknown instead of becoming true or false;
- explicit numeric null clears stale values in existing records;
- bC3M dry-run and import preserve the verified package exactly.

Do not proceed to QA until the remediation is implemented and all repository-native checks are run successfully.
