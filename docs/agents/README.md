# Nexus RWA Agent Team System

This directory defines the internal AI-assisted workflow used to research, verify, grade, build, and review RWA asset data before publication.

The agent system is designed for a solo builder. Each agent has a narrow role, explicit inputs and outputs, and clear handoff rules. Agents do not automatically trust one another. Every stage must leave auditable files or review results for the next stage.

## Core workflow

```text
Asset Candidate
  -> Coordinator Agent
  -> Research Agent
  -> Source Verification Agent
  -> Risk & Grading Agent
  -> Build Agent
  -> QA Review Agent
  -> Human merge decision
  -> Published Asset
```

## Core agents

1. **Coordinator Agent**
   Controls scope, defines the onboarding plan, tracks progress, and decides which agent runs next.

2. **Research Agent**
   Collects official and verifiable asset data and prepares the asset layer files.

3. **Source Verification Agent**
   Checks whether claims are actually supported, identifies weak or stale sources, and decides whether the asset is safe to proceed.

4. **Risk & Grading Agent**
   Evaluates the asset using verified evidence and generates `risk.json` and `grade-baseline.json`.

5. **Build Agent**
   Integrates reviewed asset files into the repository and runs the required validation, import, typecheck, and build commands.

6. **QA Review Agent**
   Reviews the final diff, data honesty, validation results, scope, and merge readiness.

## Required asset files

A completed asset onboarding flow normally produces:

```text
data/assets/{slug}/
├── source-discovery.md
├── identity.json
├── blockchain.json
├── reserve.json
├── institutional.json
├── compliance.json
├── liquidity.json
├── market.json
├── yield.json
├── sources.json
├── risk.json
└── grade-baseline.json
```

Internal process reports should be stored separately from product data when possible:

```text
docs/agent-runs/{slug}/
├── workflow-status.md
├── source-review.md
├── build-report.md
└── qa-review.md
```

## Data honesty rules

These rules apply to every agent:

- Prefer official issuer, fund, regulator, legal, reserve, transparency, and explorer sources.
- Do not infer unverifiable data.
- Unknown or unsupported values must be `null`.
- Every non-null field should have source support.
- Never invent contract addresses.
- Never invent AUM, APY, TVL, yield, reserve data, legal status, or risk scores.
- Do not claim proof-of-reserves unless a source explicitly confirms it.
- Do not treat a smart contract audit as a reserve audit.
- Third-party aggregators are secondary sources, not substitutes for official evidence.
- Risk grading must be evidence-based.
- Blockers and warnings must be specific and actionable.

## Source priority

Use this order whenever sources conflict or overlap:

1. Official issuer website
2. Official documentation
3. Official legal documents
4. Official fund, reserve, transparency, or audit reports
5. Regulator filings
6. Verified blockchain explorers
7. Trusted aggregators
8. Reputable media for context only
9. Community posts or social media only as leads, not final evidence

## Status values

Each onboarding stage uses one of these statuses:

- `pending` — not started
- `in_progress` — currently being worked on
- `needs_fix` — output exists but requires revision
- `blocked` — cannot proceed because evidence or implementation is insufficient
- `done` — accepted and ready for handoff

## Handoff rules

A stage may advance only when its completion criteria are met.

### Research -> Source Verification

Required:

- Required draft layer files exist.
- Unknown values are represented honestly.
- Source URLs are recorded.
- Conflicting sources are documented.

### Source Verification -> Risk & Grading

Required:

- Unsupported claims are corrected or removed.
- Required corrections are resolved.
- The verification result explicitly says the asset is safe to proceed.

### Risk & Grading -> Build

Required:

- `risk.json` exists.
- `grade-baseline.json` exists.
- Blockers, warnings, and next actions are clear.
- The grade does not overstate the available evidence.

### Build -> QA Review

Required:

- Repository changes are limited to the approved scope.
- JSON validation passes.
- Relevant import, typecheck, lint, test, and build commands are reported.
- No fake fallback or placeholder data was introduced.

### QA Review -> Merge

Required:

- No unresolved blocking issue remains.
- Data honesty checks pass.
- Build and validation results are clear.
- A human makes the final merge decision.

## Recommended operating model

At the current stage, agents should be invoked manually through ChatGPT or Codex by asking them to read their role document and work on one asset or PR.

Example:

```text
Read docs/agents/03-source-verification-agent.md.
Review all files for data/assets/backed-bc3m/.
Perform only the Source Verification Agent role.
```

Scripts should handle deterministic checks such as JSON validation, required file checks, source URL format checks, typecheck, and build. AI agents should handle research, evidence interpretation, grading, and review decisions.

## What should not be automated yet

Do not fully automate:

- legal classification
- reserve claims
- institutional grading
- final publication approval
- final PR merge

These remain human-reviewed because errors could damage the credibility of Nexus RWA.

## Initial rollout

1. Create the six core agent role documents.
2. Add reusable workflow and review templates.
3. Use the workflow manually on several assets.
4. Add deterministic validation scripts.
5. Add CI checks.
6. Consider semi-automatic orchestration only after the workflow is stable.
