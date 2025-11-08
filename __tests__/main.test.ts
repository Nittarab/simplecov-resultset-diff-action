import * as path from 'path'
import {calculateCoverageDiff} from '../src/main'
import {jest} from '@jest/globals'
import {setupTestEnvironment} from './test-helpers'

// Mock the GitHub Actions modules
jest.mock('@actions/github')
jest.mock('@actions/core')

describe('SimpleCov Resultset Diff Action - Core Functionality', () => {
  const fixtures = {
    base: path.resolve(__dirname, './fixtures/resultset1.json'),
    head: path.resolve(__dirname, './fixtures/resultset2.json'),
    identical: path.resolve(__dirname, './fixtures/resultset1.json'),
    nonExistent: path.resolve(__dirname, './fixtures/nonexistent.json'),
    notCoverage: path.resolve(__dirname, './fixtures/not_coverage.json')
  }

  beforeEach(() => {
    setupTestEnvironment()
  })

  describe('calculateCoverageDiff', () => {
    test('returns expected output when there are differences', () => {
      const result = calculateCoverageDiff({
        base: fixtures.base,
        head: fixtures.head
      })

      expect(result).toContain('Coverage difference')
      expect(result).toContain('Filename')
      expect(result).toContain('Line Coverage')
      expect(result).toContain('Branch Coverage')
      expect(result).toContain('Line Diff')
      expect(result).toContain('Branch Diff')
      expect(result).toContain('📈')
      expect(result).toContain('📉')
      expect(result).toContain('🆕 NEW')
      expect(result).toContain('🗑️ DELETED')
      expect(result).not.toBe('## Coverage difference\nNo differences\n')
    })

    test('returns expected output when there are no differences', () => {
      const result = calculateCoverageDiff({
        base: fixtures.identical,
        head: fixtures.identical
      })

      expect(result).toBe('## Coverage difference\nNo differences\n')
    })

    test('throws error when paths do not exist', () => {
      expect(() =>
        calculateCoverageDiff({
          base: fixtures.nonExistent,
          head: fixtures.nonExistent
        })
      ).toThrow()
    })

    test('throws error when paths are not coverage files', () => {
      expect(() =>
        calculateCoverageDiff({
          base: fixtures.notCoverage,
          head: fixtures.base
        })
      ).toThrow()
    })

    test('handles workspace path resolution correctly', () => {
      // Save original environment
      const originalNodeEnv = process.env.NODE_ENV
      const originalGitHubWorkspace = process.env.GITHUB_WORKSPACE

      try {
        // Set production environment
        delete process.env.NODE_ENV
        process.env.GITHUB_WORKSPACE = '/github/workspace'

        const result = calculateCoverageDiff({
          base: fixtures.identical,
          head: fixtures.identical
        })

        expect(result).toContain('No differences')
      } finally {
        // Restore original values
        if (originalNodeEnv !== undefined) {
          process.env.NODE_ENV = originalNodeEnv
        } else {
          delete process.env.NODE_ENV
        }
        if (originalGitHubWorkspace !== undefined) {
          process.env.GITHUB_WORKSPACE = originalGitHubWorkspace
        } else {
          delete process.env.GITHUB_WORKSPACE
        }
      }
    })

    test('formats markdown table correctly with proper headers', () => {
      const result = calculateCoverageDiff({
        base: fixtures.base,
        head: fixtures.head
      })

      // Should contain markdown table structure
      expect(result).toMatch(/\|.*Filename.*\|/)
      expect(result).toMatch(/\|.*Line Coverage.*\|/)
      expect(result).toMatch(/\|.*Branch Coverage.*\|/)
      expect(result).toMatch(/\|.*Line Diff.*\|/)
      expect(result).toMatch(/\|.*Branch Diff.*\|/)
    })

    test('includes total coverage summary when there are total coverage changes', () => {
      const result = calculateCoverageDiff({
        base: fixtures.base,
        head: fixtures.head
      })

      expect(result).toContain('## Coverage Summary')
      expect(result).toContain(
        '| Metric   | Base         | Head         | Change          |'
      )
      expect(result).toContain('Lines')
      expect(result).toContain('Branches')
      expect(result).toContain('## File Coverage')
    })

    test('shows only file coverage when total coverage unchanged (no summary)', () => {
      const basePath = path.resolve(
        __dirname,
        './fixtures/identical_totals_base.json'
      )
      const headPath = path.resolve(
        __dirname,
        './fixtures/identical_totals_head.json'
      )

      // Totals: base covered=2 total=2 (100%), head covered=2 total=2 (100%)
      const result = calculateCoverageDiff({
        base: basePath,
        head: headPath
      })

      // Should not include Coverage Summary section
      expect(result).not.toContain('## Coverage Summary')
      // Should include file coverage table due to per-file changes
      expect(result).toContain('Filename')
      expect(result).toContain('file1.rb')
      expect(result).toContain('file2.rb')
    })
  })

  // Note: Coverage, getCoverageDiff, and formatDiff functions are comprehensively tested
  // in their respective dedicated test files (simplecov.test.ts and utils.test.ts)

  // Note: Dry-run mode tests would require mocking the run function properly
  // For now, this functionality is tested through the integration tests in CI
})
