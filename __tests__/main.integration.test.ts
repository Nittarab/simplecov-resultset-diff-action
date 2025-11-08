import * as path from 'path'
import {run} from '../src/main'
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

describe('Integration Tests - Main Run Function', () => {
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

    test('should handle JSON parsing errors gracefully', async () => {
      mockGetInput.mockImplementation((input: string) => {
        switch (input) {
          case 'base-resultset-path':
            return path.resolve(__dirname, './fixtures/not_coverage.json')
          case 'head-resultset-path':
            return path.resolve(__dirname, './fixtures/resultset1.json')
          case 'token':
            return 'test-token'
          default:
            return ''
        }
      })

      await run()

      expect(mockSetFailed).toHaveBeenCalled()
    })
  })

  describe('large-scale real-world coverage diff', () => {
    test('should handle gold coverage fixtures with 97 files', async () => {
      process.env.DRY_RUN = 'true'

      mockGetInput.mockImplementation((input: string) => {
        switch (input) {
          case 'base-resultset-path':
            return path.resolve(
              __dirname,
              './fixtures/gold_coverage_base.json'
            )
          case 'head-resultset-path':
            return path.resolve(
              __dirname,
              './fixtures/gold_coverage_head.json'
            )
          case 'token':
            return 'test-token'
          default:
            return ''
        }
      })

      await run()

      expect(mockInfo).toHaveBeenCalledWith(
        'Running in dry-run mode (DRY_RUN environment variable set)'
      )
      expect(mockInfo).toHaveBeenCalledWith('Coverage diff result:')

      // Find the actual diff output
      const diffCall = mockInfo.mock.calls.find(call =>
        call[0].includes('Coverage difference')
      )
      expect(diffCall).toBeDefined()

      const diffOutput = diffCall?.[0] as string

      // Verify key changes are reflected
      expect(diffOutput).toContain('Coverage Summary')
      expect(diffOutput).toContain('File Coverage')

      // Should show new files
      expect(diffOutput).toContain('🆕')
      expect(diffOutput).toContain('user_deletion_service.rb')
      expect(diffOutput).toContain('cleanup_job.rb')

      // Should show deleted files
      expect(diffOutput).toContain('🗑️')
      expect(diffOutput).toContain('ai_models_helper.rb')
      expect(diffOutput).toContain('credits.rake')

      // Should show coverage changes (improved controllers and models)
      expect(diffOutput).toContain('users_controller.rb')
      expect(diffOutput).toContain('user.rb')
      expect(diffOutput).toContain('factual_accuracy_evaluator.rb')
      expect(diffOutput).toContain('ai.rb')
    })

    test('should calculate accurate totals for large fixtures', async () => {
      process.env.DRY_RUN = 'true'

      mockGetInput.mockImplementation((input: string) => {
        switch (input) {
          case 'base-resultset-path':
            return path.resolve(
              __dirname,
              './fixtures/gold_coverage_base.json'
            )
          case 'head-resultset-path':
            return path.resolve(
              __dirname,
              './fixtures/gold_coverage_head.json'
            )
          case 'token':
            return 'test-token'
          default:
            return ''
        }
      })

      await run()

      const diffCall = mockInfo.mock.calls.find(call =>
        call[0].includes('Coverage difference')
      )
      const diffOutput = diffCall?.[0] as string

      // Should have summary rows with metrics
      expect(diffOutput).toMatch(/\|\s*Metric\s*\|/)
      expect(diffOutput).toMatch(/\|\s*Lines\s*\|/)
      expect(diffOutput).toMatch(/\|\s*Branches\s*\|/)

      // Should show percentage format
      expect(diffOutput).toMatch(/\d+\.\d+%/)
    })
  })
})
