import { describe, it, afterEach, expect } from 'vitest'
import { runSkill, cleanup } from './helpers/run.ts'
import { readAgentMd, countOccurrences } from './helpers/brain.ts'

describe('pre-flight check 5 — archives instruction', () => {
  let tempDir: string

  afterEach(async () => {
    if (tempDir) await cleanup(tempDir)
  })

  it('injects archives instruction when missing', async () => {
    const result = await runSkill('no-archives-instruction', '/agent-brain validate')
    tempDir = result.tempDir

    const agentMd = await readAgentMd(tempDir)
    expect(agentMd).toContain('archives/ is unindexed')
  }, 90_000)

  it('does not duplicate archives instruction on repeated runs', async () => {
    const first = await runSkill('no-archives-instruction', '/agent-brain validate')
    tempDir = first.tempDir

    // Run again against the already-modified tempDir
    const second = await runSkill('no-archives-instruction', '/agent-brain validate')
    const tempDir2 = second.tempDir

    const agentMd = await readAgentMd(tempDir2)
    expect(countOccurrences(agentMd, 'archives/ is unindexed')).toBe(1)

    await cleanup(tempDir2)
  }, 180_000)

  it('does not touch agent.md when instruction already present', async () => {
    const result = await runSkill('base-agent', '/agent-brain validate')
    tempDir = result.tempDir

    const agentMd = await readAgentMd(tempDir)
    expect(countOccurrences(agentMd, 'archives/ is unindexed')).toBe(1)
  }, 90_000)
})
