import * as path from 'path'
import * as github from '@actions/github'
import * as core from '@actions/core'
import {Coverage, getCoverageDiff, calculateCoverageDiff} from '../src/main'
import * as utils from '../src/utils'
import {beforeEach} from 'jest-circus'
import {beforeAll, jest} from '@jest/globals'
import * as fs from 'fs'

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
})
