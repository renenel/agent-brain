import { describe, it, afterEach } from 'vitest'
import { runSkill, cleanup } from './helpers/run.ts'
import { assertContains, assertNotContains } from './helpers/brain.ts'

describe('validate mode', () => {
  let tempDir: string

  afterEach(async () => {
    if (tempDir) await cleanup(tempDir)
  })

  it('check 9: flags archives/ entries in MEMORY.md as drift', async () => {
    const result = await runSkill('archives-indexed', '/agent-brain validate')
    tempDir = result.tempDir

    assertContains(result.stdout, 'archives')
    assertContains(result.stdout, 'drift')
  }, 90_000)

  it('check 10: flags missing archives instruction in agent.md', async () => {
    const result = await runSkill('no-archives-instruction', '/agent-brain validate')
    tempDir = result.tempDir

    assertContains(result.stdout, 'archives instruction')
  }, 90_000)

  it('clean brain passes without errors', async () => {
    const result = await runSkill('base-agent', '/agent-brain validate')
    tempDir = result.tempDir

    assertNotContains(result.stdout, 'error')
    assertNotContains(result.stdout, 'drift')
    assertNotContains(result.stdout, 'missing')
  }, 90_000)
})
