# Asset Workflow Status — Backed bC3M

## Asset metadata

- Name: Backed GOVIES 0-6 Months Euro Investment Grade
- Symbol: bC3M
- Slug: backed-bc3m
- Category: Treasury
- Issuer/protocol: Backed Assets
- Task type: refresh
- Branch: pilot/backed-bc3m-research
- Started: 2026-06-24
- Last updated: 2026-06-24

## Current workflow status

- Current stage: Build remediation decision
- Current status: blocked
- Current owner agent: Coordinator Agent
- Next agent: Coordinator Agent
- Human decision required: yes

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Scope approved |
| 2 | Research Agent | done | 2026-06-24 | 2026-06-24 | source-discovery.md and corrected layer drafts | B-001 resolved |
| 3 | Source Verification Agent | done | 2026-06-24 | 2026-06-24 | source-review.md | `safeToProceed: true` |
| 4 | Risk & Grading Agent | done | 2026-06-24 | 2026-06-24 | risk.json and grade-baseline.json | Research grade assigned |
| 5 | Build Agent | blocked | 2026-06-24 | 2026-06-24 | build-report.md | Importer/schema blockers; checks not executable in current environment |
| 6 | QA Review Agent | pending | | | qa-review.md | Must not start |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

| ID | Blocking issue | Affected path | Required resolution | Status |
|---|---|---|---|---|
| BLD-001 | Reviewed unknown booleans are coerced to factual defaults during import | `api/src/lib/asset-file-import.ts`, Prisma boolean fields | Approve importer/schema handling for explicit unknown values and add regression coverage | open |
| BLD-002 | Explicit numeric null values may not clear stale DB values during existing-asset refresh | `api/src/lib/asset-file-import.ts`, `api/src/scripts/import-from-files.ts` | Preserve explicit null in update payloads and test clearing old `liquidityScore` and `aumUsd` | open |
| BLD-003 | Repository-native validation, import dry-run, typecheck, lint, tests, and build were not executed | Build environment | Run all required commands in a working checkout after remediation | open |

## Resolved blockers

| ID | Blocking issue | Resolution | Status |
|---|---|---|---|
| B-001 | Seven non-Ethereum chain entries retained unsupported bC3M addresses | Unsupported deployments removed; Ethereum retained with verified Etherscan evidence; source mapping narrowed | resolved |

## Current warnings

| ID | Warning | Follow-up |
|---|---|---|
| W-001 | Current bC3M-specific final terms were not located and the English KID link returned 404 | Obtain product-specific legal documents |
| W-002 | Product page carries a 2025-05-30 update label | Recheck official product details periodically |
| W-003 | Custodian evidence is issuer-published only | Obtain independent service-provider confirmation |
| W-004 | Market values are last-recorded CoinGecko observations with zero active volume | Do not treat as active pricing, NAV, AUM, or executable liquidity |
| W-005 | Redemption settlement mechanics are unavailable | Confirm period, asset, minimum, process, and suspension terms |
| W-006 | Seven networks remain unresolved as product-level bC3M deployments | Re-add only with chain-specific evidence |
| W-007 | No product-specific reserve report, audit, attestation, assurance report, or PoR was verified | Obtain authoritative product-level reserve evidence |
| W-008 | New issuance is closed and the product is redemption-only for existing holders | Confirm long-term lifecycle and redemption support |

## Risk & Grading result

- Grade: `research`
- Score: `58`
- Baseline date: `2026-06-24`
- Blockers at grading stage: none
- Warnings preserved: W-001 through W-008

## Build result

- Output: `docs/agent-runs/backed-bc3m/build-report.md`
- Build passed: false
- Import passed: not run
- `readyForQA: false`
- Diff scope: clean; only bC3M asset and agent-run files changed
- Grade enum: compatible with existing `research` baselines
- Ethereum-only blockchain file: statically compatible
- Risk file fields and `MEDIUM` level: statically compatible
- File-level `liquidityScore: null` and `aumUsd: null`: semantically correct but not safely integrated by current refresh importer

### Deterministic findings

1. `hasWhitelist: null` maps to `false`.
2. `hasProofOfReserves: null` maps to `false`.
3. `kycRequired: null` maps to `true`.
4. `sanctionsScreening: null` maps to `false`.
5. Numeric `null` maps to `undefined`, so existing DB values such as old liquidity score or AUM may remain unchanged.
6. Prisma currently defines the affected boolean fields as non-null, so reviewed unknown states cannot be preserved without an explicit modeling decision.

## Latest stage result

- Stage: Build
- Agent: Build Agent
- Verdict: `blocked`
- Evidence: Static inspection of the repository-native importer and Prisma schema shows data-honesty loss during existing-asset import; executable checks were unavailable because the environment could not check out the repository.
- Output files:
  - `docs/agent-runs/backed-bc3m/build-report.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
- Remaining blockers: BLD-001 through BLD-003
- Remaining warnings: W-001 through W-008

## Next action

- Next agent: Coordinator Agent
- Decision required: Approve a separate, narrow integration-remediation scope before QA.
- Recommended scope:
  - define how unknown booleans are represented in Prisma and importer payloads;
  - preserve explicit JSON null for nullable fields during existing-record updates;
  - add regression tests for bC3M refresh clearing stale `liquidityScore` and `aumUsd`;
  - run asset validation, normalized validation, verification, dry-run import, typecheck, lint, tests, and production build.
- Forbidden until resolved:
  - QA approval
  - merge
  - publication
- Stop condition: Coordinator must decide whether to authorize importer-only remediation or importer plus schema migration.

## Final status

- Workflow completed: no
- Safe to merge: no
- Safe to publish: no
- Final recommendation: Return to Coordinator for integration-remediation decision
- Human approval required: yes
