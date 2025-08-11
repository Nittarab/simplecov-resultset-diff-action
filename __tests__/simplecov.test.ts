import {Coverage, getCoverageDiff} from '../src/simplecov'

describe('SimpleCov Coverage Engine', () => {
  describe('Coverage class', () => {
    test('handles empty line coverage (100% when no executable lines)', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/empty.rb': {
              lines: [null, null, null],
              branches: {}
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/empty.rb'
      )

      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.lines).toBe(100)
    })

    test('handles undefined branch coverage (100% default)', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/no_branches.rb': {
              lines: [1, 1, 0],
              branches: undefined as any
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/no_branches.rb'
      )

      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.branches).toBe(100)
    })

    test('handles empty branches object (100% coverage)', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/empty_branches.rb': {
              lines: [1, 1, 0],
              branches: {}
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/empty_branches.rb'
      )

      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.branches).toBe(100)
    })

    test('calculates correct line coverage percentages', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/mixed.rb': {
              lines: [1, null, 0, 1, null, 0], // 2 covered out of 4 executable = 50%
              branches: {}
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/mixed.rb'
      )

      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.lines).toBe(50)
    })

    test('calculates correct branch coverage percentages', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/branches.rb': {
              lines: [1, 1, 1],
              branches: {
                condition1: {
                  branch1: 1, // covered
                  branch2: 0 // not covered
                },
                condition2: {
                  branch3: 1, // covered
                  branch4: 1 // covered
                }
              }
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: any) => f.filename === '/test/branches.rb'
      )

      expect(fileCoverage).toBeDefined()
      expect(fileCoverage!.branches).toBe(75) // 3 out of 4 branches covered
    })
  })

  describe('getCoverageDiff function', () => {
    test('handles identical coverage objects', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/same.rb': {
              lines: [1, 1, 0],
              branches: {}
            }
          }
        }
      }

      const coverage1 = new Coverage(mockResultset)
      const coverage2 = new Coverage(mockResultset)

      const diff = getCoverageDiff(coverage1, coverage2)
      expect(diff).toEqual([])
    })

    test('detects file additions', () => {
      const baseResultset = {
        'test-command': {
          coverage: {
            '/test/existing.rb': {
              lines: [1, 1, 0],
              branches: {}
            }
          }
        }
      }

      const headResultset = {
        'test-command': {
          coverage: {
            '/test/existing.rb': {
              lines: [1, 1, 0],
              branches: {}
            },
            '/test/new.rb': {
              lines: [1, 1, 1],
              branches: {}
            }
          }
        }
      }

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      const diff = getCoverageDiff(baseCoverage, headCoverage)
      expect(diff).toHaveLength(1)
      expect(diff[0].filename).toBe('/test/new.rb')
      expect(diff[0].lines.from).toBeNull()
      expect(diff[0].lines.to).toBe(100)
    })

    test('detects file deletions', () => {
      const baseResultset = {
        'test-command': {
          coverage: {
            '/test/existing.rb': {
              lines: [1, 1, 0],
              branches: {}
            },
            '/test/deleted.rb': {
              lines: [1, 1, 1],
              branches: {}
            }
          }
        }
      }

      const headResultset = {
        'test-command': {
          coverage: {
            '/test/existing.rb': {
              lines: [1, 1, 0],
              branches: {}
            }
          }
        }
      }

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      const diff = getCoverageDiff(baseCoverage, headCoverage)
      expect(diff).toHaveLength(1)
      expect(diff[0].filename).toBe('/test/deleted.rb')
      expect(diff[0].lines.from).toBe(100)
      expect(diff[0].lines.to).toBeNull()
    })
  })
})
