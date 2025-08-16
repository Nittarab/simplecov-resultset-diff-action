import {
  Coverage,
  getCoverageDiff,
  FileCoverage,
  getTotalCoverageDiff
} from '../src/simplecov'

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
        (f: FileCoverage) => f.filename === '/test/empty.rb'
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
              branches: undefined
            } as any
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const fileCoverage = coverage.files.find(
        (f: FileCoverage) => f.filename === '/test/no_branches.rb'
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
        (f: FileCoverage) => f.filename === '/test/empty_branches.rb'
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
        (f: FileCoverage) => f.filename === '/test/mixed.rb'
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
        (f: FileCoverage) => f.filename === '/test/branches.rb'
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

  describe('Total coverage functionality', () => {
    test('getTotalLinesCoverage calculates correct totals', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 1, 0, null, 1], // 3/4 = 75%
              branches: {}
            },
            '/test/file2.rb': {
              lines: [1, 0, 1], // 2/3 = 66.67%
              branches: {}
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const totalLines = coverage.getTotalLinesCoverage()

      expect(totalLines.covered).toBe(5) // 3 + 2
      expect(totalLines.total).toBe(7) // 4 + 3
      expect(totalLines.percentage).toBe(71.42) // 5/7 = 71.42% (floored to 2 decimal places)
    })

    test('getTotalBranchesCoverage calculates correct totals', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1],
              branches: {
                condition1: {
                  branch1: 1,
                  branch2: 0
                }
              }
            },
            '/test/file2.rb': {
              lines: [1],
              branches: {
                condition2: {
                  branch3: 1,
                  branch4: 1,
                  branch5: 0
                }
              }
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const totalBranches = coverage.getTotalBranchesCoverage()

      expect(totalBranches.covered).toBe(3) // 1 + 2
      expect(totalBranches.total).toBe(5) // 2 + 3
      expect(totalBranches.percentage).toBe(60) // 3/5 = 60%
    })

    test('getTotalCoverage returns both lines and branches', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 1, 0], // 2/3 = 66.67%
              branches: {
                condition1: {
                  branch1: 1,
                  branch2: 0
                }
              }
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const total = coverage.getTotalCoverage()

      expect(total.lines.covered).toBe(2)
      expect(total.lines.total).toBe(3)
      expect(total.lines.percentage).toBe(66.66) // floored to 2 decimal places

      expect(total.branches.covered).toBe(1)
      expect(total.branches.total).toBe(2)
      expect(total.branches.percentage).toBe(50)
    })

    test('getTotalCoverageDiff calculates differences correctly', () => {
      const baseResultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 0, 1], // 2/3 = 66.67%
              branches: {
                condition1: {
                  branch1: 1,
                  branch2: 0
                }
              }
            }
          }
        }
      }

      const headResultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 1, 1], // 3/3 = 100%
              branches: {
                condition1: {
                  branch1: 1,
                  branch2: 1
                }
              }
            }
          }
        }
      }

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      const diff = getTotalCoverageDiff(baseCoverage, headCoverage)

      expect(diff.lines.base.covered).toBe(2)
      expect(diff.lines.base.total).toBe(3)
      expect(diff.lines.base.percentage).toBe(66.66) // floored to 2 decimal places

      expect(diff.lines.head.covered).toBe(3)
      expect(diff.lines.head.total).toBe(3)
      expect(diff.lines.head.percentage).toBe(100)

      expect(diff.lines.diff).toBe(33.34) // 100 - 66.66 = 33.34

      expect(diff.branches.base.covered).toBe(1)
      expect(diff.branches.base.total).toBe(2)
      expect(diff.branches.base.percentage).toBe(50)

      expect(diff.branches.head.covered).toBe(2)
      expect(diff.branches.head.total).toBe(2)
      expect(diff.branches.head.percentage).toBe(100)

      expect(diff.branches.diff).toBe(50) // 100 - 50
    })

    test('getTotalCoverageDiff handles no changes', () => {
      const resultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 1, 0],
              branches: {
                condition1: {
                  branch1: 1,
                  branch2: 0
                }
              }
            }
          }
        }
      }

      const baseCoverage = new Coverage(resultset)
      const headCoverage = new Coverage(resultset)

      const diff = getTotalCoverageDiff(baseCoverage, headCoverage)

      expect(diff.lines.diff).toBe(0)
      expect(diff.branches.diff).toBe(0)
    })

    test('getTotalCoverageDiff handles new files in head', () => {
      const baseResultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 0], // 1/2 = 50%
              branches: {}
            }
          }
        }
      }

      const headResultset = {
        'test-command': {
          coverage: {
            '/test/file1.rb': {
              lines: [1, 0], // 1/2 = 50%
              branches: {}
            },
            '/test/file2.rb': {
              lines: [1, 1], // 2/2 = 100%
              branches: {}
            }
          }
        }
      }

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      const diff = getTotalCoverageDiff(baseCoverage, headCoverage)

      expect(diff.lines.base.covered).toBe(1)
      expect(diff.lines.base.total).toBe(2)
      expect(diff.lines.base.percentage).toBe(50)

      expect(diff.lines.head.covered).toBe(3) // 1 + 2
      expect(diff.lines.head.total).toBe(4) // 2 + 2
      expect(diff.lines.head.percentage).toBe(75) // 3/4

      expect(diff.lines.diff).toBe(25) // 75 - 50
    })
  })
})
