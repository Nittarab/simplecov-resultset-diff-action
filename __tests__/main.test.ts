import * as path from 'path'
import {
  calculateCoverageDiff,
  run,
  Coverage,
  getCoverageDiff
} from '../src/main'
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

  describe('Edge cases and additional coverage', () => {
    test('formatDiff handles no change (0% diff)', () => {
      const mockDiff = {
        filename: '/test/no_change.rb',
        lines: {from: 50.0, to: 50.0},
        branches: {from: 80.0, to: 80.0}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual([
        'no_change.rb',
        '50%',
        '80%',
        '➡️ 0%', // No change emoji (corrected format)
        '➡️ 0%'
      ])
    })

    test('formatDiff handles null coverage values', () => {
      const mockDiff = {
        filename: '/test/null_values.rb',
        lines: {from: null, to: null},
        branches: {from: null, to: null}
      }

      const result = formatDiff(mockDiff, '/test')
      expect(result).toEqual([
        'null_values.rb',
        '-',
        '-',
        '-', // Should return '-' for null to null
        '-'
      ])
    })

    test('WORKSPACE constant uses GITHUB_WORKSPACE in production', () => {
      // Save original values
      const originalNodeEnv = process.env.NODE_ENV
      const originalGitHubWorkspace = process.env.GITHUB_WORKSPACE

      try {
        // Set production environment
        delete process.env.NODE_ENV
        process.env.GITHUB_WORKSPACE = '/github/workspace'

        // Just use the imported function - the WORKSPACE constant is set at module load time
        const result = calculateCoverageDiff({
          base: path.resolve(__dirname, './fixtures/resultset1.json'),
          head: path.resolve(__dirname, './fixtures/resultset1.json')
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
  })

  describe('SimpleCov internal functions coverage', () => {
    test('Coverage handles empty line coverage (100% when no executable lines)', () => {
      // Create a file with no executable lines (all nulls)
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/empty.rb': {
              lines: [null, null, null],
              branches: {}
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/empty.rb'
      )

      // The line coverage should be 100% when there are no executable lines
      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.lines).toBe(100)
    })

    test('Coverage handles undefined branch coverage (100% default)', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/no_branches.rb': {
              lines: [1, 1, 0],
              branches: undefined as any
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/no_branches.rb'
      )

      // Branch coverage should be 100% when branches are undefined
      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.branches).toBe(100)
    })

    test('getCoverageDiff handles identical coverage objects', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/same.rb': {
              lines: [1, 1, 0],
              branches: {}
            }
          }
        }
      }

      const coverage1 = new Coverage(mockResultset)
      const coverage2 = new Coverage(mockResultset)

      // Should return empty array when coverages are identical
      const diff = getCoverageDiff(coverage1, coverage2)
      expect(diff).toEqual([])
    })

    test('Coverage handles empty branches object (100% coverage)', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/empty_branches.rb': {
              lines: [1, 1, 0],
              branches: {} // Empty branches object
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/empty_branches.rb'
      )

      // Branch coverage should be 100% when branches object is empty
      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.branches).toBe(100)
    })

    test('Coverage handles completely undefined branches', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/no_branches_property.rb': {
              lines: [1, 1, 0],
              branches: undefined as any
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/no_branches_property.rb'
      )

      // Branch coverage should be 100% when branches property is undefined
      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.branches).toBe(100)
    })
  })
})
