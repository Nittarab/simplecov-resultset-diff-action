export type ResultSet = Record<
  string,
  {
    coverage: RawCoverages
  }
>

type RawCoverages = Record<string, RawCoverage>

interface RawCoverage {
  lines: LineCoverage
  branches: BranchCoverage
}

type LineCoverage = (number | null)[]

type BranchCoverage = Record<string, Record<string, number>>

export interface FileCoverage {
  filename: string
  lines: number
  branches: number
}

export interface CoverageStats {
  covered: number
  total: number
  percentage: number
}

export interface TotalCoverageStats {
  lines: CoverageStats
  branches: CoverageStats
}

export interface TotalCoverageDiff {
  lines: {
    base: CoverageStats
    head: CoverageStats
    diff: number
  }
  branches: {
    base: CoverageStats
    head: CoverageStats
    diff: number
  }
}

export interface TotalCoverage {
  lines: {
    covered: number
    total: number
    percentage: number
  }
  branches: {
    covered: number
    total: number
    percentage: number
  }
}

function floor(n: number, digits = 0): number {
  const d = Math.pow(10, digits)
  const x = Math.floor(n * d)
  return x / d
}

function linesStats(coverage: LineCoverage): {
  covered: number
  total: number
  percentage: number
} {
  const effectiveLines = coverage.filter(hit => hit !== null) as number[]
  const total = effectiveLines.length
  if (total === 0) {
    return {covered: 0, total: 0, percentage: 100}
  }

  const covered = effectiveLines.filter(hit => hit > 0).length
  return {
    covered,
    total,
    percentage: floor((covered / total) * 100, 2)
  }
}

function linesCoverage(coverage: LineCoverage): number {
  return linesStats(coverage).percentage
}

function branchesStats(coverage: BranchCoverage | undefined): {
  covered: number
  total: number
  percentage: number
} {
  if (!coverage) {
    return {covered: 0, total: 0, percentage: 100}
  }

  const conditions = Object.keys(coverage)
  if (conditions.length === 0) {
    return {covered: 0, total: 0, percentage: 100}
  }

  let total = 0
  let covered = 0
  for (const k of conditions) {
    const cond = coverage[k]
    for (const branch of Object.keys(cond)) {
      total += 1
      const hit = cond[branch]
      if (hit > 0) {
        covered += 1
      }
    }
  }
  return {
    covered,
    total,
    percentage: floor((covered / total) * 100, 2)
  }
}

function branchesCoverages(coverage: BranchCoverage | undefined): number {
  return branchesStats(coverage).percentage
}

export class Coverage {
  files: FileCoverage[]
  private rawCoverages: RawCoverages

  constructor(resultset: ResultSet) {
    this.files = []
    this.rawCoverages = {}

    for (const coverages of Object.values(resultset)) {
      for (const [filename, coverage] of Object.entries(
        coverages['coverage']
      )) {
        this.rawCoverages[filename] = coverage
        this.files.push({
          filename,
          lines: linesCoverage(coverage.lines),
          branches: branchesCoverages(coverage.branches ?? {})
        })
      }
    }
  }

  filesMap(): Map<string, FileCoverage> {
    const map = new Map<string, FileCoverage>()
    for (const fileCov of this.files) {
      map.set(fileCov.filename, fileCov)
    }
    return map
  }

  getTotalLinesCoverage(): TotalCoverage['lines'] {
    let totalCovered = 0
    let totalLines = 0

    for (const coverage of Object.values(this.rawCoverages)) {
      const stats = linesStats(coverage.lines)
      totalCovered += stats.covered
      totalLines += stats.total
    }

    const percentage =
      totalLines === 0 ? 100 : floor((totalCovered / totalLines) * 100, 2)
    return {
      covered: totalCovered,
      total: totalLines,
      percentage
    }
  }

  getTotalBranchesCoverage(): TotalCoverage['branches'] {
    let totalCovered = 0
    let totalBranches = 0

    for (const coverage of Object.values(this.rawCoverages)) {
      const stats = branchesStats(coverage.branches ?? {})
      totalCovered += stats.covered
      totalBranches += stats.total
    }

    const percentage =
      totalBranches === 0 ? 100 : floor((totalCovered / totalBranches) * 100, 2)
    return {
      covered: totalCovered,
      total: totalBranches,
      percentage
    }
  }

  getTotalCoverage(): TotalCoverage {
    return {
      lines: this.getTotalLinesCoverage(),
      branches: this.getTotalBranchesCoverage()
    }
  }
}

export function getCoverageDiff(
  cov1: Coverage,
  cov2: Coverage
): FileCoverageDiff[] {
  const diff: FileCoverageDiff[] = []
  const cov1Files = cov1.filesMap()
  const cov2Files = cov2.filesMap()
  for (const filename of mergeFilenames(cov1, cov2)) {
    const fcov1 = cov1Files.get(filename)
    const fcov2 = cov2Files.get(filename)
    if (isDifference(fcov1, fcov2)) {
      diff.push(makeDiff(fcov1, fcov2))
    }
  }
  return diff
}

export function getTotalCoverageDiff(
  base: Coverage,
  head: Coverage
): TotalCoverageDiff {
  const baseTotals = base.getTotalCoverage()
  const headTotals = head.getTotalCoverage()

  return {
    lines: {
      base: baseTotals.lines,
      head: headTotals.lines,
      diff: floor(headTotals.lines.percentage - baseTotals.lines.percentage, 2)
    },
    branches: {
      base: baseTotals.branches,
      head: headTotals.branches,
      diff: floor(
        headTotals.branches.percentage - baseTotals.branches.percentage,
        2
      )
    }
  }
}

function mergeFilenames(cov1: Coverage, cov2: Coverage): string[] {
  const files1 = cov1.files.map(f => f.filename)
  const files2 = cov2.files.map(f => f.filename)
  const files = new Set<string>([...files1, ...files2])
  return Array.from(files).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

function isDifference(cov1?: FileCoverage, cov2?: FileCoverage): boolean {
  if (cov1 === cov2) {
    return false
  }
  if (cov1 && !cov2) {
    return true
  }
  if (!cov1 && cov2) {
    return true
  }
  if (cov1!.lines !== cov2!.lines) {
    return true
  }
  if (cov1!.branches !== cov2!.branches) {
    return true
  }
  return false
}

export interface FileCoverageDiff {
  filename: string
  lines: {
    from: number | null
    to: number | null
  }
  branches: {
    from: number | null
    to: number | null
  }
}

function makeDiff(cov1?: FileCoverage, cov2?: FileCoverage): FileCoverageDiff {
  if (!cov1 && !cov2) {
    throw new Error('no coverages')
  }

  if (!cov1 && cov2) {
    return {
      filename: cov2.filename,
      lines: {from: null, to: cov2.lines},
      branches: {from: null, to: cov2.branches}
    }
  }
  if (!cov2 && cov1) {
    return {
      filename: cov1.filename,
      lines: {from: cov1.lines, to: null},
      branches: {from: cov1.branches, to: null}
    }
  }
  return {
    filename: cov1!.filename,
    lines: {from: cov1!.lines, to: cov2!.lines},
    branches: {from: cov1!.branches, to: cov2!.branches}
  }
}
