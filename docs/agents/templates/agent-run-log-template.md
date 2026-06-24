# Agent Run Log — {assetOrTask}

## Run metadata

- Date: {date}
- Asset/task: {assetOrTask}
- Slug: {slug or n/a}
- Branch: {branch}
- Pull request: {PR URL or pending}
- Coordinator: {name or agent instance}
- Current stage: {stage}
- Run status: {in_progress | needs_fix | blocked | done}

## Objective

Describe the exact objective of this agent run.

## Approved scope

### Included

- ...

### Excluded

- ...

## Inputs reviewed

- ...

## Agent execution summary

### Coordinator Agent

- Status: {pending | in_progress | needs_fix | blocked | done | n/a}
- Input:
- Output:
- Decision:
- Notes:

### Research Agent

- Status: {pending | in_progress | needs_fix | blocked | done | n/a}
- Input:
- Output:
- Primary sources used:
- Secondary sources used:
- Missing evidence:
- Notes:

### Source Verification Agent

- Status: {pending | in_progress | needs_fix | blocked | done | n/a}
- Input:
- Output:
- `safeToProceed`: {true | false | pending}
- Blocking issues:
- Warnings:
- Notes:

### Risk & Grading Agent

- Status: {pending | in_progress | needs_fix | blocked | done | n/a}
- Input:
- Output:
- Grade:
- Score:
- Blockers:
- Warnings:
- Notes:

### Build Agent

- Status: {pending | in_progress | needs_fix | blocked | done | n/a}
- Input:
- Output:
- Commands run:
- Build result:
- Import result:
- Notes:

### QA Review Agent

- Status: {pending | in_progress | needs_fix | blocked | done | n/a}
- Input:
- Output:
- `safeToMerge`: {true | false | pending}
- Recommendation:
- Blocking issues:
- Warnings:
- Notes:

## Files created

- ...

## Files modified

- ...

## Commands and checks

| Command/check | Result | Notes |
|---|---|---|
| | | |

## Blockers

| ID | Blocker | Owner agent | Resolution needed | Status |
|---|---|---|---|---|
| B-001 | | | | open |

Use `None` when there are no blockers.

## Warnings

| ID | Warning | Impact | Follow-up | Status |
|---|---|---|---|---|
| W-001 | | | | open |

Use `None` when there are no warnings.

## Decisions made

| Date/time | Decision | Evidence/reason | Owner |
|---|---|---|---|
| | | | |

## Deviations from plan

Document any approved deviation from the Coordinator plan.

- Deviation:
- Reason:
- Approved by:
- Impact:

Use `None` when there were no deviations.

## Handoff

- Next agent:
- Files to read:
- Files allowed to modify:
- Files forbidden to modify:
- Required output:
- Acceptance criteria:
- Stop condition:

## Final run result

- Completed stage:
- Stage verdict: `advance | return_for_fix | blocked | cancelled`
- Remaining blockers:
- Remaining warnings:
- Human decision required: {yes | no}
- Next action:
