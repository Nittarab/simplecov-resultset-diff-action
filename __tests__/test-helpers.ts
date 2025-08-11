import * as core from '@actions/core'
import * as github from '@actions/github'
import {jest} from '@jest/globals'

/**
 * Helper to create mock GitHub Actions inputs
 */
export function createMockInputs(inputs: Record<string, string>): void {
  const mockGetInput = jest.mocked(core.getInput)
  mockGetInput.mockImplementation((input: string) => inputs[input] || '')
}

/**
 * Helper to create mock GitHub context
 */
export function createMockGitHubContext(context: {
  issue?: {number?: number | null}
  repo?: {owner?: string; repo?: string}
}): void {
  const mockGitHub = jest.mocked(github)
  Object.defineProperty(mockGitHub, 'context', {
    value: {
      issue: {number: null, ...context.issue},
      repo: {owner: 'test-owner', repo: 'test-repo', ...context.repo}
    },
    writable: true
  })
}

/**
 * Helper to create mock Octokit instance
 */
export function createMockOctokit(): {
  mockCreateComment: jest.MockedFunction<any>
  mockGetOctokit: jest.MockedFunction<any>
} {
  const mockCreateComment = jest.fn()
  const mockGitHub = jest.mocked(github)

  const mockGetOctokit = mockGitHub.getOctokit.mockReturnValue({
    rest: {
      issues: {
        createComment: mockCreateComment
      }
    }
  } as any)

  return {mockCreateComment, mockGetOctokit}
}

/**
 * Helper to create mock SimpleCov resultset
 */
export function createMockResultset(
  files: Record<
    string,
    {
      lines: (number | null)[]
      branches?: Record<string, Record<string, number>>
    }
  >
): any {
  return {
    'test-command': {
      coverage: Object.fromEntries(
        Object.entries(files).map(([filename, data]) => [
          filename,
          {
            lines: data.lines,
            branches: data.branches || {}
          }
        ])
      )
    }
  }
}

/**
 * Clean up environment variables after tests
 */
export function cleanupEnvironment(): void {
  delete process.env.DRY_RUN
  delete process.env.NODE_ENV
}

/**
 * Set up common test environment
 */
export function setupTestEnvironment(): void {
  jest.clearAllMocks()
  cleanupEnvironment()

  // Set test environment
  process.env.NODE_ENV = 'test'
}
