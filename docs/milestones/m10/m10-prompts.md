# M10 Reusable Codex Prompts

Purpose: prompts future sessions can reuse to recover context, append history, update status, or plan work.

## Reload Context Prompt

```text
We are working on CSC 667 M10 for the Team Hearts project.

First verify the current Git branch. If it is not m10, stop and report the branch. Do not switch branches.

Then read these files in order:

1. docs/milestones/m10/m10-agent-instructions.md
2. docs/milestones/m10/m10-state.md
3. docs/milestones/m10/m10-decisions.md
4. docs/milestones/m10/m10-codex-context.md
5. docs/milestones/m10/m10-prompts.md

Summarize the current M10 context, known constraints, immediate next steps, and anything that appears stale. Do not modify files unless I explicitly ask.
```

## Append Log Prompt

```text
Append a new dated entry to docs/milestones/m10/m10-codex-context.md.

Include:

- current branch and git status
- what changed or was investigated
- files touched
- commands run
- verification results
- decisions made
- blockers or risks found
- recommended next step

Do not rewrite old entries. Keep this file append-only.
```

## Update State Prompt

```text
Update docs/milestones/m10/m10-state.md to reflect the current M10 project status.

First verify the current Git branch. If it is not m10, stop and report the branch. Do not switch branches.

Update only facts that changed:

- branch/status
- completed work
- Render status
- database status
- build/deploy commands
- M10 database plan
- lobby plan
- blockers/risks
- immediate next steps

Do not edit application code, package.json, or migrations unless I explicitly ask.
```

## Implementation Planning Prompt

```text
Read the M10 memory files under docs/milestones/m10/ and create an implementation plan for the next M10 task.

Constraints:

- server-authoritative architecture
- PostgreSQL stores game state
- no JSON game state
- fetch for actions
- SSE for updates
- do not implement full Hearts rules
- do not implement tricks, passing, scoring, bots, or full game logic
- prefer minimal M10-safe changes

Output:

- current relevant repo facts
- proposed file changes
- database/migration impact, if any
- verification commands
- risks and rollback notes

Do not modify files yet.
```

## Analysis-Only Prompt

```text
Analyze the current M10 codebase and docs only.

First verify the current Git branch. If it is not m10, stop and report the branch. Do not switch branches.

Use the M10 memory files as context. Report:

- whether the requested work fits M10 scope
- what files would likely need to change
- what database changes would likely be needed
- what tests or checks should run
- what risks might affect Render deployment

Do not modify any files.
```
