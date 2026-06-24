# Asset Completion Report — {assetName}

## Asset summary

- Name: {assetName}
- Symbol: {symbol}
- Slug: {slug}
- Category: {category}
- Issuer/protocol: {issuer}
- Branch: {branch}
- Pull request: {PR URL or number}
- Completion date: {date}

## Final workflow result

- Workflow completed: {yes | no}
- Final grade: {institutional | analytic | research | not assigned}
- Final score: {score or n/a}
- `safeToProceed`: {true | false}
- `safeToMerge`: {true | false}
- Safe to publish: {true | false | pending}
- Human approval required: yes

## Scope completed

### Included work

- ...

### Excluded work

- ...

## Files created

### Product data

- `data/assets/{slug}/source-discovery.md`
- `data/assets/{slug}/identity.json`
- `data/assets/{slug}/blockchain.json`
- `data/assets/{slug}/reserve.json`
- `data/assets/{slug}/institutional.json`
- `data/assets/{slug}/compliance.json`
- `data/assets/{slug}/liquidity.json`
- `data/assets/{slug}/market.json`
- `data/assets/{slug}/yield.json`
- `data/assets/{slug}/sources.json`
- `data/assets/{slug}/risk.json`
- `data/assets/{slug}/grade-baseline.json`

Remove or mark `N/A` for files not required by the approved scope.

### Internal process reports

- `docs/agent-runs/{slug}/workflow-status.md`
- `docs/agent-runs/{slug}/source-review.md`
- `docs/agent-runs/{slug}/build-report.md`
- `docs/agent-runs/{slug}/qa-review.md`

## Source quality summary

- Strong official sources:
- Medium/secondary sources:
- Weak/context-only sources:
- Inaccessible sources:
- Material evidence gaps:
- Source conflicts:
- Recommended/final source score:

## Research summary

- Asset identity confirmed:
- Blockchain deployments confirmed:
- Reserve/backing structure confirmed:
- Institutional structure confirmed:
- Compliance/access conditions confirmed:
- Liquidity/redemption mechanics confirmed:
- Market data observation date:
- Yield data observation date:
- Fields left `null`:

## Source verification result

- `safeToProceed`: {true | false}
- Blocking issues resolved:
- Remaining blockers:
- Non-blocking warnings:
- Required corrections completed:
- Verification notes:

## Risk and grade summary

| Component | Score | Key evidence | Main limitation |
|---|---:|---|---|
| Completeness | | | |
| Source | | | |
| Legal | | | |
| Reserve | | | |
| Liquidity | | | |
| Market | | | |
| Risk | | | |

### Grade rationale

Explain why the asset received its final grade and why it did not receive a higher or lower grade.

### Final blockers

1. ...

Use `None` when no blocker remains.

### Final warnings

1. ...

Use `None` when no warning remains.

### Next actions

1. ...

## Build and integration result

- Files integrated successfully: {yes | no}
- JSON validation: {passed | failed | not run}
- Typecheck: {passed | failed | not applicable | not run}
- Lint: {passed | failed | not applicable | not run}
- Tests: {passed | failed | not applicable | not run}
- Asset verification: {passed | failed | not applicable | not run}
- Import: {passed | failed | not applicable | not run}
- Build: {passed | failed | not run}
- Preview deployment: {passed | failed | not available | not run}
- Pre-existing issues:
- Environment limitations:

## QA result

- `safeToMerge`: {true | false}
- Recommendation: {APPROVE FOR HUMAN MERGE | REQUEST CHANGES | BLOCKED — ADDITIONAL INPUT REQUIRED}
- Scope matched: {yes | no}
- Unrelated changes found: {yes | no}
- Data honesty passed: {yes | no}
- Source integrity preserved: {yes | no}
- Grading integrity preserved: {yes | no}
- Null handling safe: {yes | no}
- Remaining QA warnings:

## Data honesty declaration

Confirm the final implementation contains:

- [ ] No invented contract address
- [ ] No fake AUM
- [ ] No fake APY
- [ ] No fake TVL
- [ ] No fake yield
- [ ] No fake reserve value
- [ ] No fake risk score
- [ ] No unsupported proof-of-reserves claim
- [ ] No unsupported legal or regulatory claim
- [ ] No placeholder data presented as fact
- [ ] Honest `null` handling
- [ ] Source support for every material non-null field

## Remaining limitations

Document limitations that remain after completion but do not invalidate the final result.

1. ...

## Post-merge or post-publication monitoring

| Item to monitor | Frequency | Trigger | Owner |
|---|---|---|---|
| Market data freshness | | | |
| Yield freshness | | | |
| Reserve/transparency report | | | |
| Legal/compliance changes | | | |
| Contract/deployment changes | | | |
| Source availability | | | |
| Grade refresh | | | |

## Final recommendation

State whether the asset should be merged and/or published, including the evidence and limitations supporting the recommendation.

- Recommended action:
- Human approval required: yes
- Approved by:
- Approval date:

## Build-in-public summary

Optional concise external summary that does not expose internal-only details:

> {assetName} has completed the Nexus RWA research, source verification, risk grading, build, and QA workflow. The asset received a {grade} grade with key strengths in {strengths} and remaining limitations in {limitations}.
