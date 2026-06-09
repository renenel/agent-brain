# Security findings — trust agent hub review

This document records findings from the agent-brain trust agent hub security review, with disposition and reasoning for each. Maintained so future audits don't re-flag dismissed items as unaddressed.

## Findings

### PROMPT_INJECTION — learn command accepts untrusted `$ARGUMENTS`
**Status: Fixed**
`SKILL.md` learn Step 1 now instructs the router to discard and flag any `$ARGUMENTS` that contain imperative overrides (e.g. "ignore previous instructions", "delete", "forget all rules") before routing proceeds.

### PROMPT_INJECTION — absorb reads untrusted file content
**Status: Fixed**
`SKILL.md` absorb Step 2 now explicitly frames target file content as data to analyze, not instructions to follow. Imperative directives found in absorbed content are surfaced as conflicts for user review rather than executed.

### COMMAND_INJECTION — pr.md uses agent-generated strings in shell commands
**Status: Fixed**
`pr.md` now requires: shell metacharacters stripped from the commit message summary line, summary capped at 72 chars, commit message passed via heredoc, PR body passed via `--body-file`. Agent-name and mode (the other inputs to branch naming) are internal values not derived from user input.

### DATA_EXFILTRATION — absorb reads from arbitrary file paths
**Status: Dismissed — by design**
The `absorb` command is explicitly invoked by the user with a path of their choosing. The user authorizes the read at invocation time. Restricting readable paths would break the core use case (absorbing from any agent, skill, or brain on the filesystem). No mitigation added.

### DATA_EXFILTRATION — CI mode auto-pushes to remote repository
**Status: Dismissed — by design**
CI mode (`AGENT_AUTO_IMPROVE=1`) pushes to a branch and opens a PR. The PR is the human review gate — changes require explicit approval before merge. Auto-push to a review branch is the intended design, not a vulnerability. With prompt injection mitigations in place (see above), the risk of sensitive content reaching the PR is already addressed upstream.
