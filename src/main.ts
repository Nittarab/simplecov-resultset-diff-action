import * as path from 'path'
import * as github from '@actions/github'
import * as core from '@actions/core'
import {getMarkdownTable} from 'markdown-table-ts'
import {Coverage, getCoverageDiff} from './simplecov'
import {doesPathExists, formatDiff, parseResultset} from './utils'

const WORKSPACE: string = process.env.GITHUB_WORKSPACE!

export function calculateCoverageDiff(paths: {
  base: string
  head: string
}): string {
  doesPathExists(paths.base)
  doesPathExists(paths.head)

  const resultsets = {
    base: parseResultset(paths.base, WORKSPACE),
    head: parseResultset(paths.head, WORKSPACE)
  }

  const coverages = {
    base: new Coverage(resultsets.base),
    head: new Coverage(resultsets.head)
  }

  const diff = getCoverageDiff(coverages.base, coverages.head)

  let content: string
  if (diff.length === 0) {
    content = 'No differences'
  } else {
    content = getMarkdownTable({
      table: {
        head: ['Filename', 'Lines', 'Branches'],
        body: diff.map(d => formatDiff(d, WORKSPACE))
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

    /**
     * Publish a comment in the PR with the diff result.
     */
    const octokit = github.getOctokit(core.getInput('token'))

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
    // @ts-ignore
    core.setFailed(error.message)
  }
}

export {Coverage, getCoverageDiff}
