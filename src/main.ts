import path from 'path'
import * as github from '@actions/github'
import * as core from '@actions/core'
import {getMarkdownTable} from 'markdown-table-ts'
import {Coverage, getCoverageDiff, FileCoverageDiff} from './simplecov'
import {doesPathExists, formatDiff, parseResultset} from './utils'

const WORKSPACE =
  process.env.NODE_ENV === 'test' ? '/' : process.env.GITHUB_WORKSPACE!

export function calculateCoverageDiff(paths: {
  base: string
  head: string
}): string {
  doesPathExists(paths.base)
  doesPathExists(paths.head)

  const base_content = parseResultset(paths.base, WORKSPACE)
  const head_content = parseResultset(paths.head, WORKSPACE)

  const coverageBase = new Coverage(base_content)
  const coverageHead = new Coverage(head_content)

  const diff = getCoverageDiff(coverageBase, coverageHead)

  let content: string
  if (diff.length === 0) {
    content = 'No differences'
  } else {
    content = getMarkdownTable({
      table: {
        head: [
          'Filename',
          'Line Coverage',
          'Branch Coverage',
          'Line Diff',
          'Branch Diff'
        ],
        body: diff.map((d: FileCoverageDiff) => formatDiff(d, WORKSPACE))
      }
    })
  }

  return `## Coverage difference
${content}
`
}

/**
 * The run function is the main function of the action,
 * it will be executed when the action is triggered.
 *
 */
export async function run(): Promise<void> {
  try {
    const resultsetPaths = {
      base: core.getInput('base-resultset-path'),
      head: core.getInput('head-resultset-path')
    }

    const paths = {
      base: path.resolve(process.cwd(), resultsetPaths.base),
      head: path.resolve(process.cwd(), resultsetPaths.head)
    }

    const message = calculateCoverageDiff(paths)

    const token = core.getInput('token')

    // Check if we're in dry-run mode via environment variable
    const isDryRun =
      process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1'

    if (isDryRun) {
      core.info('Running in dry-run mode (DRY_RUN environment variable set)')
      core.info('Coverage diff result:')
      core.info(message)
      return
    }

    /**
     * Publish a comment in the PR with the diff result.
     */
    const octokit = github.getOctokit(token)

    const pullRequestId = github.context.issue.number
    if (!pullRequestId) {
      core.warning('Cannot find the PR id.')
      core.info(message)
      return
    }

    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pullRequestId,
      body: message
    })
  } catch (error) {
    // @ts-expect-error - error is unknown type from catch block
    core.setFailed(error.message)
  }
}

export {Coverage, getCoverageDiff}
