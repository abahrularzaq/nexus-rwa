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

- Current stage: Source Verification recheck
- Current status: pending
- Current owner agent: Source Verification Agent
- Next agent: Source Verification Agent
- Human decision required: no

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | done | 2026-06-24 | 2026-06-24 | workflow-status.md | Scope approved |
| 2 | Research Agent | done | 2026-06-24 | 2026-06-24 | source-discovery.md and corrected layer drafts | B-001 correction submitted |
| 3 | Source Verification Agent | pending | 2026-06-24 | | source-review.md recheck | Previous verdict was `safeToProceed: false` |
| 4 | Risk & Grading Agent | pending | | | risk.json and grade-baseline.json | Must not start before recheck |
| 5 | Build Agent | pending | | | build-report.md | |
| 6 | QA Review Agent | pending | | | qa-review.md | |
| 7 | Human merge decision | pending | | | PR decision | |

## Current blockers

| ID | Blocking issue | Owner agent | Required resolution | Status |
|---|---|---|---|---|
| B-001 | Seven non-Ethereum chain entries retained unsupported bC3M addresses | Research Agent | Remove unsupported entries and narrow evidence mapping | resolved_pending_recheck |

## Current warnings

| ID | Warning | Affected files | Follow-up |
|---|---|---|---|
| W-001 | Current bC3M final terms were not located and the English KID link returned 404 | institutional, compliance, source discovery | Keep product-specific legal gap visible |
| W-002 | Product page is dated 2025-05-30 although the no-new-issuance notice remains live | identity, liquidity | Preserve verification date and freshness warning |
| W-003 | Custodian evidence is issuer-published and lacks independent confirmation | reserve | Retain as warning |
| W-004 | Market figures are last-recorded CoinGecko values, not active-market price discovery | market, liquidity | Keep low confidence and stale-market warning |
| W-005 | Redemption settlement mechanics remain unavailable | liquidity | Keep unsupported fields null |
| W-006 | Seven networks remain within Backed's general bToken scope but are not represented as product-level bC3M deployments | blockchain, sources | Re-add only when chain-specific evidence becomes available |

## Narrow Research correction result

### Files changed

- `data/assets/backed-bc3m/blockchain.json`
- `data/assets/backed-bc3m/sources.json`
- `data/assets/backed-bc3m/source-discovery.md`
- `docs/agent-runs/backed-bc3m/workflow-status.md`

### Corrections completed

- Retained only Ethereum as a product-level verified bC3M deployment.
- Retained contract address `0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7` only for Ethereum.
- Set Ethereum `isVerified` to `true` based on the Etherscan bC3M contract and token record.
- Changed `hasWhitelist` from `false` to `null` because absence of whitelist logic was not explicitly proven.
- Removed Gnosis, Polygon, Arbitrum, Avalanche, Fantom, BNB Smart Chain, and Base entries from `blockchain.json`.
- Replaced CoinGecko contract evidence with the Ethereum Etherscan record.
- Separated Backed's general supported-network statement from product-level deployment evidence.
- Recorded all seven removed networks as unresolved in `sources.json` and `source-discovery.md`.

### Evidence decision

The official legal page supports Backed's general bToken network scope, but it does not prove a bC3M contract address on each network. CoinGecko was not used as final multi-chain contract evidence. Unsupported deployments were removed rather than inferred.

## Latest stage result

- Stage: Research correction
- Agent: Research Agent
- Verdict: `advance_to_recheck`
- Evidence: Every retained non-null address is now tied to bC3M on the stated chain through a verified explorer record.
- Output files: Listed above.
- Remaining blockers: None claimed by Research; B-001 awaits independent recheck.
- Remaining warnings: W-001 through W-006.

## Next action

- Next agent: Source Verification Agent
- Exact scope: Recheck B-001 and RC-001 through RC-003 only.
- Required input:
  - `docs/agents/03-source-verification-agent.md`
  - `docs/agent-runs/backed-bc3m/source-review.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
  - `data/assets/backed-bc3m/blockchain.json`
  - `data/assets/backed-bc3m/sources.json`
  - `data/assets/backed-bc3m/source-discovery.md`
- Allowed files:
  - `docs/agent-runs/backed-bc3m/source-review.md`
  - `docs/agent-runs/backed-bc3m/workflow-status.md`
  - narrow research corrections only if another explicit defect is found
- Forbidden files:
  - `risk.json`
  - `grade-baseline.json`
  - build and QA reports
  - application code, schema, migrations, dependencies, and unrelated assets
- Required output: Recheck verdict with explicit `safeToProceed` value.
- Acceptance criteria: Confirm only verified Ethereum remains, whitelist value is honest, and source mapping no longer overstates multi-chain evidence.
- Stop condition: Stop after the Source Verification recheck. Do not grade, build, or QA.

## Final status

- Workflow completed: no
- Safe to merge: pending
- Safe to publish: pending
- Final recommendation: Return to Source Verification Agent for blocker recheck
- Human approval required: yes
