# Pull Request Summary

## What changed?

Describe the purpose of this PR and the user, data, or repository impact.

## Task type

Select one:

- [ ] New asset onboarding
- [ ] Existing asset refresh
- [ ] Source repair
- [ ] Risk or grading review
- [ ] Build or integration task
- [ ] Monitoring or maintenance task
- [ ] Documentation-only change
- [ ] Other: ...

## Asset information

Complete when this PR affects an RWA asset.

- Asset name:
- Symbol:
- Slug:
- Category:
- Issuer/protocol:
- Baseline or observation date:

Use `N/A` when this PR is not asset-related.

## Approved scope

### Included

- ...

### Excluded

- ...

## Files changed

### Created

- ...

### Modified

- ...

### Deleted

- ...

## Agent workflow

Mark stages that are required for this PR. Use `N/A` only when the stage is genuinely not applicable.

- [ ] Coordinator Agent completed
- [ ] Research Agent completed or `N/A`
- [ ] Source Verification Agent completed or `N/A`
- [ ] Risk & Grading Agent completed or `N/A`
- [ ] Build Agent completed or `N/A`
- [ ] QA Review Agent completed or pending final PR review

### Agent outputs

- Workflow status:
- Source review:
- Risk assessment:
- Grade baseline:
- Build report:
- QA review:

Use repository paths or `N/A`.

## Data honesty checklist

Required for asset, source, market, yield, reserve, risk, or grading changes.

- [ ] No invented contract address
- [ ] No fake AUM
- [ ] No fake APY
- [ ] No fake TVL
- [ ] No fake yield
- [ ] No fake market cap
- [ ] No fake reserve or collateral value
- [ ] No fake risk score
- [ ] No unsupported proof-of-reserves claim
- [ ] No smart contract audit presented as reserve audit
- [ ] No unsupported legal or regulatory claim
- [ ] No placeholder data presented as fact
- [ ] Unknown or unsupported values use `null`
- [ ] Every material non-null field has source support
- [ ] Aggregator data is identified as secondary data
- [ ] Dynamic values include an observation date

Use `N/A` only for PRs that do not affect product data.

## Source verification

- `safeToProceed`: `true | false | N/A`
- Recommended/final source score:
- Strong official sources:
- Secondary sources:
- Inaccessible or weak sources:
- Unresolved source conflicts:

### Source verification checklist

- [ ] Material claims match their cited sources
- [ ] Contract addresses are verified
- [ ] Legal entity and jurisdiction claims are supported
- [ ] Reserve, audit, attestation, and proof-of-reserves terms are distinguished
- [ ] Market metrics use the correct definitions
- [ ] Yield type and methodology are identified correctly
- [ ] Stale data is flagged or removed
- [ ] Source-review corrections remain applied

## Risk and grading

Complete when the PR creates or changes `risk.json`, `grade-baseline.json`, score logic, blockers, warnings, or grade display.

- Final grade:
- Total score:
- Baseline date:
- Grading methodology:

### Component scores

| Component | Score | Main evidence | Main limitation |
|---|---:|---|---|
| Completeness | | | |
| Source | | | |
| Legal | | | |
| Reserve | | | |
| Liquidity | | | |
| Market | | | |
| Risk | | | |

### Grading integrity checklist

- [ ] Source verification passed before grading
- [ ] Existing scoring conventions were followed
- [ ] Score direction was confirmed
- [ ] Missing evidence was not treated as zero risk
- [ ] Product type was considered
- [ ] Popularity or issuer reputation did not inflate the score
- [ ] Institutional-grade guardrails were respected
- [ ] Blockers, warnings, and next actions are specific
- [ ] Build implementation did not change approved scores or grade

Use `N/A` when this PR does not affect risk or grading.

## Validation

Record only commands that actually ran.

| Check | Result | Notes |
|---|---|---|
| JSON validation | passed / failed / N/A / not run | |
| Typecheck | passed / failed / N/A / not run | |
| Lint | passed / failed / N/A / not run | |
| Tests | passed / failed / N/A / not run | |
| Asset verification | passed / failed / N/A / not run | |
| Asset import | passed / failed / N/A / not run | |
| Build | passed / failed / N/A / not run | |
| Preview deployment | passed / failed / unavailable / N/A / not run | |

### Validation integrity

- [ ] Commands were taken from the repository's actual scripts
- [ ] Failed checks are disclosed
- [ ] Task-related and pre-existing failures are distinguished
- [ ] Checks were rerun after relevant fixes
- [ ] No unrun check is described as passed

## Scope and repository safety

- [ ] PR title and description match the diff
- [ ] Changes are limited to the approved scope
- [ ] No unrelated asset was modified
- [ ] No unrelated refactor was included
- [ ] No unapproved Prisma or database schema change
- [ ] No unapproved migration
- [ ] No unapproved dependency or lockfile change
- [ ] No secret or environment credential was committed
- [ ] No generated noise or accidental files were included
- [ ] Final diff was reviewed

## Product behavior

Complete when the PR affects application behavior or asset display.

- [ ] Asset or feature loads correctly
- [ ] Optional `null` values do not crash the UI
- [ ] Missing data is displayed honestly
- [ ] Source links point to expected pages
- [ ] Risk warnings and blockers remain visible where required
- [ ] Grade and score display correctly
- [ ] No unrelated product behavior changed

Use `N/A` for documentation-only or non-runtime PRs.

## Blocking issues

List unresolved issues that prevent merge.

1. None

## Non-blocking warnings

List known limitations that do not prevent merge.

1. None

## Follow-up tasks

List valid work intentionally left outside this PR.

1. None

## Final readiness

- Build Agent says ready for QA: `true | false | N/A`
- QA `safeToMerge`: `true | false | pending`
- Recommended action: `APPROVE FOR HUMAN MERGE | REQUEST CHANGES | BLOCKED — ADDITIONAL INPUT REQUIRED`
- Human approval required: **yes**

## Reviewer notes

Add any context needed by the human reviewer before merge.
