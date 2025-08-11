/**
 * Tests for GitHub Action configuration
 */

import {readFileSync} from 'fs'
import {join} from 'path'
import yaml from 'js-yaml'

describe('GitHub Action Configuration', () => {
  it('should specify Node.js 22 runtime', () => {
    const actionPath = join(__dirname, '..', 'action.yml')
    const actionContent = readFileSync(actionPath, 'utf8')
    const actionConfig = yaml.load(actionContent) as any

    expect(actionConfig.runs.using).toBe('node22')
    expect(actionConfig.runs.main).toBe('dist/index.js')
  })

  it('should have all required inputs defined', () => {
    const actionPath = join(__dirname, '..', 'action.yml')
    const actionContent = readFileSync(actionPath, 'utf8')
    const actionConfig = yaml.load(actionContent) as any

    expect(actionConfig.inputs).toBeDefined()
    expect(actionConfig.inputs['base-resultset-path']).toBeDefined()
    expect(actionConfig.inputs['head-resultset-path']).toBeDefined()
    expect(actionConfig.inputs['token']).toBeDefined()

    // Verify required inputs
    expect(actionConfig.inputs['base-resultset-path'].required).toBe(true)
    expect(actionConfig.inputs['head-resultset-path'].required).toBe(true)
    expect(actionConfig.inputs['token'].required).toBe(false)
  })

  it('should specify Node.js 22 in CI workflow', () => {
    const ciPath = join(__dirname, '..', '.github', 'workflows', 'ci.yml')
    const ciContent = readFileSync(ciPath, 'utf8')
    const ciConfig = yaml.load(ciContent) as any

    expect(ciConfig.env.NODE_VERSION).toBe('22')
  })
})
