/**
 * Tests for GitHub Action configuration
 */

import {readFileSync} from 'fs'
import {join} from 'path'
import yaml from 'js-yaml'
import path from 'path'
import {calculateCoverageDiff} from '../src/main'
import {parseResultset} from '../src/utils'
import {Coverage} from '../src/simplecov'

describe('GitHub Action Configuration', () => {
  it('should specify Node.js 20 runtime', () => {
    const actionPath = join(__dirname, '..', 'action.yml')
    const actionContent = readFileSync(actionPath, 'utf8')
    const actionConfig = yaml.load(actionContent) as any

    expect(actionConfig.runs.using).toBe('node20')
    expect(actionConfig.runs.main).toBe('dist/index.js')
  })

  it('should have all required inputs defined', () => {
    const actionPath = join(__dirname, '..', 'action.yml')
    const actionContent = readFileSync(actionPath, 'utf8')
    const actionConfig = yaml.load(actionContent) as any

    expect(actionConfig.inputs).toBeDefined()
    expect(actionConfig.inputs['base-resultset-path']).toBeDefined()
    expect(actionConfig.inputs['head-resultset-path']).toBeDefined()
    expect(actionConfig.inputs['token']).toBeDefined()

    // Verify required inputs
    expect(actionConfig.inputs['base-resultset-path'].required).toBe(true)
    expect(actionConfig.inputs['head-resultset-path'].required).toBe(true)
    expect(actionConfig.inputs['token'].required).toBe(false)
  })

  it('should specify Node.js 22 in CI workflow', () => {
    const ciPath = join(__dirname, '..', '.github', 'workflows', 'ci.yml')
    const ciContent = readFileSync(ciPath, 'utf8')
    const ciConfig = yaml.load(ciContent) as any

    expect(ciConfig.env.NODE_VERSION).toBe('22')
  })
})

describe('Output formatting scenarios', () => {
  it('shows summary and file coverage when totals change and new file added', () => {
    const basePath = path.resolve(__dirname, './fixtures/totals_only_base.json')
    const headPath = path.resolve(__dirname, './fixtures/totals_only_head.json')

    const diff = calculateCoverageDiff({base: basePath, head: headPath})

    // Should have Coverage Summary section
    expect(diff).toContain('Coverage Summary')
    expect(diff).toMatch(/Lines\s+\|/)
    expect(diff).toMatch(/Branches\s+\|/)

    // Should have File Coverage section - because adding a new file counts as a diff
    expect(diff).toContain('File Coverage')

    // Should include the new file
    expect(diff).toContain('small_change6.rb')

    // Should show overall coverage improvement (from base 70% to head ~76.67%)
    expect(diff).toMatch(/📈/)
  })

  it('should calculate accurate totals for many small changes', () => {
    const basePath = path.resolve(__dirname, './fixtures/totals_only_base.json')
    const headPath = path.resolve(__dirname, './fixtures/totals_only_head.json')

    const baseResultset = parseResultset(basePath)
    const headResultset = parseResultset(headPath)

    const baseCoverage = new Coverage(baseResultset)
    const headCoverage = new Coverage(headResultset)

    // Base has 5 files
    expect(baseCoverage.files.length).toBe(5)

    // Head has 6 files (added one new file)
    expect(headCoverage.files.length).toBe(6)

    // Verify total coverage math
    // Base: covered lines = 9+8+7+6+5 = 35; total lines = 5*10 = 50 -> 70%
    const baseTotals = baseCoverage.getTotalLinesCoverage()
    expect(baseTotals.covered).toBe(35)
    expect(baseTotals.total).toBe(50)
    expect(baseTotals.percentage).toBe(70)

    // Head: covered lines = 10+9+8+7+6+6 = 46; total lines = 6*10 = 60 -> 76.66% floored
    const headTotals = headCoverage.getTotalLinesCoverage()
    expect(headTotals.covered).toBe(46)
    expect(headTotals.total).toBe(60)
    expect(headTotals.percentage).toBe(76.66)

    // Verify small changes in individual base files (each is 0-10% change except one new file)
    expect(baseCoverage.files[0].lines).toBe(90) // small_change1.rb
    expect(baseCoverage.files[1].lines).toBe(80) // small_change2.rb
    expect(baseCoverage.files[2].lines).toBe(70) // small_change3.rb
    expect(baseCoverage.files[3].lines).toBe(60) // small_change4.rb
    expect(baseCoverage.files[4].lines).toBe(50) // small_change5.rb
  })
})