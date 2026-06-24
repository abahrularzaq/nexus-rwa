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

## Approved scope

### Included

- Refresh and revalidate existing Backed bC3M research data.
- Update only evidence-backed research-layer fields.
- Document stale, conflicting, unsupported, or unavailable evidence.
- Prepare a handoff to the Source Verification Agent.

### Excluded

- Risk scoring or grading.
- Build, import, lint, typecheck, test, or QA.
- Application code, Prisma schema, migrations, dependencies, UI, and unrelated assets.
- Automatic merge or publication.

## Current workflow status

- Current stage: Research
- Current status: in_progress
- Current owner agent: Research Agent
- Next agent: Source Verification Agent
- Human decision required: no

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Pilot scope and Gate 1 approved |
| 2 | Research Agent | in_progress | 2026-06-24 | | source-discovery.md and layer drafts | Refresh only |
| 3 | Source Verification Agent | pending | | | source-review.md | |
| 4 | Risk & Grading Agent | pending | | | risk.json and grade-baseline.json | |
| 5 | Build Agent | pending | | | build-report.md | |
| 6 | QA Review Agent | pending | | | qa-review.md | |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

None.

## Current warnings

| ID | Warning | Affected layer/file | Follow-up action | Status |
|---|---|---|---|---|
| W-001 | Official product page is dated 2025-05-30 although the global issuance/redemption notice remains live | source-discovery.md, identity.json, liquidity.json | Source Verification should confirm the notice still governs bC3M | open |
| W-002 | Contract address is exposed by CoinGecko and explorer links, but the accessible official page does not expose the address as text | blockchain.json, sources.json | Independently verify each chain deployment | open |
| W-003 | Current Base Prospectus is issuer-level; a working bC3M-specific final terms document was not located | institutional.json, compliance.json | Treat product-specific legal coverage as unresolved | open |

## Decisions made

| Date | Decision | Reason | Decided by |
|---|---|---|---|
| 2026-06-24 | Use Backed bC3M refresh as the first agent-team pilot | Existing asset files allow a full real-world handoff test | Coordinator Agent |
| 2026-06-24 | Correct unsupported or overstated research fields instead of preserving them | Research rules require source-supported non-null values | Research Agent |

## Latest stage result

- Stage: Research
- Agent: Research Agent
- Verdict: pending
- Evidence: Research refresh in progress.
- Output files: pending
- Remaining blockers: None
- Remaining warnings: W-001, W-002, W-003

## Next action

- Next agent: Source Verification Agent
- Required input: Updated files under `data/assets/backed-bc3m/` and this workflow status.
- Allowed files: `docs/agent-runs/backed-bc3m/source-review.md` and corrections explicitly returned to Research.
- Forbidden files: risk, grade, build, QA, application code, schema, migrations, dependencies, and unrelated assets.
- Required output: Independent source review with explicit `safeToProceed` verdict.
- Acceptance criteria: Material claims checked, blockers separated from warnings, and required corrections identified.
- Stop condition: Stop after the source-verification verdict.

## Final status

- Workflow completed: no
- Safe to merge: pending
- Safe to publish: pending
- Final recommendation: Complete Research, then hand off to Source Verification
- Human approval required: yes
