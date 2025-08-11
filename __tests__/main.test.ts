import * as path from 'path'
import {calculateCoverageDiff, run} from '../src/main'
import {formatDiff} from '../src/utils'
import {jest} from '@jest/globals'
import * as core from '@actions/core'
import * as github from '@actions/github'

// Mock the GitHub Actions modules
jest.mock('@actions/github')
jest.mock('@actions/core')

const mockGetInput = jest.mocked(core.getInput)
const mockInfo = jest.mocked(core.info)
const mockWarning = jest.mocked(core.warning)
const mockSetFailed = jest.mocked(core.setFailed)

describe('SimpleCov Resultset Diff Action', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.DRY_RUN

    // Set up default mock behavior
    mockGetInput.mockImplementation((input: string) => {
      switch (input) {
        case 'base-resultset-path':
          return path.resolve(__dirname, './fixtures/resultset1.json')
        case 'head-resultset-path':
          return path.resolve(__dirname, './fixtures/resultset2.json')
        case 'token':
          return 'test-token'
        default:
          return ''
      }
    })
  })

  describe('calculateCoverageDiff', () => {
    test('returns expected output when there are differences', () => {
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

    test('returns expected output when there are no differences', () => {
      const result = calculateCoverageDiff(pathsIdentical)
      expect(result).toBe('## Coverage difference\nNo differences\n')
    })

    test('throws error when paths do not exist', () => {
      expect(() => calculateCoverageDiff(pathsNonExistent)).toThrow()
    })

    test('throws error when paths are not coverage files', () => {
      expect(() => calculateCoverageDiff(pathsNotCoverage)).toThrow()
    })
  })

  describe('formatDiff', () => {
    test('returns 5-column format with emojis', () => {
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
  })

  describe('run function', () => {
    describe('dry-run mode', () => {
      test('should run in dry-run mode when DRY_RUN=true', async () => {
        process.env.DRY_RUN = 'true'

        await run()

        expect(mockInfo).toHaveBeenCalledWith(
          'Running in dry-run mode (DRY_RUN environment variable set)'
        )
        expect(mockInfo).toHaveBeenCalledWith('Coverage diff result:')
        expect(mockInfo).toHaveBeenCalledWith(
          expect.stringContaining('Coverage difference')
        )
      })

      test('should run in dry-run mode when DRY_RUN=1', async () => {
        process.env.DRY_RUN = '1'

        await run()

        expect(mockInfo).toHaveBeenCalledWith(
          'Running in dry-run mode (DRY_RUN environment variable set)'
        )
        expect(mockInfo).toHaveBeenCalledWith('Coverage diff result:')
        expect(mockInfo).toHaveBeenCalledWith(
          expect.stringContaining('Coverage difference')
        )
      })
    })

    describe('normal mode', () => {
      test('should post comment when PR number is available', async () => {
        const mockCreateComment = jest.fn()
        const mockGitHub = jest.mocked(github)

        mockGitHub.getOctokit.mockReturnValue({
          rest: {
            issues: {
              createComment: mockCreateComment
            }
          }
        } as any)

        // Mock the context property
        Object.defineProperty(mockGitHub, 'context', {
          value: {
            issue: {number: 123},
            repo: {owner: 'test-owner', repo: 'test-repo'}
          },
          writable: true
        })

        await run()

        expect(mockCreateComment).toHaveBeenCalledWith({
          owner: 'test-owner',
          repo: 'test-repo',
          issue_number: 123,
          body: expect.stringContaining('Coverage difference')
        })
      })

      test('should warn and log to info when no PR number is available', async () => {
        const mockGitHub = jest.mocked(github)

        // Mock the context property
        Object.defineProperty(mockGitHub, 'context', {
          value: {
            issue: {number: null},
            repo: {owner: 'test-owner', repo: 'test-repo'}
          },
          writable: true
        })

        await run()

        expect(mockWarning).toHaveBeenCalledWith('Cannot find the PR id.')
        expect(mockInfo).toHaveBeenCalledWith(
          expect.stringContaining('Coverage difference')
        )
      })
    })

    describe('error handling', () => {
      test('should call setFailed when an error occurs', async () => {
        mockGetInput.mockImplementation((input: string) => {
          if (input === 'base-resultset-path') {
            return '/nonexistent/path.json'
          }
          return 'test-value'
        })

        await run()

        expect(mockSetFailed).toHaveBeenCalled()
      })
    })
  })
})
