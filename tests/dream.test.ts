import { describe, it, afterEach } from 'vitest'
import { runSkill, cleanup } from './helpers/run.ts'
import { readMemory, assertContains, assertNotContains } from './helpers/brain.ts'

describe('dream mode', () => {
  let tempDir: string

  afterEach(async () => {
    if (tempDir) await cleanup(tempDir)
  })

  it('surfaces TTL candidates for stale projects', async () => {
    const result = await runSkill('ttl-candidates', '/agent-brain dream')
    tempDir = result.tempDir

    assertContains(result.stdout, 'stale-project')
    assertContains(result.stdout, 'ttl')
  }, 90_000)

  it('proposes cluster consolidation for dense subtopics', async () => {
    const result = await runSkill('cluster-brain', '/agent-brain dream')
    tempDir = result.tempDir

    assertContains(result.stdout, 'consolidate cluster')
    assertContains(result.stdout, 'areas/engineering')
  }, 90_000)

  it('does not re-index archived files after archiving', async () => {
    // Run dream in CI mode so it auto-applies (no interactive prompt)
    const result = await runSkill('ttl-candidates', 'AGENT_AUTO_IMPROVE=1 /agent-brain dream')
    tempDir = result.tempDir

    const memory = await readMemory(tempDir)
    assertNotContains(memory, 'archives/')
  }, 90_000)
})
