import {Coverage} from '../src/simplecov'
import {createMockResultset} from './test-helpers'

describe('Coverage Engine - Property-Based Tests', () => {
  describe('line coverage calculations', () => {
    test.each([
      { lines: [1, 1, 1, 1], expected: 100 },
      { lines: [0, 0, 0, 0], expected: 0 },
      { lines: [1, 0, 1, 0], expected: 50 },
      { lines: [null, null, null], expected: 100 }, // No executable lines
      { lines: [1, null, 0, null, 1], expected: 66.66 }, // 2 of 3 executable covered
      { lines: [5, 10, 0, 2], expected: 75 }, // Hit counts don't matter, just >0
    ])('should calculate $expected% for lines $lines', ({ lines, expected }) => {
      const resultset = createMockResultset({
        '/test/file.rb': { lines }
      })
      
      const coverage = new Coverage(resultset)
      const fileCoverage = coverage.files[0]
      
      expect(fileCoverage.lines).toBeCloseTo(expected, 2)
    })
  })

  describe('branch coverage calculations', () => {
    test.each([
      {
        branches: {} as Record<string, Record<string, number>>,
        expected: 100,
        description: 'empty branches object'
      },
      {
        branches: {
          'cond1': { 'branch1': 1, 'branch2': 1 }
        } as Record<string, Record<string, number>>,
        expected: 100,
        description: 'all branches covered'
      },
      {
        branches: {
          'cond1': { 'branch1': 1, 'branch2': 0 }
        } as Record<string, Record<string, number>>,
        expected: 50,
        description: 'half branches covered'
      },
      {
        branches: {
          'cond1': { 'branch1': 0, 'branch2': 0 },
          'cond2': { 'branch3': 1, 'branch4': 1 }
        } as Record<string, Record<string, number>>,
        expected: 50,
        description: 'mixed conditions'
      },
    ])('should calculate $expected% for $description', ({ branches, expected }) => {
      const resultset = createMockResultset({
        '/test/file.rb': { 
          lines: [1, 1, 1],
          branches 
        }
      })
      
      const coverage = new Coverage(resultset)
      const fileCoverage = coverage.files[0]
      
      expect(fileCoverage.branches).toBeCloseTo(expected, 2)
    })
  })

  describe('multiple test commands in resultset', () => {
    test('should aggregate coverage from multiple test suites', () => {
      const resultset = {
        'RSpec': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 0, 1],
              branches: {}
            }
          }
        },
        'Minitest': {
          coverage: {
            '/test/file2.rb': {
              lines: [1, 1, 0],
              branches: {}
            }
          }
        }
      }
      
      const coverage = new Coverage(resultset)
      
      expect(coverage.files).toHaveLength(2)
      expect(coverage.files.map(f => f.filename)).toEqual([
        '/test/file1.rb',
        '/test/file2.rb'
      ])
    })
  })

  describe('precision and rounding', () => {
    test('should handle floating point precision correctly', () => {
      // This creates a scenario that would result in 66.666...%
      const resultset = createMockResultset({
        '/test/precision.rb': { 
          lines: [1, 0, 1] // 2 out of 3 = 66.666...%
        }
      })
      
      const coverage = new Coverage(resultset)
      const fileCoverage = coverage.files[0]
      
      // Should be floored to 66.66%
      expect(fileCoverage.lines).toBe(66.66)
    })
  })
})
