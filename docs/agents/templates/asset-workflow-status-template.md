# Asset Workflow Status — {assetName}

## Asset metadata

- Name: {assetName}
- Symbol: {symbol}
- Slug: {slug}
- Category: {category}
- Issuer/protocol: {issuer}
- Task type: {new asset | refresh | repair | review}
- Branch: {branch}
- Started: {date}
- Last updated: {date}

## Approved scope

### Included

- ...

### Excluded

- ...

## Current workflow status

- Current stage: {stage}
- Current status: {pending | in_progress | needs_fix | blocked | done}
- Current owner agent: {agent}
- Next agent: {agent}
- Human decision required: {yes | no}

## Agent stages

| Stage | Agent | Status | Started | Completed | Output | Notes |
|---|---|---|---|---|---|---|
| 1 | Coordinator Agent | pending | | | workflow-status.md | |
| 2 | Research Agent | pending | | | source-discovery.md and layer drafts | |
| 3 | Source Verification Agent | pending | | | source-review.md | |
| 4 | Risk & Grading Agent | pending | | | risk.json and grade-baseline.json | |
| 5 | Build Agent | pending | | | build-report.md | |
| 6 | QA Review Agent | pending | | | qa-review.md | |
| 7 | Human merge decision | pending | | | PR decision | |

## Status definitions

- `pending` — not started
- `in_progress` — currently being worked on
- `needs_fix` — output exists but requires correction
- `blocked` — cannot continue until a specific issue is resolved
- `done` — accepted and ready for handoff

## Stage acceptance criteria

### Coordinator Agent

- [ ] Task type confirmed
- [ ] Asset identity confirmed
- [ ] Scope and exclusions documented
- [ ] Required stages selected
- [ ] Next agent assigned

### Research Agent

- [ ] Source discovery completed
- [ ] Required layer drafts created or updated
- [ ] Unknown values use `null`
- [ ] Source URLs recorded
- [ ] Conflicts and stale data documented

### Source Verification Agent

- [ ] Material claims checked against sources
- [ ] Blocking issues separated from warnings
- [ ] Required corrections completed
- [ ] `safeToProceed` explicitly recorded

### Risk & Grading Agent

- [ ] Source verification passed
- [ ] `risk.json` created or updated
- [ ] `grade-baseline.json` created or updated
- [ ] Scores explained
- [ ] Blockers, warnings, and next actions documented

### Build Agent

- [ ] Approved files integrated
- [ ] Relevant validation commands run
- [ ] Build/import results recorded
- [ ] Final diff matches scope
- [ ] Ready for QA explicitly recorded

### QA Review Agent

- [ ] Full diff reviewed
- [ ] Data honesty checked
- [ ] Source and grading integrity checked
- [ ] Validation evidence reviewed
- [ ] `safeToMerge` explicitly recorded

## Current blockers

| ID | Blocking issue | Owner agent | Required resolution | Status |
|---|---|---|---|---|
| B-001 | | | | open |

Use `None` when there are no blockers.

## Current warnings

| ID | Warning | Affected layer/file | Follow-up action | Status |
|---|---|---|---|---|
| W-001 | | | | open |

Use `None` when there are no warnings.

## Decisions made

| Date | Decision | Reason | Decided by |
|---|---|---|---|
| | | | |

## Files expected

### Product data

- [ ] `data/assets/{slug}/source-discovery.md`
- [ ] `data/assets/{slug}/identity.json`
- [ ] `data/assets/{slug}/blockchain.json`
- [ ] `data/assets/{slug}/reserve.json`
- [ ] `data/assets/{slug}/institutional.json`
- [ ] `data/assets/{slug}/compliance.json`
- [ ] `data/assets/{slug}/liquidity.json`
- [ ] `data/assets/{slug}/market.json`
- [ ] `data/assets/{slug}/yield.json`
- [ ] `data/assets/{slug}/sources.json`
- [ ] `data/assets/{slug}/risk.json`
- [ ] `data/assets/{slug}/grade-baseline.json`

### Internal process reports

- [ ] `docs/agent-runs/{slug}/workflow-status.md`
- [ ] `docs/agent-runs/{slug}/source-review.md`
- [ ] `docs/agent-runs/{slug}/build-report.md`
- [ ] `docs/agent-runs/{slug}/qa-review.md`

Mark files not required by the approved scope as `N/A`.

## Latest stage result

- Stage:
- Agent:
- Verdict: `advance | return_for_fix | blocked | cancelled`
- Evidence:
- Output files:
- Remaining blockers:
- Remaining warnings:

## Next action

- Next agent:
- Required input:
- Allowed files:
- Forbidden files:
- Required output:
- Acceptance criteria:
- Stop condition:

## Human review checkpoints

- [ ] Scope approved
- [ ] Material research conflicts reviewed
- [ ] Final grade reviewed
- [ ] QA recommendation reviewed
- [ ] Final merge decision made
- [ ] Publication decision made when applicable

## Final status

- Workflow completed: {yes | no}
- Safe to merge: {true | false | pending}
- Safe to publish: {true | false | pending}
- Final recommendation:
- Human approval required: yes
