# M10 Log Command

Use this after any meaningful step to persist context.

---

Do not modify application code.

Task:
Update M10 agent-memory files based on the **previous interaction (the last user prompt and assistant response)**.

Do NOT include this instruction in the log.

Files to update:
- docs/milestones/m10/m10-codex-context.md (append only)
- docs/milestones/m10/m10-state.md (update snapshot)
- docs/milestones/m10/m10-decisions.md (only if new decisions were made)

---

1. Update m10-codex-context.md
- Append a new Context Log Entry
- Capture FULL context of the previous interaction
- Include:
  - what was asked
  - what was explained
  - reasoning and tradeoffs
  - commands, configs, architecture details
- Do NOT summarize aggressively

---

2. Update m10-state.md
- Reflect the CURRENT project state AFTER the previous interaction
- Keep it structured and concise
- Update:
  - progress
  - deployment status
  - DB status
  - build system
  - next steps

---

3. Update m10-decisions.md (if applicable)
- Add ONLY new durable decisions from the previous interaction
- Do NOT duplicate existing ones

---

Rules:
- Only log the previous interaction (not this prompt)
- Do NOT rewrite previous history
- Only append to context log
- Keep state clean and readable
- Keep decisions concise and stable

---

Output:
- Show changes for each file
- Clearly label sections per file