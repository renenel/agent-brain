import { execa } from 'execa'
import { cp, mkdir, rm, symlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const REPO_ROOT = new URL('../../', import.meta.url).pathname
const FIXTURES_DIR = join(REPO_ROOT, 'tests/fixtures')
const SKILL_SRC = join(REPO_ROOT, 'skills/agent-brain')

export interface RunResult {
  stdout: string
  stderr: string
  tempDir: string
  exitCode: number
}

export async function runSkill(fixtureName: string, command: string): Promise<RunResult> {
  const tempDir = join(tmpdir(), `agent-brain-test-${randomUUID()}`)

  await mkdir(tempDir, { recursive: true })
  await cp(join(FIXTURES_DIR, fixtureName), tempDir, { recursive: true })

  // Make the skill available inside the temp dir
  const skillsDir = join(tempDir, '.claude/skills')
  await mkdir(skillsDir, { recursive: true })
  await symlink(SKILL_SRC, join(skillsDir, 'agent-brain'))

  const result = await execa('claude', ['--print', command], {
    cwd: tempDir,
    reject: false,
    timeout: 90_000,
  })

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    tempDir,
    exitCode: result.exitCode ?? 0,
  }
}

export async function cleanup(tempDir: string): Promise<void> {
  await rm(tempDir, { recursive: true, force: true })
}
