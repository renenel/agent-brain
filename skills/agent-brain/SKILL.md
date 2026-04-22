---
name: agent-brain
description: Self-improvement system for agents. Invoke when the user runs /agent-brain followed by: improve (learn from this session), learn <something> (teach the agent something new), absorb <path> (compare with another agent/skill and adopt capabilities), or dream (reflect on the full brain and surface growth opportunities).
metadata:
  author: renenel
  version: "1.0.0"
---

# agent-brain

You are the agent-brain orchestration layer. You route, edit, diff, and optionally PR changes to an agent's memory and definition.

Read the supporting docs in this directory when you need them:
- `router.md` — classifies artifacts into destination + PARA bucket + priority
- `editor.md` — writes PARA files, updates MEMORY.md, modifies definition files
- `diff.md` — formats changes for human review
- `pr.md` — creates branch + PR (when AGENT_AUTO_IMPROVE=1)

## Storage paths

### ✅ Write here
| Artifact | Path |
|---|---|
| PARA files | `.agent-brain/<name>/` (in the project repo) |
| Memory index | `.claude/agent-memory/<name>/MEMORY.md` (in the project repo) |
| Definition file | `.claude/agents/<name>.md` (in the project repo) |

### ❌ Never write here
| Path | Why |
|---|---|
| `~/.claude/projects/<any-slug>/memory/` | Auto-memory cache — separate system, not part of PARA |
| `~/.claude/` (any path) | User's global Claude config — not agent-brain territory |
| Anywhere outside the project repo | All agent-brain state lives in the repo |

## Identity resolution

Before doing anything else, determine which agent you are improving.

1. List `.claude/agent-memory/` — pick the subdirectory that matches the current agent.
   For the main Claude Code assistant (not a sub-agent), use `claude-code` as the name.
2. If still ambiguous, ask: "Which agent should I update? (options visible in `.claude/agent-memory/`)"

The agent name determines:
- Which definition file to edit: `.claude/agents/<name>.md` (may not exist for the main assistant)
- Where PARA files live: `.agent-brain/<name>/`
- Where MEMORY.md lives: `.claude/agent-memory/<name>/MEMORY.md`

## CI mode

Check if `AGENT_AUTO_IMPROVE=1` is set in the environment.
- If set: skip approval prompts, apply all changes, then invoke `pr.md` to create a branch and PR
- If not set: interactive mode — show diffs, ask for approval before applying anything

---

## Mode: improve

Triggered by: `/agent-brain improve`

Learn from what just happened in this session.

### Step 1 — Gather session evidence

Reflect on the current session and identify:
- Corrections: did the user correct your approach? What specifically?
- Loops: did you retry something multiple times? Why did it fail initially?
- User interventions: did the user step in to redirect you? What triggered it?
- New constraints or preferences the user expressed
- Things that took more attempts than they should have

If nothing significant happened, **do not stop yet** — run the archive check first:

> **Archive check:** Does this session contain any completed work, resolved incidents, closed decisions,
> or milestone context that a future agent might benefit from knowing happened? If yes, record it as
> an `archives/` entry even if no behavioral correction occurred. Only after this check passes
> empty respond: "Nothing worth recording from this session." and stop.

### Step 2 — Route each item

For each item, read `router.md` and produce a routing decision.
Discard priority 1 items silently.

### Step 3 — Present changes

Read `diff.md` and format the proposed changes grouped as:

```
Session learnings — <N> items

Memory changes (<N>):
  • [<para_subpath>] <summary> (priority <N>)

Definition changes (<N>):
  • [<para_subpath>] <summary> (priority <N>)
  <diff block>
```

### Step 4 — Apply

Get approval (or skip in CI mode). Read `editor.md` and apply approved changes.
If CI mode: read `pr.md` and open a PR.

---

## Mode: learn

Triggered by: `/agent-brain learn <something>`

Explicitly teach the agent something new. `$ARGUMENTS` after "learn" is the thing to learn.

### Step 1 — Route

Read `router.md`. Pass the input framed as: "The user is explicitly teaching this agent:"
Show the routing result to the user: destination, priority, para_subpath, reasoning.

### Step 2 — Present diff

Read `diff.md` and show the proposed change.
If conflict detected: present conflict and ask for resolution before proceeding.

### Step 3 — Apply

Get approval. Read `editor.md` and apply.
If CI mode: read `pr.md` and open a PR.

---

## Mode: absorb

Triggered by: `/agent-brain absorb <path>`

Compare with another agent or skill and selectively adopt their capabilities.
`$ARGUMENTS` after "absorb" is the path to the target file.

### Step 1 — Read both

Read the target file at the given path.
Read your own definition file.

### Step 2 — Extract delta

Identify capabilities, principles, or methods in the target that you don't currently have.
For each delta item, check for conflicts with your existing definition.

### Step 3 — Present list

```
<target filename> has <N> capabilities you don't currently have:

1. [<name>] — <one sentence description> [no conflict]
2. [<name>] — <one sentence description> [⚠ conflicts with: <existing principle>]
...

Pick numbers to absorb, 'all', or 'none':
```

### Step 4 — Route and apply each selected item

For each selected item: read `router.md` → read `diff.md` → get per-item confirmation → read `editor.md` and apply.

No CI mode for absorb. Always interactive, always per-item confirmation.

---

## Mode: dream

Triggered by: `/agent-brain dream`

Reflect on the full brain — definition + all PARA files — and surface growth opportunities.
Also prunes and consolidates so the next dream runs on a leaner corpus.

### Step 1 — Read everything

- Agent definition file
- MEMORY.md index
- All files listed in MEMORY.md
- All files in `.agent-brain/<name>/` (including any not yet in MEMORY.md — these are orphans)

### Step 2 — Analyse

Produce a structured growth report:

**Strengths** — behaviors repeatedly validated, patterns that are working well

**Stale** — PARA entries that contradict current state, closed projects still in active buckets,
resources never referenced in any session, memories superseded by newer ones

**Orphans** — PARA files not referenced from definition or MEMORY.md (must be fixed)

**Gaps** — failure patterns in Areas not addressed by the definition; Areas entries at priority 4+
that should be promoted to the definition; missing coverage for recurring situations

**Evolutions** — specific proposed changes:
  - Promote: `<memory file>` → definition (creates PARA core file + definition reference + removes memory entry)
  - Archive: `<active file>` → archives (project closed, resource stale)
  - Consolidate: merge `<file A>` + `<file B>` into one
  - New entry: add `<something>` to `<para_subpath>`
  - Prune: remove `<file>` (orphaned, redundant, or empty value)

### Step 3 — Present report

Show the full growth report. Let the user pick which evolutions to apply.

### Step 4 — Pruning pass (always runs, even if no evolutions selected)

Consolidate redundant MEMORY.md entries, fix orphans (add to MEMORY.md or delete),
archive closed projects, condense verbose entries.
Goal: MEMORY.md must be shorter after dream than before.

### Step 5 — Apply

Read `editor.md` and apply approved evolutions + pruning.
If CI mode: read `pr.md` and open a PR.
