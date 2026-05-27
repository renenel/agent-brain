---
name: agent-brain
description: "Self-improvement system for agents. Invoke when the user runs /agent-brain followed by: improve (learn from this session), learn <something> (teach the agent something new), absorb <path> (adopt capabilities from another agent, skill, or full brain), dream (reflect on the full brain and surface growth opportunities), or validate (audit brain for structural issues)."
metadata:
  author: renenel
  version: "1.0.0"
---

# agent-brain

You are the agent-brain orchestration layer. You route, edit, diff, and optionally PR changes to an agent's memory and definition.

## Critical rules (read first)

> **Do not paste the Persistent Agent Memory boilerplate into your agent's `.md` file.** The harness injects it dynamically at session start with the live MEMORY.md. Baking it in causes a stale-empty duplicate. If you see *"Your MEMORY.md is currently empty"* in your prompt while MEMORY.md has entries, strip the baked-in section from your agent `.md`.

> **When asked to describe the brain layout, paths, routing rules, or PARA semantics, point at `router.md` and `editor.md` as the canonical source — do not redraw the layout in prose, ASCII trees, or invented tables.** If a variant isn't documented here (e.g., user-scope), say so and ask the user, don't invent.

Read the supporting docs in this directory when you need them:
- `router.md` — classifies artifacts into destination + PARA bucket + priority
- `editor.md` — writes PARA files, updates MEMORY.md, modifies definition files
- `diff.md` — formats changes for human review
- `pr.md` — creates branch + PR (when AGENT_AUTO_IMPROVE=1)

## Storage paths

### Scope variants

Path contract has three variants depending on agent scope:

| Element | Project-scope (in repo) | User-scope (cross-project) | Plugin-scope (marketplace) |
|---|---|---|---|
| Definition | `<repo>/.claude/agents/<name>.md` | `~/.claude/agents/<name>.md` | `$PLUGIN_ROOT/agents/<name>.md` |
| MEMORY index | `<repo>/.claude/agent-memory/<name>/MEMORY.md` | `~/.claude/agent-memory/<name>/MEMORY.md` | `$PLUGIN_ROOT/runtime/<name>/memory/MEMORY.md` |
| PARA tree | `<repo>/.agent-brain/<name>/{areas,projects,resources,archives}/` | `~/.claude/agent-memory/<name>/.agent-brain/{areas,projects,resources,archives}/` | `$PLUGIN_ROOT/runtime/<name>/memory/.agent-brain/{areas,projects,resources,archives}/` |

Every agent uses pure 2-tier PARA: priority 4–5 entries inlined as references in the agent's `.md`, priority 2–3 entries indexed via MEMORY.md → PARA tree. No flat-file root layer.

**Plugin-scope detection is automatic.** The skill walks up from the agent's `.md` file looking for `.claude-plugin/plugin.json` (Claude Code's existing plugin marker). When found, `$PLUGIN_ROOT` resolves to that directory and the cache mirror path resolves via `~/.claude/plugins/installed_plugins.json` (Claude Code's existing install registry). Plugin-scope agent files declare nothing — no roots block, no plugin awareness, no per-agent boilerplate. See editor.md for the full detection algorithm and cache dual-write mechanics.

### ✅ Write here (project-scope defaults)
| Artifact | Path |
|---|---|
| PARA files | `.agent-brain/<name>/` (in the project repo) |
| Memory index | `.claude/agent-memory/<name>/MEMORY.md` (in the project repo) |
| Definition file | `.claude/agents/<name>.md` (in the project repo) |

### ❌ Never write here
| Path | Why |
|---|---|
| `~/.claude/projects/<any-slug>/memory/` | Auto-memory cache — separate system, not part of PARA |
| Anywhere outside the project repo (for project-scope agents) | All agent-brain state lives in the repo |

### Portability rule

**Never write absolute user-specific paths** (`/Users/<name>/...`, `/home/<name>/...`) into any agent file. Always use portable forms: `~/...`, `$BRAIN/...`, `$AGENTS/...`, `$SKILL/...`. See editor.md for the roots-block convention.

## Identity resolution

Before doing anything else, resolve which agent you are improving **and its scope**
using `editor.md` → "Identity + path discovery" + "Scope detection". That resolver is
the single source of truth: it finds the agent's CANONICAL `.md` across user-scope
(`~/.claude/agents/<name>.md`), plugin-scope
(`~/.claude/plugins/marketplaces/*/*/agents/<name>.md`, incl. the cache→clone mapping),
and project-scope (cwd repo), then derives scope from where the definition actually lives.
For the main Claude Code assistant (no sub-agent), use `claude-code`.

**Do NOT identify the agent or decide its scope by listing the cwd's
`.claude/agent-memory/`.** A plugin- or user-scope agent doing work inside some repo
would be mis-classified project-scope and its real brain (e.g. a plugin's
`runtime/<name>/memory/`) made invisible — the skill would then offer to mint an empty
brain in the wrong repo. If the loaded identity is plugin-namespaced (`<plugin>:<name>`),
strip the `<plugin>:` prefix before the `<name>.md` lookup.

All paths (definition, MEMORY.md, PARA tree) derive from the **detected scope** — see
editor.md "Path resolution shorthand", never from the cwd. If resolution is genuinely
ambiguous, ask: "Which agent should I update?"

## Pre-flight (runs before every mode except validate)

Before executing any mode, silently check:

1. **Brain exists?** — does `MEMORY.md` exist at the **scope-resolved** brain path?
   Resolve it via editor.md, NOT by assuming the cwd's `.claude/agent-memory/`:
   - plugin-scope → `$PLUGIN_ROOT/runtime/<name>/memory/MEMORY.md`
   - user-scope → `~/.claude/agent-memory/<name>/MEMORY.md`
   - project-scope → `<repo>/.claude/agent-memory/<name>/MEMORY.md`
   If absent at that canonical location: show the user what will be created and ask
   permission before proceeding:
   > "No brain found for `<name>` (scope: `<scope>`). Create it now? This will make: MEMORY.md and the PARA tree at `<canonical brain root>`."
   On approval: create the structure with an empty `<!-- brain-schema: v1 -->` MEMORY.md. On denial: stop.
   **Never** create a project-scope brain in the cwd for an agent that resolved to plugin-
   or user-scope — a plugin/user agent's brain is created at its canonical home or not at all.

2. **PARA dirs exist?** — do the four PARA buckets exist under the brain root?
   If not (but MEMORY.md does exist): same prompt, same approval gate, just for the missing dirs.

3. **Stale boilerplate?** — scan the agent's `.md` for a baked-in `# Persistent Agent Memory` section (detectable by the presence of `"Your MEMORY.md is currently empty"`). If found, show the user the offending block and ask permission to strip it. On approval: remove it. This is unambiguous — strip only that section, touch nothing else.

4. **Run validate silently** — surface any issues found as a brief warning before proceeding, but don't block (except hardcoded absolute paths — those block until resolved).

---

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

**Auto-promotion:** For any item routed at priority 5 (Foundation), automatically:
1. Insert an inline reference line in the most relevant section of the agent's `.md`
2. Mark the MEMORY.md entry as `[PROMOTED]`
3. Show the diff for approval

For priority 4 items: suggest inlining but don't force it.

If CI mode: read `pr.md` and open a PR.

### Step 5 — Structural audit (always runs after apply)

After changes land, run a fast health check on the brain:

1. Count files in the brain root excluding `MEMORY.md` — if > 0, report as drift ("N flat files at brain root that should be in PARA buckets")
2. Count MEMORY.md entries whose paths don't start with `.agent-brain/` or the user-scope PARA root — flag any
3. Scan for any `Your MEMORY.md is currently empty` string in the agent's `.md` file — flag if found (stale boilerplate baked in)
4. Scan agent `.md`, MEMORY.md, and PARA files for absolute paths matching `/Users/[^/]+/` or `/home/[^/]+/` — flag every match
5. Count MEMORY.md lines — warn if approaching 200-line harness limit

If any issues found, append to output:

> **Brain drift detected:** <summary>. Consider running `/agent-brain validate` or `/agent-brain dream` to repair.

---

## Mode: validate

Triggered by: `/agent-brain validate`

Audit an existing agent's brain for structural issues without making changes.

### Checks

1. **Stale boilerplate** — scan agent `.md` for `"Your MEMORY.md is currently empty"` — flag if present
2. **Orphan links** — walk every entry in MEMORY.md and verify the linked file exists
3. **Missing promotions** — for every priority-5 entry in MEMORY.md, verify the agent `.md` contains a literal path reference to it. Flag missing as promotion candidates
4. **Duplicate memories** — detect multiple files with the same topic under different `<type>_` prefixes
5. **MEMORY.md size** — report line count vs 200-line harness limit
6. **Scope ambiguity** — if both `~/.claude/agent-memory/<name>/` and a project-local `.agent-brain/<name>/` exist, flag as ambiguous
7. **Hardcoded user paths** — scan agent `.md`, MEMORY.md, and all PARA files for `/Users/[^/]+/` or `/home/[^/]+/` patterns. Flag every match with portable replacement suggestion
8. **PARA purity** — count flat files at brain root that belong in PARA buckets

Report all issues. Validate runs read-only — no changes applied.

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

Selectively adopt capabilities from another agent, a skill, or another agent's full brain.
`$ARGUMENTS` after "absorb" is the path to the target — a file or a directory.

### Step 1 — Detect target type

| What `<path>` points to | Type | What to read |
|---|---|---|
| A `.md` file under `.claude/agents/` or `~/.claude/agents/` | Agent definition | The definition file |
| A `SKILL.md` file or a skill directory | Skill | `SKILL.md` + all supporting `.md` files in the directory |
| A `MEMORY.md` file or brain directory | Brain | `MEMORY.md` + all linked PARA files |
| Any other `.md` file | Raw | The file as-is |

### Step 2 — Read both

Read the target (per type above).
Read your own definition file and MEMORY.md.

### Step 3 — Extract delta

Identify what the target has that you don't — capabilities, principles, methods, routing rules, workflows, domain knowledge. Compare against both your definition and your PARA files to avoid re-absorbing things you already have.

For each delta item, check for conflicts with existing content.

### Step 4 — Present list

```
<target name> [<type>] has <N> things you don't currently have:

1. [<name>] — <one sentence description> [no conflict]
2. [<name>] — <one sentence description> [⚠ conflicts with: <existing principle>]
...

Pick numbers to absorb, 'all', or 'none':
```

### Step 5 — Route and apply each selected item

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

### Step 4 — Pruning + resort pass (always runs, even if no evolutions selected)

Consolidate redundant MEMORY.md entries, fix orphans (add to MEMORY.md or delete),
archive closed projects, condense verbose entries.
Re-sort MEMORY.md by bucket: areas first, then projects, resources, archives.
Goal: MEMORY.md must be shorter and correctly sorted after dream than before.

### Step 5 — Apply

Read `editor.md` and apply approved evolutions + pruning.
If CI mode: read `pr.md` and open a PR.

