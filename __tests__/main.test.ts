import * as path from 'path'
import {calculateCoverageDiff} from '../src/main'
import {formatDiff} from '../src/utils'
import {jest} from '@jest/globals'

jest.mock('@actions/github')
jest.mock('@actions/core')

describe('main.ts', () => {
  const paths = {
    base: path.resolve(__dirname, './fixtures/resultset1.json'),
    head: path.resolve(__dirname, './fixtures/resultset2.json')
  }

  const pathsIdentical = {
    base: path.resolve(__dirname, './fixtures/resultset1.json'),
    head: path.resolve(__dirname, './fixtures/resultset1.json')
  }

  const pathsNonExistent = {
    base: path.resolve(__dirname, './fixtures/nonexistent.json'),
    head: path.resolve(__dirname, './fixtures/nonexistent.json')
  }
  const pathsNotCoverage = {
    base: path.resolve(__dirname, './fixtures/not_coverage.json'),
    head: path.resolve(__dirname, './fixtures/resultset1.json')
  }

  test('calculateCoverageDiff returns expected output when there are differences', () => {
    const result = calculateCoverageDiff(paths)
    expect(result).toContain('Coverage difference')
    expect(result).toContain('Filename')
    expect(result).toContain('Line Coverage')
    expect(result).toContain('Branch Coverage')
    expect(result).toContain('Line Diff')
    expect(result).toContain('Branch Diff')
    expect(result).toContain('📈') // Should contain increase emoji
    expect(result).toContain('📉') // Should contain decrease emoji
    expect(result).toContain('🆕 NEW') // Should contain new file indicator
    expect(result).toContain('🗑️ DELETED') // Should contain deleted file indicator
    expect(result).not.toBe('## Coverage difference\nNo differences\n')
  })

  test('calculateCoverageDiff returns expected output when there are no differences', () => {
    const result = calculateCoverageDiff(pathsIdentical)
    expect(result).toBe('## Coverage difference\nNo differences\n')
  })

  test('calculateCoverageDiff throws error when paths do not exist', () => {
    expect(() => calculateCoverageDiff(pathsNonExistent)).toThrow()
  })
  //
  test('calculateCoverageDiff throws error when paths are not coverage files', () => {
    expect(() => calculateCoverageDiff(pathsNotCoverage)).toThrow()
  })

  test('formatDiff returns 5-column format with emojis', () => {
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

  test('formatDiff handles new files correctly', () => {
    const mockDiff = {
      filename: '/test/new_file.rb',
      lines: {from: null, to: 75.0},
      branches: {from: null, to: 50.0}
    }

    const result = formatDiff(mockDiff, '/test')
    expect(result).toEqual(['new_file.rb', '75%', '50%', '🆕 NEW', '🆕 NEW'])
  })

  test('formatDiff handles deleted files correctly', () => {
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

  // Note: Dry-run mode tests would require mocking the run function properly
  // For now, this functionality is tested through the integration tests in CI
})
