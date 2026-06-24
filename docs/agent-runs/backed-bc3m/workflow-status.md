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

- Current stage: Risk & Grading
- Current status: pending
- Current owner agent: Risk & Grading Agent
- Next agent: Risk & Grading Agent
- Human decision required: no

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Scope approved |
| 2 | Research Agent | done | 2026-06-24 | 2026-06-24 | source-discovery.md and corrected layer drafts | B-001 resolved |
| 3 | Source Verification Agent | done | 2026-06-24 | 2026-06-24 | source-review.md | `safeToProceed: true` after recheck |
| 4 | Risk & Grading Agent | pending | | | risk.json and grade-baseline.json | Ready to start |
| 5 | Build Agent | pending | | | build-report.md | |
| 6 | QA Review Agent | pending | | | qa-review.md | |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

None.

## Resolved blockers

| ID | Blocking issue | Resolution | Status |
|---|---|---|---|
| B-001 | Seven non-Ethereum chain entries retained unsupported bC3M addresses | Unsupported deployments removed; Ethereum retained with verified Etherscan evidence; source mapping narrowed | resolved |

## Current warnings

| ID | Warning | Affected files | Follow-up |
|---|---|---|---|
| W-001 | Current bC3M final terms were not located and the English KID link returned 404 | institutional, compliance, source discovery | Reflect legal-document gap in grading warnings |
| W-002 | Product page is dated 2025-05-30 although the no-new-issuance notice remains live | identity, liquidity | Preserve freshness warning |
| W-003 | Custodian evidence is issuer-published and lacks independent confirmation | reserve | Reflect source concentration in grading |
| W-004 | Market figures are last-recorded CoinGecko values, not active-market price discovery | market, liquidity | Do not overstate liquidity or market confidence |
| W-005 | Redemption settlement mechanics remain unavailable | liquidity | Keep unsupported fields null and reflect uncertainty |
| W-006 | Seven networks are within Backed's general bToken scope but are not represented as product-level bC3M deployments | blockchain, sources | Re-add only with chain-specific evidence |

## Research correction result

- Only Ethereum remains in `blockchain.json`.
- Ethereum address `0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7` is tied to bC3M through Etherscan.
- `isVerified` is `true` for Ethereum.
- `hasWhitelist` is `null`.
- Gnosis, Polygon, Arbitrum, Avalanche, Fantom, BNB Smart Chain, and Base were removed as unverified product-level deployments.
- `sources.json` separates general issuer network scope, verified Ethereum evidence, unresolved networks, and secondary market evidence.
- CoinGecko is not used as final contract evidence.

## Source Verification recheck result

- Output: `docs/agent-runs/backed-bc3m/source-review.md`
- Verdict: `advance`
- `safeToProceed: true`
- B-001: resolved
- RC-001: resolved
- RC-002: resolved
- RC-003: resolved
- Blockchain layer: pass with warning
- Sources layer: pass
- Remaining issues: non-blocking warnings W-001 through W-006

## Latest stage result

- Stage: Source Verification recheck
- Agent: Source Verification Agent
- Verdict: `advance`
- Evidence: Only the verified Ethereum deployment remains; unsupported whitelist and multi-chain claims were removed; source mapping now matches actual evidence.
- Output files:
  - `docs/agent-runs/backed-bc3m/source-review.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
- Remaining blockers: None
- Remaining warnings: W-001 through W-006

## Next action

- Next agent: Risk & Grading Agent
- Exact scope: Evaluate the verified bC3M package and update evidence-based risk and grade outputs only.
- Required input:
  - `docs/agents/README.md`
  - `docs/agents/04-risk-grading-agent.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
  - `docs/agent-runs/backed-bc3m/source-review.md`
  - all verified research-layer files under `data/assets/backed-bc3m/`
  - existing `risk.json` and `grade-baseline.json`
- Allowed files:
  - `data/assets/backed-bc3m/risk.json`
  - `data/assets/backed-bc3m/grade-baseline.json`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
- Forbidden files:
  - research-layer files unless returning an explicit blocker
  - build and QA reports
  - application code, schema, migrations, dependencies, and unrelated assets
- Required output: Evidence-based risk and grade refresh with blockers, warnings, next actions, and handoff to Build Agent.
- Acceptance criteria: Grade does not exceed verified evidence; unresolved legal, reserve, liquidity, market, and deployment limitations remain visible.
- Stop condition: Stop after Risk & Grading outputs and handoff. Do not build or QA.

## Final status

- Workflow completed: no
- Safe to merge: pending
- Safe to publish: pending
- Final recommendation: Advance to Risk & Grading Agent
- Human approval required: yes
