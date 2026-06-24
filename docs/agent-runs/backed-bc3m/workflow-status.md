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

- Current stage: Build
- Current status: pending
- Current owner agent: Build Agent
- Next agent: Build Agent
- Human decision required: no

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Scope approved |
| 2 | Research Agent | done | 2026-06-24 | 2026-06-24 | source-discovery.md and corrected layer drafts | B-001 resolved |
| 3 | Source Verification Agent | done | 2026-06-24 | 2026-06-24 | source-review.md | `safeToProceed: true` |
| 4 | Risk & Grading Agent | done | 2026-06-24 | 2026-06-24 | risk.json and grade-baseline.json | Research grade assigned |
| 5 | Build Agent | pending | | | build-report.md | Ready to start |
| 6 | QA Review Agent | pending | | | qa-review.md | |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

None.

## Resolved blockers

| ID | Blocking issue | Resolution | Status |
|---|---|---|---|
| B-001 | Seven non-Ethereum chain entries retained unsupported bC3M addresses | Unsupported deployments removed; Ethereum retained with verified Etherscan evidence; source mapping narrowed | resolved |

## Current warnings

| ID | Warning | Scoring impact | Follow-up |
|---|---|---|---|
| W-001 | Current bC3M-specific final terms were not located and the English KID link returned 404 | Reduced legal and source confidence | Obtain product-specific legal documents |
| W-002 | Product page carries a 2025-05-30 update label | Reduced freshness confidence | Recheck official product details periodically |
| W-003 | Custodian evidence is issuer-published only | Reduced reserve and counterparty confidence | Obtain independent service-provider confirmation |
| W-004 | Market values are last-recorded CoinGecko observations with zero active volume | Material reduction to liquidity, market, and risk scores | Refresh only with clearly defined current market evidence |
| W-005 | Redemption settlement mechanics are unavailable | Material reduction to liquidity and legal scores | Confirm period, asset, minimum, process, and suspension terms |
| W-006 | Seven networks remain unresolved as product-level bC3M deployments | No multi-chain credit awarded | Re-add only with chain-specific evidence |
| W-007 | No bC3M-specific reserve report, audit, attestation, assurance report, or PoR was verified | Material reduction to reserve score | Obtain authoritative product-level reserve evidence |
| W-008 | New issuance is closed and the product is operationally redemption-only for existing holders | Limits primary-market growth and accessibility | Confirm long-term product lifecycle and redemption support |

## Risk & Grading result

### Final grade

- Grade: `research`
- Total score: `58`
- Previous grade: `analytics`
- Previous score: `72`
- Baseline date: `2026-06-24`
- Grading profile: `asset_backed`

### Component scores

| Component | Score | Rationale |
|---|---:|---|
| Completeness | 78 | All required files exist and unknown values are represented honestly, but important product-level legal, reserve, redemption, and market fields remain null |
| Source | 75 | Strong official coverage for core identity and structure plus verified Ethereum evidence, offset by missing product-specific documents and secondary market reliance |
| Legal | 68 | Issuer, jurisdiction, prospectus framework, eligibility, and redemption right are supported, but current final terms, KID, and settlement mechanics are missing |
| Reserve | 48 | Underlying and issuer-published custodians are known, but no product-specific reserve composition, ratio, reporting, audit, attestation, assurance, or PoR exists in the verified package |
| Liquidity | 22 | Redemption remains available, but issuance is closed, settlement mechanics are unknown, and observable exchange volume is zero |
| Risk quality | 48 | Verified Ethereum contract and short-duration sovereign exposure mitigate risk, while issuer dependence, source gaps, inactive trading, and operational uncertainty remain material |

### Scoring method

The existing repository schema does not expose a reproducible permanent total-score formula in the reviewed asset files. The `58` total is therefore an evidence-based proposed baseline informed by the component profile and grade guardrails, not a silent new formula. Human review remains required.

### Grade decision

`institutional` is not supportable because product-level legal, reserve, redemption, and liquidity evidence is incomplete. `analytics` would also overstate confidence because the product lacks current product-specific legal documents, reserve reporting, active price discovery, and defined redemption settlement mechanics. The asset remains trackable with a verified issuer, underlying, legal framework, and Ethereum contract, making `research` the most defensible grade.

### Files updated

- `data/assets/backed-bc3m/risk.json`
- `data/assets/backed-bc3m/grade-baseline.json`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

## Latest stage result

- Stage: Risk & Grading
- Agent: Risk & Grading Agent
- Verdict: `advance`
- Evidence: Source Verification passed with `safeToProceed: true`; all scores were reduced or retained according to verified evidence and unresolved warnings.
- Output files:
  - `data/assets/backed-bc3m/risk.json`
  - `data/assets/backed-bc3m/grade-baseline.json`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
- Remaining blockers: None
- Remaining warnings: W-001 through W-008

## Next action

- Next agent: Build Agent
- Exact scope: Validate and integrate only the approved bC3M data and agent-run files already changed on this branch.
- Required input:
  - `docs/agents/README.md`
  - `docs/agents/05-build-agent.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
  - `docs/agent-runs/backed-bc3m/source-review.md`
  - all changed files under `data/assets/backed-bc3m/`
- Allowed files:
  - `docs/agent-runs/backed-bc3m/build-report.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
  - narrowly scoped corrections required for deterministic validation failures
- Forbidden files:
  - unrelated assets
  - schema or architecture changes without explicit approval
  - UI redesign
  - grade reinterpretation unless returning a blocker
  - QA report
  - automatic merge
- Required output: Validation, import, typecheck, lint, test, and build results applicable to the repository; final diff scope; explicit readiness for QA.
- Acceptance criteria: JSON and repository validations pass or failures are reported honestly; no unrelated changes; no fake fallback or placeholder data.
- Stop condition: Stop after Build output and handoff to QA. Do not perform QA or merge.

## Final status

- Workflow completed: no
- Safe to merge: pending
- Safe to publish: pending
- Final recommendation: Advance to Build Agent
- Human approval required: yes
