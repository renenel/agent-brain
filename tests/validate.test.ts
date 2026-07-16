import { describe, it, afterEach, expect } from 'vitest'
import { runSkill, cleanup } from './helpers/run.ts'
import { assertContains, assertNotContains } from './helpers/brain.ts'

describe('validate mode', () => {
  let tempDir: string

  afterEach(async () => {
    if (tempDir) await cleanup(tempDir)
  })

  it('check 9: flags archives/ entries in MEMORY.md as incorrectly indexed', async () => {
    const result = await runSkill('archives-indexed', '/agent-brain validate')
    tempDir = result.tempDir

    assertContains(result.stdout, 'archives')
    assertContains(result.stdout, 'memory.md')
  }, 90_000)

  it('check 10: flags missing archives instruction in agent.md', async () => {
    const result = await runSkill('no-archives-instruction', '/agent-brain validate')
    tempDir = result.tempDir

    assertContains(result.stdout, 'archives instruction')
  }, 90_000)

  it('clean brain passes without errors', async () => {
    const result = await runSkill('base-agent', '/agent-brain validate')
    tempDir = result.tempDir

    const clean = result.stdout.toLowerCase().match(/structurally clean|issues found: 0|no (?:structural )?issues|0 issues|no structural issues detected|no corrections needed/)
    expect(clean, `stdout was:\n${result.stdout.substring(0, 500)}`).not.toBeNull()
  }, 90_000)

  it('check 11: flags a resource whose last_reviewed is stale (>180d) as review-due', async () => {
    const result = await runSkill('stale-review', '/agent-brain validate')
    tempDir = result.tempDir

    // It must name the offending file...
    assertContains(result.stdout, 'old-runbook')
    // ...and frame it as a review-freshness / staleness issue (not a TTL one).
    const flagged = result.stdout.toLowerCase().match(/last_reviewed|review-due|review due|stale|180/)
    expect(flagged, `stdout was:\n${result.stdout.substring(0, 700)}`).not.toBeNull()
    // ~97s measured for a single run locally; 90s is borderline, so give CI headroom.
  }, 120_000)
})
