import { describe, it, afterEach, expect } from 'vitest'
import { runSkill, cleanup } from './helpers/run.ts'
import { countOccurrences } from './helpers/brain.ts'

describe('interview mode', () => {
  let tempDir: string

  afterEach(async () => {
    if (tempDir) await cleanup(tempDir)
  })

  it('surfaces gaps and asks the user questions', async () => {
    // thin-brain has a defined role (release engineer for Foo payments) but an
    // empty MEMORY.md, so interview should find gaps and ask about them.
    const result = await runSkill('thin-brain', '/agent-brain interview')
    tempDir = result.tempDir

    // Step 2 asks 3–6 questions at once — expect the model to actually ask.
    expect(
      countOccurrences(result.stdout, '?'),
      `stdout was:\n${result.stdout.substring(0, 900)}`,
    ).toBeGreaterThanOrEqual(2)

    // Questions should target the role's implied-but-uncaptured coverage.
    const onTopic = result.stdout.toLowerCase().match(/deploy|rollback|on-call|on call|promotion|gap/)
    expect(onTopic, `stdout was:\n${result.stdout.substring(0, 900)}`).not.toBeNull()
    // A single agent-brain run was measured at ~97s locally, so 90s is borderline; give CI headroom.
  }, 120_000)
})
