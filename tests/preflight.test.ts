import { describe, it, afterEach, expect } from 'vitest'
import { runSkill, cleanup } from './helpers/run.ts'
import { readAgentMd, countOccurrences } from './helpers/brain.ts'

describe('pre-flight check 5 — archives instruction', () => {
  let tempDir: string

  afterEach(async () => {
    if (tempDir) await cleanup(tempDir)
  })

  it('surfaces missing archives instruction during dream', async () => {
    // In --print mode Claude surfaces the gap in the report rather than silently writing.
    // The test verifies the skill detects and flags the missing instruction.
    const result = await runSkill('no-archives-instruction', '/agent-brain dream')
    tempDir = result.tempDir

    const flagged = result.stdout.toLowerCase().match(/archives.*instruction|archives.*gap|missing.*archives|archives.*missing|archives.*omit/)
    expect(flagged, `stdout was:\n${result.stdout.substring(0, 500)}`).not.toBeNull()
  }, 90_000)

  it('does not duplicate archives instruction when already present', async () => {
    // base-agent already has the instruction — running dream should not add a second copy
    const result = await runSkill('base-agent', '/agent-brain dream')
    tempDir = result.tempDir

    const agentMd = await readAgentMd(tempDir)
    expect(countOccurrences(agentMd, 'archives/ is unindexed')).toBe(1)
  }, 90_000)
})
