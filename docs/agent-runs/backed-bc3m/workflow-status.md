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

- Current stage: Research correction
- Current status: needs_fix
- Current owner agent: Research Agent
- Next agent: Research Agent
- Human decision required: no

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Scope approved |
| 2 | Research Agent | needs_fix | 2026-06-24 | | source-discovery.md and layer drafts | Blockchain evidence corrections required |
| 3 | Source Verification Agent | done | 2026-06-24 | 2026-06-24 | source-review.md | `safeToProceed: false` |
| 4 | Risk & Grading Agent | pending | | | risk.json and grade-baseline.json | Must not start |
| 5 | Build Agent | pending | | | build-report.md | |
| 6 | QA Review Agent | pending | | | qa-review.md | |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

| ID | Blocking issue | Owner agent | Required resolution | Status |
|---|---|---|---|---|
| B-001 | Seven non-Ethereum chain entries retain non-null bC3M contract addresses without chain-specific official or verified-explorer evidence | Research Agent | Verify each retained deployment or remove/null unsupported addresses | open |

## Current warnings

| ID | Warning | Affected files | Follow-up |
|---|---|---|---|
| W-001 | Current bC3M final terms were not located and the English KID link returned 404 | institutional, compliance, source discovery | Keep product-specific legal gap visible |
| W-002 | Product page is dated 2025-05-30 although the no-new-issuance notice remains live | identity, liquidity | Preserve verification date and freshness warning |
| W-003 | Custodian evidence is issuer-published and lacks independent confirmation | reserve | Retain as warning |
| W-004 | Market figures are last-recorded CoinGecko values, not active-market price discovery | market, liquidity | Keep low confidence and stale-market warning |
| W-005 | Redemption settlement mechanics remain unavailable | liquidity | Keep unsupported fields null |

## Research result

### Files changed

- `data/assets/backed-bc3m/source-discovery.md`
- `data/assets/backed-bc3m/reserve.json`
- `data/assets/backed-bc3m/compliance.json`
- `data/assets/backed-bc3m/liquidity.json`
- `data/assets/backed-bc3m/market.json`
- `data/assets/backed-bc3m/sources.json`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

### Files reviewed but unchanged

- `data/assets/backed-bc3m/identity.json`
- `data/assets/backed-bc3m/blockchain.json`
- `data/assets/backed-bc3m/institutional.json`
- `data/assets/backed-bc3m/yield.json`

## Source Verification result

- Output: `docs/agent-runs/backed-bc3m/source-review.md`
- Verdict: `return_for_fix`
- `safeToProceed: false`
- Verified: identity, issuer, underlying, live no-new-issuance notice, redemption availability, general fee, current Base Prospectus status, service-provider listing, U.S. restriction, conditional UK wording, conservative reserve fields, and last-recorded market-data labeling.
- Failed: seven non-Ethereum contract deployments lack adequate chain-specific evidence.
- Required corrections:
  1. Verify or remove/null unsupported addresses for Gnosis, Polygon, Arbitrum, Avalanche, Fantom, BNB Smart Chain, and Base.
  2. Narrow the contract-address source mapping in `sources.json` to evidence actually verified.
  3. Change unsupported `hasWhitelist: false` values to `null` unless proven.

## Latest stage result

- Stage: Source Verification
- Agent: Source Verification Agent
- Verdict: `return_for_fix`
- Evidence: Ethereum contract is independently identified as bC3M on Etherscan; equivalent evidence was not established for seven other chain entries.
- Output files:
  - `docs/agent-runs/backed-bc3m/source-review.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
- Remaining blockers: B-001
- Remaining warnings: W-001 through W-005

## Next action

- Next agent: Research Agent
- Exact scope: Correct blockchain deployment evidence and the related source map only.
- Required input:
  - `docs/agents/02-research-agent.md`
  - `docs/agent-runs/backed-bc3m/source-review.md`
  - `data/assets/backed-bc3m/blockchain.json`
  - `data/assets/backed-bc3m/sources.json`
- Allowed files:
  - `data/assets/backed-bc3m/blockchain.json`
  - `data/assets/backed-bc3m/sources.json`
  - `data/assets/backed-bc3m/source-discovery.md` only if evidence notes require correction
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
- Forbidden files:
  - `risk.json`
  - `grade-baseline.json`
  - build and QA reports
  - application code, schema, migrations, dependencies, and unrelated assets
- Required output: Resolved chain evidence, corrected whitelist fields, corrected source map, and a return handoff to Source Verification.
- Acceptance criteria: Every retained non-null address is tied to bC3M on the stated chain; unsupported values use `null`; source mapping matches actual evidence.
- Stop condition: Stop after completing the narrow correction package. Do not grade, build, or QA.

## Final status

- Workflow completed: no
- Safe to merge: pending
- Safe to publish: pending
- Final recommendation: Return to Research Agent for blockchain evidence corrections
- Human approval required: yes
