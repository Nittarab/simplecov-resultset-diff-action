import fs from 'fs'
import {
  FileCoverageDiff,
  ResultSet,
  TotalCoverageDiff,
  CoverageStats
} from './simplecov'
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

function getChangeEmoji(diff: number): string {
  if (diff > 0) return '📈'
  if (diff < 0) return '📉'
  return '➡️'
}

function formatPercentage(value: number | null): string {
  if (value === null) return '-'
  return `${truncPercentage(value)}%`
}

function formatPercentageDiff(diff: number): string {
  if (diff === 0) return '➡️ 0%'
  const emoji = getChangeEmoji(diff)
  const sign = diff > 0 ? '+' : ''
  return `${emoji} ${sign}${truncPercentage(diff)}%`
}

function formatCoverageValue({
  from,
  to
}: {
  from: number | null
  to: number | null
}): string {
  if (to !== null) {
    return formatPercentage(to)
  }
  return from !== null ? 'DELETED' : '-'
}

function formatCoverageDiff({
  from,
  to
}: {
  from: number | null
  to: number | null
}): string {
  if (from === null && to !== null) return '🆕 NEW'
  if (from !== null && to === null) return '🗑️ DELETED'
  if (from !== null && to !== null) {
    return formatPercentageDiff(to - from)
  }
  return '-'
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
): [string, string, string, string, string] {
  return [
    trimWorkspacePath(diff.filename, workspace),
    formatCoverageValue(diff.lines),
    formatCoverageValue(diff.branches),
    formatCoverageDiff(diff.lines),
    formatCoverageDiff(diff.branches)
  ]
}

function formatCoverageStatsValue(stats: CoverageStats): string {
  return `${stats.covered}/${stats.total} (${formatPercentage(stats.percentage)})`
}

function formatCoverageStatsDiff(
  baseStats: CoverageStats,
  headStats: CoverageStats,
  diff: number
): string {
  const coveredDiff = headStats.covered - baseStats.covered
  const totalDiff = headStats.total - baseStats.total

  let result = ''

  // Show change in covered/total if there's a difference
  if (coveredDiff !== 0 || totalDiff !== 0) {
    const coveredSign = coveredDiff > 0 ? '+' : ''
    const totalSign = totalDiff > 0 ? '+' : totalDiff === 0 ? '' : ''
    const totalDiffStr = totalDiff === 0 ? '0' : `${totalSign}${totalDiff}`
    result = `${coveredSign}${coveredDiff}/${totalDiffStr} `
  }

  // Add percentage diff
  result += formatPercentageDiff(diff)

  return result
}

export function formatTotalCoverageDiff(
  totalDiff: TotalCoverageDiff
): string[] {
  return [
    'Lines',
    formatCoverageStatsValue(totalDiff.lines.base),
    formatCoverageStatsValue(totalDiff.lines.head),
    formatCoverageStatsDiff(
      totalDiff.lines.base,
      totalDiff.lines.head,
      totalDiff.lines.diff
    ),
    'Branches',
    formatCoverageStatsValue(totalDiff.branches.base),
    formatCoverageStatsValue(totalDiff.branches.head),
    formatCoverageStatsDiff(
      totalDiff.branches.base,
      totalDiff.branches.head,
      totalDiff.branches.diff
    )
  ]
}
