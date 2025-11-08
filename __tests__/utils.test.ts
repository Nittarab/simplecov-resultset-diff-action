import {formatDiff, formatTotalCoverageDiff} from '../src/utils'

describe('Utils - Formatting Functions', () => {
  describe('formatDiff', () => {
    test('returns 5-column format with emojis for increases', () => {
      const mockDiff = {
        filename: '/test/file.rb',
        lines: {from: 50.0, to: 60.0},
        branches: {from: 80.0, to: 70.0}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual([
        'file.rb', // filename
        '60%', // line coverage
        '70%', // branch coverage
        '📈 +10%', // line diff (increase)
        '📉 -10%' // branch diff (decrease)
      ])
    })

    test('handles new files correctly', () => {
      const mockDiff = {
        filename: '/test/new_file.rb',
        lines: {from: null, to: 75.0},
        branches: {from: null, to: 50.0}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual(['new_file.rb', '75%', '50%', '🆕 NEW', '🆕 NEW'])
    })

    test('handles deleted files correctly', () => {
      const mockDiff = {
        filename: '/test/deleted_file.rb',
        lines: {from: 75.0, to: null},
        branches: {from: 50.0, to: null}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual([
        'deleted_file.rb',
        'DELETED',
        'DELETED',
        '🗑️ DELETED',
        '🗑️ DELETED'
      ])
    })

    test('handles no change (0% diff)', () => {
      const mockDiff = {
        filename: '/test/no_change.rb',
        lines: {from: 50.0, to: 50.0},
        branches: {from: 80.0, to: 80.0}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual(['no_change.rb', '50%', '80%', '➡️ 0%', '➡️ 0%'])
    })

    test('handles null coverage values', () => {
      const mockDiff = {
        filename: '/test/null_values.rb',
        lines: {from: null, to: null},
        branches: {from: null, to: null}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual(['null_values.rb', '-', '-', '-', '-'])
    })

    test('properly trims workspace paths', () => {
      const mockDiff = {
        filename: '/very/long/workspace/path/src/deep/nested/file.rb',
        lines: {from: 50.0, to: 60.0},
        branches: {from: 80.0, to: 70.0}
      }

      const result = formatDiff(mockDiff, '/very/long/workspace/path')
      expect(result[0]).toBe('src/deep/nested/file.rb')
    })

    test('handles edge case percentage values', () => {
      const mockDiff = {
        filename: '/test/edge.rb',
        lines: {from: 0.0, to: 100.0},
        branches: {from: 99.9, to: 0.1}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual([
        'edge.rb',
        '100%',
        '0.1%',
        '📈 +100%',
        '📉 -99.8%'
      ])
    })
  })

  describe('formatTotalCoverageDiff', () => {
    test('formats total coverage with increases', () => {
      const mockTotalDiff = {
        lines: {
          base: {covered: 80, total: 100, percentage: 80},
          head: {covered: 90, total: 100, percentage: 90},
          diff: 10
        },
        branches: {
          base: {covered: 40, total: 50, percentage: 80},
          head: {covered: 45, total: 50, percentage: 90},
          diff: 10
        }
      }

      const result = formatTotalCoverageDiff(mockTotalDiff)
      expect(result).toEqual([
        'Lines',
        '80/100 (80%)',
        '90/100 (90%)',
        '+10/0 📈 +10%',
        'Branches',
        '40/50 (80%)',
        '45/50 (90%)',
        '+5/0 📈 +10%'
      ])
    })

    test('formats total coverage with decreases', () => {
      const mockTotalDiff = {
        lines: {
          base: {covered: 90, total: 100, percentage: 90},
          head: {covered: 80, total: 100, percentage: 80},
          diff: -10
        },
        branches: {
          base: {covered: 45, total: 50, percentage: 90},
          head: {covered: 40, total: 50, percentage: 80},
          diff: -10
        }
      }

      const result = formatTotalCoverageDiff(mockTotalDiff)
      expect(result).toEqual([
        'Lines',
        '90/100 (90%)',
        '80/100 (80%)',
        '-10/0 📉 -10%',
        'Branches',
        '45/50 (90%)',
        '40/50 (80%)',
        '-5/0 📉 -10%'
      ])
    })

    test('formats total coverage with no changes', () => {
      const mockTotalDiff = {
        lines: {
          base: {covered: 80, total: 100, percentage: 80},
          head: {covered: 80, total: 100, percentage: 80},
          diff: 0
        },
        branches: {
          base: {covered: 40, total: 50, percentage: 80},
          head: {covered: 40, total: 50, percentage: 80},
          diff: 0
        }
      }

      const result = formatTotalCoverageDiff(mockTotalDiff)
      expect(result).toEqual([
        'Lines',
        '80/100 (80%)',
        '80/100 (80%)',
        '➡️ 0%',
        'Branches',
        '40/50 (80%)',
        '40/50 (80%)',
        '➡️ 0%'
      ])
    })

    test('formats total coverage with added lines/branches', () => {
      const mockTotalDiff = {
        lines: {
          base: {covered: 80, total: 100, percentage: 80},
          head: {covered: 90, total: 110, percentage: 81.82},
          diff: 1.82
        },
        branches: {
          base: {covered: 40, total: 50, percentage: 80},
          head: {covered: 45, total: 60, percentage: 75},
          diff: -5
        }
      }

      const result = formatTotalCoverageDiff(mockTotalDiff)
      expect(result).toEqual([
        'Lines',
        '80/100 (80%)',
        '90/110 (81.8%)',
        '+10/+10 📈 +1.8%',
        'Branches',
        '40/50 (80%)',
        '45/60 (75%)',
        '+5/+10 📉 -5%'
      ])
    })
  })

  describe('Multi-suite test framework aggregation', () => {
    test('handles coverage from 3+ test frameworks correctly', () => {
      const path = require('path')
      const {parseResultset} = require('../src/utils')
      const {Coverage} = require('../src/simplecov')

      const basePath = path.resolve(
        __dirname,
        './fixtures/multi_suite_base.json'
      )
      const headPath = path.resolve(
        __dirname,
        './fixtures/multi_suite_head.json'
      )

      const baseResultset = parseResultset(basePath)
      const headResultset = parseResultset(headPath)

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      // Should have merged files from all 3 suites (2 files per suite: shared + suite-specific)
      expect(baseCoverage.files.length).toBe(6) // RSpec: shared.rb, rspec_only.rb; Minitest: shared.rb, minitest_only.rb; Cucumber: shared.rb, cucumber_only.rb
      expect(headCoverage.files.length).toBe(6)

      // Find all shared.rb entries (should be 3, one from each suite)
      const baseSharedFiles = baseCoverage.files.filter(f =>
        f.filename.includes('shared.rb')
      )
      const headSharedFiles = headCoverage.files.filter(f =>
        f.filename.includes('shared.rb')
      )

      expect(baseSharedFiles.length).toBe(3)
      expect(headSharedFiles.length).toBe(3)

      // Verify each suite's coverage of shared.rb
      // RSpec base: [1,1,1,0,null] = 3/4 = 75%
      // Minitest base: [1,0,0,1,null] = 2/4 = 50%
      // Cucumber base: [0,1,0,0,null] = 1/4 = 25%
      const baseLineCoverages = baseSharedFiles.map(f => f.lines).sort((a, b) => a - b)
      expect(baseLineCoverages).toEqual([25, 50, 75])

      // RSpec head: [1,1,1,1,null] = 4/4 = 100%
      // Minitest head: [1,1,0,1,null] = 3/4 = 75%
      // Cucumber head: [1,1,1,0,null] = 3/4 = 75%
      const headLineCoverages = headSharedFiles.map(f => f.lines).sort((a, b) => a - b)
      expect(headLineCoverages).toEqual([75, 75, 100])
    })

    test('suite-specific files are correctly included', () => {
      const path = require('path')
      const {parseResultset} = require('../src/utils')
      const {Coverage} = require('../src/simplecov')

      const basePath = path.resolve(
        __dirname,
        './fixtures/multi_suite_base.json'
      )

      const baseResultset = parseResultset(basePath)
      const baseCoverage = new Coverage(baseResultset)

      // Verify each suite-specific file exists
      const rspecOnly = baseCoverage.files.find(f =>
        f.filename.includes('rspec_only')
      )
      const minitestOnly = baseCoverage.files.find(f =>
        f.filename.includes('minitest_only')
      )
      const cucumberOnly = baseCoverage.files.find(f =>
        f.filename.includes('cucumber_only')
      )

      expect(rspecOnly).toBeDefined()
      expect(minitestOnly).toBeDefined()
      expect(cucumberOnly).toBeDefined()

      // Verify their coverage
      expect(rspecOnly!.lines).toBe(100) // [1,1,1] = 3/3
      expect(minitestOnly!.lines).toBe(66.66) // [1,1,0] = 2/3
      expect(cucumberOnly!.lines).toBe(66.66) // [1,0,1] = 2/3
    })
  })
})
