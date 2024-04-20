import fs from 'fs'
import {FileCoverageDiff, ResultSet} from './simplecov'
import path from 'path'

export function doesPathExists(filepath: string): void {
  // test throw new Error('Function not implemented.')
  if (!fs.existsSync(filepath)) {
    throw new Error(`${filepath} does not exist!`)
  }
}

export function parseResultset(
  resultsetPath: string,
  workspace: string
): ResultSet {
  const content = fs.readFileSync(path.resolve(workspace, resultsetPath))
  return JSON.parse(content.toString()) as ResultSet
}

function truncPercentage(n: number): number {
  return Math.sign(n) * (Math.trunc(Math.abs(n) * 10) / 10)
}

function badgeUrl(from: number, to: number): string {
  const top =
    'https://raw.githubusercontent.com/nittarab/simplecov-resultset-diff-action/main/assets'
  const diff = Math.abs(truncPercentage(to - from))
  if (diff === 0) {
    return `${top}/0.svg`
  } else {
    const dir = Math.sign(to - from) < 0 ? 'down' : 'up'
    const n = Math.trunc(diff)
    const m = (diff * 10) % 10
    return `${top}/${dir}/${n}/${n}.${m}.svg`
  }
}

function formatDiffItem({
  from,
  to
}: {
  from: number | null
  to: number | null
}): string {
  let p = ''
  let badge = ''
  if (to !== null) {
    p = ` ${truncPercentage(to)}%`
  }
  if (from !== null && to !== null) {
    badge = ` ![${truncPercentage(to - from)}%](${badgeUrl(from, to)})`
  }
  const created = from === null && to !== null ? 'NEW' : ''
  const deleted = from !== null && to === null ? 'DELETE' : ''
  return `${created}${deleted}${p}${badge}`
}

function trimWorkspacePath(filename: string, workspace: string): string {
  const workspace_path = `${workspace}/`
  if (filename.startsWith(workspace_path)) {
    return filename.slice(workspace_path.length)
  } else {
    return filename
  }
}

export function formatDiff(
  diff: FileCoverageDiff,
  workspace: string
): [string, string, string] {
  return [
    trimWorkspacePath(diff.filename, workspace),
    formatDiffItem(diff.lines),
    formatDiffItem(diff.branches)
  ]
}
