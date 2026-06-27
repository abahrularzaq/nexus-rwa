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
- Last updated: 2026-06-27

## Current workflow status

- Current stage: Coordinator decision after QA intake
- Current status: needs_fix
- Current owner agent: Build Agent
- Next agent: Build Agent
- Human decision required: no

## Coordinator decision

### Integration decision

- Decision gate: `advance`
- Selected option: **B - importer plus Prisma nullable-boolean migration**
- Reason: Importer-only remediation cannot preserve reviewed unknown boolean states because the previous Prisma columns were non-null booleans. Keeping the old schema would force `null` evidence into a factual `true` or `false` value, violating Nexus RWA data-honesty rules.

### Final blocker classification decision

- Decision gate: `return_for_fix`
- Issue: `BLD-003B / QA-001`
- Decision: `verify:assets` is **environment-limited and not sufficient/applicable as the bC3M-specific verification gate in its current form**.
- Reason: `api/src/scripts/verify-assets.ts` reads a hardcoded `VERIFIED_ASSETS` registry and queries those IDs from the configured database. The registry does not include `backed-bc3m`, so a successful run would not independently verify the bC3M refresh. The observed failure is also caused by local PostgreSQL TLS credential setup, not by a bC3M data, schema, importer, or validator failure.
- Merge impact: this still blocks merge until the Build Agent records a replacement bC3M-specific verification gate and updates the Build report. The blocker is no longer “must rerun `verify:assets` locally”; it is “document and execute an applicable bC3M verification gate.”

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Initial scope approved |
| 2 | Research Agent | done | 2026-06-24 | 2026-06-24 | research layers | Blockchain correction completed |
| 3 | Source Verification Agent | done | 2026-06-24 | 2026-06-24 | source-review.md | `safeToProceed: true` |
| 4 | Risk & Grading Agent | done | 2026-06-24 | 2026-06-24 | risk.json and grade-baseline.json | Research grade assigned |
| 5A | Build Agent | blocked | 2026-06-24 | 2026-06-24 | build-report.md | BLD-001 through BLD-003 found |
| 5B | Build Agent - integration remediation | blocked | 2026-06-25 | 2026-06-25 | code, migration, tests, updated build-report.md | BLD-001, BLD-002, and BLD-003A fixed; BLD-003B now classified by Coordinator as environment-limited/not bC3M-specific |
| 6 | QA Review Agent | blocked | 2026-06-27 | 2026-06-27 | qa-review.md | `safeToMerge: false`; requested Coordinator classification of BLD-003B |
| 5C | Build Agent - replacement verification documentation | pending | | | updated build-report.md and workflow-status.md | Must document bC3M-specific replacement verification gate |
| 6B | QA Review Agent - recheck | pending | | | updated qa-review.md or addendum | Only after Build records replacement verification and `readyForQA: true` |
| 7 | Human merge decision | pending | | | PR decision | Must wait for QA pass |

## Current blockers

| ID | Blocking issue | Required resolution | Status |
|---|---|---|---|
| BLD-001 | Explicit null booleans are converted to default true/false values | Make relevant Prisma booleans nullable and preserve explicit null through the importer | fixed_by_build |
| BLD-002 | Explicit numeric nulls do not clear stale existing DB values | Distinguish absent fields from explicit null and pass null to nullable Prisma fields | fixed_by_build |
| BLD-003A | Normalized asset validator rejects approved nullable evidence booleans | Permit `boolean | null` only for the four approved evidence fields | fixed_by_build |
| BLD-003B | `verify:assets` cannot run locally and does not verify bC3M in its current hardcoded registry form | Replace with documented bC3M-specific verification gate; keep `verify:assets` as a follow-up/tooling issue | classified_needs_build_update |
| QA-001 | Build report still states `readyForQA: false` | Build Agent must update report after replacement verification is documented and executed | open |

## Required replacement verification gate

The Build Agent must document and, where possible, execute the following bC3M-specific replacement verification before returning to QA:

1. Confirm `api/src/scripts/verify-assets.ts` does not include `backed-bc3m` in `VERIFIED_ASSETS`, so the script is not a bC3M-specific gate.
2. Confirm the branch diff contains exactly one bC3M product-level blockchain row in `data/assets/backed-bc3m/blockchain.json`.
3. Confirm that row is Ethereum only:
   - `chain: "ethereum"`
   - `chainId: 1`
   - `contractAddress: "0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7"`
   - `explorerUrl: "https://etherscan.io/address/0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7"`
   - `isVerified: true`
   - `hasWhitelist: null`
4. Confirm Source Verification recorded B-001 and RC-001 through RC-003 as resolved.
5. Confirm dry-run import completed successfully for `backed-bc3m` after importer/schema/validator remediation.
6. Confirm `validate:asset-files --slug=backed-bc3m`, `validate:normalized-assets --slug=backed-bc3m`, focused tests, typecheck, backend tests, and production build remain passed.
7. Record `verify:assets` as a follow-up tooling/environment issue, not as a blocker for this bC3M-specific branch, because it currently does not include `backed-bc3m` and failed before useful bC3M validation due local DB TLS configuration.

## Allowed files for next Build Agent step

- `docs/agent-runs/backed-bc3m/build-report.md`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

## Forbidden files for next Build Agent step

- All files under `data/assets/backed-bc3m/`
- `docs/agent-runs/backed-bc3m/source-review.md`
- `docs/agent-runs/backed-bc3m/qa-review.md`
- Application code
- Prisma schema or migrations
- Tests
- Web files
- Unrelated assets
- Dependencies or lockfiles
- Merge or publication

## Exact next commands

The Build Agent should run or cite already-run equivalent outputs where available:

```bash
npm.cmd run validate:asset-files --workspace=api -- --slug=backed-bc3m
npm.cmd run validate:normalized-assets --workspace=api -- --slug=backed-bc3m
node --import tsx --test src/lib/asset-file-import.test.ts
node --import tsx --test src/scripts/validate-normalized-assets.test.ts
npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run
npm.cmd run typecheck
npm.cmd run test:backend
npm.cmd run build
```

For the bC3M-specific static verification, use repository/file inspection rather than `verify:assets`:

```bash
git diff --name-only main...pilot/backed-bc3m-research
git diff main...pilot/backed-bc3m-research -- data/assets/backed-bc3m/blockchain.json
node -e "const fs=require('fs'); const rows=JSON.parse(fs.readFileSync('data/assets/backed-bc3m/blockchain.json','utf8')); console.log(rows)"
```

Stop after updating `build-report.md` and `workflow-status.md`. Do not perform QA again, merge, or publish.

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

## Implementation semantics

### Boolean tri-state

For each approved boolean field:

| JSON state | Import meaning | Build status | QA status |
|---|---|---|---|
| `true` | Store `true` | implemented and tested | accepted |
| `false` | Store `false` | implemented and tested | accepted |
| `null` | Store `null` | implemented and tested | accepted |
| field absent | Preserve absence as `undefined` in payload mapping | implemented and tested | accepted |

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

| JSON state | Import meaning | Build status | QA status |
|---|---|---|---|
| number | Store number | implemented and tested | accepted |
| `null` | Clear existing DB value by storing `null` | implemented and tested in payload mapping | accepted at payload level |
| field absent | Leave existing DB value unchanged | implemented and tested in helper mapping | accepted at payload level |

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
| `npm.cmd run verify:assets --workspace=api` | failed due local PostgreSQL TLS credentials; Coordinator classified as environment-limited and not bC3M-specific in current script form |
| `npm.cmd run import:asset-files --workspace=api -- --slug=backed-bc3m --dry-run` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run lint` | passed with warnings |
| `npm.cmd run test:backend` | passed: 68 tests, 0 failed |
| `npm.cmd run build` | passed |

## QA result

- Output: `docs/agent-runs/backed-bc3m/qa-review.md`
- QA verdict: `BLOCKED — ADDITIONAL INPUT REQUIRED`
- `safeToMerge: false`
- `safeToMergeRecommendation: false`
- Scope review: pass
- Data honesty review: pass
- Source integrity review: pass
- Grading integrity review: pass
- Code/schema remediation review: pass
- Merge readiness: blocked by BLD-003B / QA-001 pending Coordinator classification and Build report update

## Final status

- Workflow completed: no
- Safe to merge: no
- Safe to publish: no
- Next action: Build Agent must update `build-report.md` with the replacement bC3M-specific verification gate, then set readiness for QA recheck only if that gate is satisfied.
- Human approval required: yes before merge or publication
