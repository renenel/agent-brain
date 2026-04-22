# agent-brain

**Self-improvement system for Claude Code agents.**

Agents that remember. Agents that grow.

`agent-brain` is a Claude Code skill that gives any agent — named sub-agent or the main assistant — a persistent PARA-structured memory and a set of commands to learn from sessions, absorb capabilities from other agents, and reflect on accumulated knowledge.

---

## Install

```bash
npx skills add renenel/agent-brain
```

That's it. Installs into your current project for Claude Code, Cursor, Codex, and any other agent detected. Add `-g` to install globally.

**Manual install:**
```bash
git clone https://github.com/renenel/agent-brain.git
cp -r agent-brain/skills/agent-brain /path/to/your/project/.claude/skills/
```

---

## Usage

Once installed, run any of these slash commands inside Claude Code:

| Command | What it does |
|---|---|
| `/agent-brain improve` | Learn from what just happened in this session |
| `/agent-brain learn <something>` | Explicitly teach the agent something new |
| `/agent-brain absorb <path>` | Compare with another agent/skill and selectively adopt capabilities |
| `/agent-brain dream` | Reflect on the full brain, surface growth opportunities, prune stale entries |

---

## How memory is stored

All state lives **in your project repo** — nothing outside it.

| Artifact | Path |
|---|---|
| PARA knowledge files | `.agent-brain/<agent-name>/` |
| Memory index | `.claude/agent-memory/<agent-name>/MEMORY.md` |
| Agent definition | `.claude/agents/<agent-name>.md` |

Each named agent (`arch-lead`, `ui-designer-dark`, etc.) gets its own namespace. The main Claude Code assistant uses `claude-code`.

---

## What's in this repo

| File | Purpose |
|---|---|
| `SKILL.md` | The skill entrypoint — loaded by Claude Code when `/agent-brain` is invoked |
| `router.md` | Classifies session artifacts into PARA destinations and priorities |
| `editor.md` | Writes PARA files, updates MEMORY.md, modifies agent definition files |
| `diff.md` | Formats proposed changes for human review before applying |
| `pr.md` | Creates a branch and PR (when `AGENT_AUTO_IMPROVE=1` is set) |
| `index.html` | Landing page |

---

## CI mode

Set `AGENT_AUTO_IMPROVE=1` in your environment to skip approval prompts — agent-brain will apply all changes and open a PR automatically.
