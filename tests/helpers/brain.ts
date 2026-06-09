import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { expect } from 'vitest'

const AGENT_NAME = 'test-agent'

export function agentMdPath(tempDir: string): string {
  return join(tempDir, `.claude/agents/${AGENT_NAME}.md`)
}

export function memoryPath(tempDir: string): string {
  return join(tempDir, `.claude/agent-memory/${AGENT_NAME}/MEMORY.md`)
}

export function paraPath(tempDir: string, subpath: string): string {
  return join(tempDir, `.agent-brain/${AGENT_NAME}/${subpath}`)
}

export async function readAgentMd(tempDir: string): Promise<string> {
  return readFile(agentMdPath(tempDir), 'utf8')
}

export async function readMemory(tempDir: string): Promise<string> {
  return readFile(memoryPath(tempDir), 'utf8')
}

export async function readParaFile(tempDir: string, subpath: string): Promise<string> {
  return readFile(paraPath(tempDir, subpath), 'utf8')
}

export function fileExists(tempDir: string, relativePath: string): boolean {
  return existsSync(join(tempDir, relativePath))
}

export async function listParaFiles(tempDir: string, bucket: string): Promise<string[]> {
  const dir = paraPath(tempDir, bucket)
  if (!existsSync(dir)) return []
  return readdir(dir, { recursive: true }) as Promise<string[]>
}

export function assertContains(text: string, substring: string): void {
  expect(text.toLowerCase()).toContain(substring.toLowerCase())
}

export function assertNotContains(text: string, substring: string): void {
  expect(text.toLowerCase()).not.toContain(substring.toLowerCase())
}

export function countOccurrences(text: string, substring: string): number {
  return text.split(substring).length - 1
}
