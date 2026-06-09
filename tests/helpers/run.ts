import { execa } from 'execa'
import { cp, mkdir, rm, symlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const REPO_ROOT = new URL('../../', import.meta.url).pathname
const FIXTURES_DIR = join(REPO_ROOT, 'tests/fixtures')
const SKILL_SRC = join(REPO_ROOT, 'skills/agent-brain')
const DEFAULT_TIMEOUT_MS = 90_000

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

  const args = ['--print']
  if (process.env.CLAUDE_MODEL) {
    args.push('--model', process.env.CLAUDE_MODEL)
  }
  if (process.env.CLAUDE_MAX_BUDGET_USD) {
    args.push('--max-budget-usd', process.env.CLAUDE_MAX_BUDGET_USD)
  }
  args.push(command)

  const timeout = Number.parseInt(process.env.CLAUDE_E2E_TIMEOUT_MS ?? '', 10)
  const result = await execa('claude', args, {
    cwd: tempDir,
    reject: false,
    timeout: Number.isFinite(timeout) ? timeout : DEFAULT_TIMEOUT_MS,
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
