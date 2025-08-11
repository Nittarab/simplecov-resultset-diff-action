import {calculateCoverageDiff} from '../src/main'
import {Coverage, getCoverageDiff} from '../src/simplecov'
import {createMockResultset} from './test-helpers'
import * as fs from 'fs'
import * as path from 'path'

describe('Performance and Stress Tests', () => {
  const performanceTimeout = 5000 // 5 seconds max

  describe('large resultset handling', () => {
    test('should handle large number of files efficiently', async () => {
      const startTime = Date.now()
      
      // Create a large mock resultset with many files
      const largeResultset = createMockResultset(
        Object.fromEntries(
          Array.from({length: 1000}, (_, i) => [
            `/large/project/file${i}.rb`,
            {
              lines: Array.from({length: 100}, (_, j) => j % 3 === 0 ? 1 : 0),
              branches: i % 10 === 0 ? {
                [`cond${i}`]: {
                  'branch1': 1,
                  'branch2': 0
                }
              } : {}
            }
          ])
        )
      )

      const coverage = new Coverage(largeResultset)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(coverage.files).toHaveLength(1000)
      expect(duration).toBeLessThan(performanceTimeout)
    }, performanceTimeout)

    test('should handle large diff calculations efficiently', async () => {
      const startTime = Date.now()
      
      // Create two large resultsets with slight differences
      const createLargeSet = (variant: number) => createMockResultset(
        Object.fromEntries(
          Array.from({length: 500}, (_, i) => [
            `/project/file${i}.rb`,
            {
              lines: Array.from({length: 50}, (_, j) => 
                (j + variant) % 4 === 0 ? 1 : 0
              ),
              branches: {}
            }
          ])
        )
      )

      const coverage1 = new Coverage(createLargeSet(0))
      const coverage2 = new Coverage(createLargeSet(1))
      
      const diff = getCoverageDiff(coverage1, coverage2)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(diff.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(performanceTimeout)
    }, performanceTimeout)
  })

  describe('real-world fixture stress tests', () => {
    test('should handle multiple runs of actual fixtures without memory issues', () => {
      const basePath = path.resolve(__dirname, './fixtures/resultset1.json')
      const headPath = path.resolve(__dirname, './fixtures/resultset2.json')
      
      // Run the diff calculation many times to check for memory leaks
      for (let i = 0; i < 100; i++) {
        const result = calculateCoverageDiff({
          base: basePath,
          head: headPath
        })
        
        expect(result).toContain('Coverage difference')
      }
      
      // If we get here without running out of memory, the test passes
      expect(true).toBe(true)
    })

    test('should handle files with very long names and deep paths', () => {
      const longPath = '/very/deep/nested/directory/structure/with/many/levels/and/a/really/really/really/long/filename/that/might/cause/issues/in/some/systems/test_file.rb'
      
      const resultset = createMockResultset({
        [longPath]: {
          lines: [1, 0, 1, 0, 1],
          branches: {}
        }
      })
      
      const coverage = new Coverage(resultset)
      const fileCoverage = coverage.files[0]
      
      expect(fileCoverage.filename).toBe(longPath)
      expect(fileCoverage.lines).toBe(60) // 3 out of 5 lines covered
    })
  })

  describe('edge case resilience', () => {
    test('should handle resultsets with unusual characters in filenames', () => {
      const weirdFilenames = [
        '/test/file with spaces.rb',
        '/test/file-with-dashes.rb',
        '/test/file_with_underscores.rb',
        '/test/file.with.dots.rb',
        '/test/UPPERCASE.rb',
        '/test/файл.rb', // Cyrillic
        '/test/文件.rb', // Chinese
        '/test/ファイル.rb' // Japanese
      ]
      
      const resultset = createMockResultset(
        Object.fromEntries(
          weirdFilenames.map(filename => [
            filename,
            {
              lines: [1, 0, 1],
              branches: {}
            }
          ])
        )
      )
      
      const coverage = new Coverage(resultset)
      
      expect(coverage.files).toHaveLength(weirdFilenames.length)
      coverage.files.forEach((file, index) => {
        expect(file.filename).toBe(weirdFilenames[index])
        expect(file.lines).toBe(66.66)
      })
    })

    test('should handle extreme coverage values gracefully', () => {
      const extremeCases = [
        { lines: Array(10000).fill(1), expectedCoverage: 100 }, // Very long file, all covered
        { lines: Array(10000).fill(0), expectedCoverage: 0 }, // Very long file, none covered
        { lines: Array(10000).fill(null), expectedCoverage: 100 }, // Very long file, no executable lines
      ]
      
      extremeCases.forEach(({ lines, expectedCoverage }, index) => {
        const resultset = createMockResultset({
          [`/test/extreme${index}.rb`]: { lines, branches: {} }
        })
        
        const coverage = new Coverage(resultset)
        const fileCoverage = coverage.files[0]
        
        expect(fileCoverage.lines).toBe(expectedCoverage)
      })
    })
  })
})
