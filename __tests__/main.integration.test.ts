import * as path from 'path'
import {calculateCoverageDiff, run} from '../src/main'
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
})
