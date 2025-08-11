import * as path from 'path'
import {run} from '../src/main'
import {jest} from '@jest/globals'
import * as core from '@actions/core'

// Mock the GitHub Actions modules
jest.mock('@actions/github')
jest.mock('@actions/core')

const mockGetInput = jest.mocked(core.getInput)
const mockInfo = jest.mocked(core.info)

describe('Dry-run mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

    delete process.env.DRY_RUN
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

    delete process.env.DRY_RUN
  })

  test('should not run in dry-run mode when DRY_RUN is not set', async () => {
    delete process.env.DRY_RUN

    // Mock GitHub context to avoid creating actual PR comment
    const mockGitHub = require('@actions/github')
    mockGitHub.context = {
      issue: {number: null}, // No PR number to simulate warning case
      repo: {owner: 'test', repo: 'test'}
    }

    await run()

    expect(mockInfo).not.toHaveBeenCalledWith(
      'Running in dry-run mode (DRY_RUN environment variable set)'
    )
  })
})
