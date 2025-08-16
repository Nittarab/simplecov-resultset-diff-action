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
})
