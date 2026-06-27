# Nexus RWA Agent Router

## Purpose

This file is the master routing instruction for Nexus RWA agent workflows.

Use this file whenever a user asks to add, refresh, fix, review, or merge an asset-related task in the Nexus RWA repository.

The goal is to make normal agent runs possible with short prompts while keeping scope, sequencing, validation, and human approval strict.

---

## Core rule

When the user gives a short instruction such as:

```text
Add asset [Asset Name] using Nexus RWA agent workflow.
```

or:

```text
Tambah asset [Asset Name]. Jalankan Agent RWA.
```

the system must not guess the full workflow.

It must start with the Coordinator Agent unless the user explicitly assigns another agent.

---

## Required first step

For every new asset onboarding, asset refresh, source repair, grading refresh, PR remediation, or post-merge hotfix:

1. Read `docs/agents/README.md`.
2. Read this file: `docs/agents/00-agent-router.md`.
3. Identify the task type.
4. Route to the correct first agent.
5. Create or update `docs/agent-runs/{slug}/workflow-status.md`.
6. Stop after the assigned agent’s output.

Do not run multiple agents in a single response unless the user explicitly asks and the task is low-risk documentation-only.

---

## Supported task types

### 1. New asset onboarding

Example user prompt:

```text
Add asset Backed bCSPX using Nexus RWA agent workflow.
```

Start with:

```text
Coordinator Agent
```

Expected flow:

```text
Coordinator Agent
→ Research Agent
→ Source Verification Agent
→ Risk & Grading Agent
→ Build Agent
→ QA Review Agent
→ Human merge decision
```

Do not skip Source Verification, Risk & Grading, Build, or QA.

---

### 2. Existing asset refresh

Example user prompt:

```text
Refresh Backed bC3M using Nexus RWA agent workflow.
```

Start with:

```text
Coordinator Agent
```

Expected flow depends on scope:

```text
Coordinator Agent
→ Research Agent, if material data changes are needed
→ Source Verification Agent, if sources or factual fields change
→ Risk & Grading Agent, if risk, score, grade, blockers, or warnings may change
→ Build Agent
→ QA Review Agent
→ Human merge decision
```

If the refresh is only a technical importer or display fix, do not run Research unless needed.

---

### 3. PR remediation or Codex review fix

Example user prompt:

```text
Fix Codex review on PR #85.
```

Start with:

```text
Coordinator Agent
```

Expected flow:

```text
Coordinator Agent
→ Build Agent
→ QA Review Agent
→ Human merge decision
```

Run Research, Source Verification, or Risk & Grading only if the review comment challenges data, evidence, scoring, or grading.

---

### 4. Post-merge hotfix

Example user prompt:

```text
Post-merge hotfix for bC3M null clearing.
```

Start with:

```text
Coordinator Agent
```

Expected flow:

```text
Coordinator Agent
→ Build Agent
→ QA Review Agent
→ Human merge decision
```

Do not re-run full asset onboarding unless the hotfix changes material asset data.

---

### 5. Source repair

Example user prompt:

```text
Repair missing source evidence for Ondo OUSG.
```

Start with:

```text
Coordinator Agent
```

Expected flow:

```text
Coordinator Agent
→ Source Verification Agent
→ Build Agent
→ QA Review Agent
→ Human merge decision
```

If repaired sources change risk, grade, blockers, or warnings, route to Risk & Grading Agent before Build.

---

### 6. Risk or grade refresh

Example user prompt:

```text
Recheck risk and grade for Franklin BENJI.
```

Start with:

```text
Coordinator Agent
```

Expected flow:

```text
Coordinator Agent
→ Source Verification Agent
→ Risk & Grading Agent
→ Build Agent
→ QA Review Agent
→ Human merge decision
```

Risk and grade must not be changed without verified evidence.

---

## Agent responsibilities

### Coordinator Agent

Use when:

* starting any workflow;
* classifying task type;
* defining scope;
* creating or updating workflow status;
* deciding which agent runs next.

Coordinator must define:

* task type;
* asset name;
* symbol;
* slug;
* branch;
* allowed files;
* forbidden files;
* expected outputs;
* acceptance criteria;
* stop condition;
* next agent.

Coordinator must not perform research, grading, implementation, QA approval, merge, or publication.

---

### Research Agent

Use when:

* new asset data is needed;
* existing asset data needs factual refresh;
* material fields may change.

Research Agent must:

* use official sources first;
* avoid unsupported inference;
* set non-verifiable values to `null`;
* keep descriptions concise;
* include source URLs for non-null material fields;
* prepare research outputs for Source Verification.

Research Agent must not assign grades, approve sources, implement code, merge, or publish.

---

### Source Verification Agent

Use when:

* research outputs need verification;
* sources changed;
* asset facts changed;
* source integrity is uncertain.

Source Verification Agent must:

* verify source URLs;
* classify source reliability;
* identify unsupported claims;
* resolve conflicting sources;
* decide `safeToProceed: true | false`.

Source Verification Agent must not invent data, assign grades, implement code, merge, or publish.

---

### Risk & Grading Agent

Use when:

* `risk.json` is new or changed;
* `grade-baseline.json` is new or changed;
* risk score, grade, blockers, or warnings may change.

Risk & Grading Agent must:

* use verified data only;
* preserve uncertainty;
* explain scoring;
* document blockers and warnings;
* avoid unsupported grade upgrades.

Risk & Grading Agent must not perform source discovery, implement code, approve merge, or publish.

---

### Build Agent

Use when:

* approved files need to be created or updated;
* importer, sync, schema-compatible mapping, or validation work is needed;
* PR remediation requires code or test changes.

Build Agent must:

* read the Coordinator handoff;
* change only allowed files;
* run relevant checks where possible;
* record command results honestly;
* preserve reviewed research and grading outputs;
* prepare handoff for QA Review.

Build Agent must not perform primary research, change grades, broaden scope, merge, or publish.

---

### QA Review Agent

Use after Build Agent completes.

QA Review Agent must:

* inspect the full diff;
* compare changed files against approved scope;
* verify data honesty;
* verify source and grading integrity;
* review validation evidence;
* identify blockers and warnings;
* output explicit `safeToMergeRecommendation: true | false`.

QA Review Agent must not silently fix code, change data, merge, or publish.

---

## Required workflow status file

Each workflow must maintain:

```text
docs/agent-runs/{slug}/workflow-status.md
```

The file should include:

* task type;
* asset name;
* symbol;
* slug;
* branch;
* current stage;
* current owner agent;
* next agent;
* completed stages;
* blockers;
* warnings;
* validation results;
* `safeToProceed`, if applicable;
* `safeToMergeRecommendation`, if applicable;
* human approval requirement;
* final recommendation.

---

## Standard short prompts

### Start new asset

```text
We are in the Nexus RWA repo.

Add asset [ASSET NAME] using the Nexus RWA agent workflow.

Symbol: [SYMBOL]
Slug: [slug]

Start with Coordinator Agent only.
Follow docs/agents.
Stop after Coordinator handoff.
```

### Continue next agent

```text
Continue the Nexus RWA agent workflow for [slug].

Act as [Agent Name] only.
Follow docs/agents and workflow-status.md.
Stop after this agent’s required output.
```

### Run QA

```text
Continue the Nexus RWA agent workflow for [slug].

Act as QA Review Agent only.
Review the final diff and validation evidence.
Include safeToMergeRecommendation.
Do not merge.
Do not publish.
```

### Post-merge hotfix

```text
We are in the Nexus RWA repo.

Handle post-merge hotfix for [slug].

Issue:
[brief issue]

Start with Coordinator Agent only.
Classify scope.
Do not run full asset onboarding unless required.
Stop after Coordinator handoff.
```

---

## File scope rules

Every agent handoff must explicitly define:

### Allowed files

Files the current agent may read or modify.

### Forbidden files

Files the current agent must not modify.

Common forbidden files unless explicitly approved:

* unrelated assets;
* unrelated web files;
* Prisma schema or migrations;
* dependencies and lockfiles;
* risk or grade files outside Risk & Grading scope;
* source-review files outside Source Verification scope;
* production data files outside approved asset slug;
* merge or publication settings.

---

## Data honesty rules

All agents must follow these rules:

* Official sources first.
* Do not infer unsupported facts.
* Non-verifiable values must be `null`.
* Do not replace `null` with fake defaults.
* Do not invent contract addresses.
* Do not invent AUM, APY, TVL, yield, reserve, or risk data.
* Do not claim proof-of-reserves unless explicitly supported.
* Every material non-null field must have source support.
* Conflicting evidence must be documented.
* Dynamic values must retain observation dates when available.

---

## Validation rules

Before QA can recommend merge, relevant validation evidence must be recorded.

Typical checks include:

```bash
npm.cmd run typecheck
npm.cmd run build
npm.cmd run import:asset-files --workspace=api -- --slug={slug} --dry-run
npm.cmd run verify:assets
```

For focused code changes, run focused tests where available.

If a command cannot run, document:

* command;
* exact failure;
* whether failure is task-related;
* whether it is environment-limited;
* whether merge can still be recommended.

Do not claim a command passed if it was not run.

---

## Merge and publication rules

Agents must not merge automatically.

Agents must not publish automatically.

Even when QA passes:

```text
Human approval required: yes
```

The final QA output must include:

```text
safeToMergeRecommendation: true | false
Recommendation: APPROVE FOR HUMAN MERGE | REQUEST CHANGES | BLOCKED — ADDITIONAL INPUT REQUIRED
Human approval required: yes
```

Publication is separate from merge and must require explicit human instruction.

---

## Stop conditions

Each agent must stop after its assigned output.

Do not continue to the next agent automatically unless the user explicitly requests it.

Default stop points:

* Coordinator Agent stops after handoff.
* Research Agent stops after research output.
* Source Verification Agent stops after source review.
* Risk & Grading Agent stops after risk and grade output.
* Build Agent stops after implementation and build report.
* QA Review Agent stops after `safeToMergeRecommendation`.
* Human controls merge and publication.

---

## Default behavior for short user prompts

If the user gives a short instruction, use this routing:

| User intent            | First agent                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| Add new asset          | Coordinator Agent                                                     |
| Refresh existing asset | Coordinator Agent                                                     |
| Fix Codex/PR review    | Coordinator Agent                                                     |
| Post-merge hotfix      | Coordinator Agent                                                     |
| Repair source issue    | Coordinator Agent                                                     |
| Recheck risk/grade     | Coordinator Agent                                                     |
| Continue workflow      | Agent named by workflow-status or user                                |
| Merge PR               | Human approval flow; do not auto-merge unless explicitly instructed   |
| Publish asset          | Human approval flow; do not auto-publish unless explicitly instructed |

---

## Final principle

Short prompts are allowed only because the repository contains the full rules.

When in doubt:

1. Read the agent docs.
2. Read workflow status.
3. Keep scope narrow.
4. Preserve data honesty.
5. Stop before merge or publication.
