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

    test('aggregated total coverage with all files having zero executable lines returns 100%', () => {
      const mockResultset = {
        'test-command': {
          coverage: {
            '/test/empty1.rb': {lines: [null, null], branches: {}},
            '/test/empty2.rb': {lines: [null], branches: {}}
          }
        }
      }

      const coverage = new Coverage(mockResultset)
      const totals = coverage.getTotalLinesCoverage()
      expect(totals.covered).toBe(0)
      expect(totals.total).toBe(0)
      expect(totals.percentage).toBe(100)
    })
  })

  describe('Branch pattern coverage scenarios', () => {
    test('handles all Ruby branch types (if, case, unless, &., ternary)', () => {
      const mockResultset = {
        RSpec: {
          coverage: {
            '/project/conditional_logic.rb': {
              lines: [
                null,
                null,
                1,
                null,
                1,
                10,
                null,
                5,
                null,
                5,
                null,
                null,
                null
              ],
              branches: {
                '[:if, 0, 6, 4, 10, 7]': {
                  '[:then, 1, 7, 6, 7, 18]': 5,
                  '[:else, 2, 9, 6, 9, 18]': 5
                }
              }
            },
            '/project/case_statement.rb': {
              lines: [
                null,
                null,
                1,
                null,
                1,
                15,
                null,
                3,
                null,
                5,
                null,
                4,
                null,
                3,
                null,
                null,
                null
              ],
              branches: {
                '[:case, 0, 6, 4, 15, 7]': {
                  '[:when, 1, 7, 6, 7, 16]': 3,
                  '[:when, 2, 9, 6, 9, 16]': 5,
                  '[:when, 3, 11, 6, 11, 19]': 4,
                  '[:else, 4, 13, 6, 13, 16]': 3
                }
              }
            },
            '/project/unless_guard.rb': {
              lines: [null, null, 1, null, 1, 8, null, 0, null, null],
              branches: {
                '[:unless, 0, 6, 4, 6, 35]': {
                  '[:else, 1, 6, 4, 6, 35]': 8,
                  '[:then, 2, 6, 4, 6, 16]': 0
                }
              }
            },
            '/project/safe_navigation.rb': {
              lines: [null, null, 1, null, 1, 12, null, null],
              branches: {
                '[:\"&.\", 0, 6, 4, 6, 25]': {
                  '[:then, 1, 6, 4, 6, 25]': 9,
                  '[:else, 2, 6, 4, 6, 25]': 3
                }
              }
            },
            '/project/ternary.rb': {
              lines: [null, null, 1, null, 1, 20, null, null],
              branches: {
                '[:if, 0, 6, 4, 6, 30]': {
                  '[:then, 1, 6, 11, 6, 15]': 12,
                  '[:else, 2, 6, 24, 6, 30]': 8
                }
              }
            }
          }
        }
      }

      const coverage = new Coverage(mockResultset)

      // Verify all branch patterns are detected and calculated correctly
      const conditional = coverage.files.find(
        f => f.filename === '/project/conditional_logic.rb'
      )
      expect(conditional?.branches).toBe(100) // 2/2 branches covered

      const caseStmt = coverage.files.find(
        f => f.filename === '/project/case_statement.rb'
      )
      expect(caseStmt?.branches).toBe(100) // 4/4 branches covered

      const unlessGuard = coverage.files.find(
        f => f.filename === '/project/unless_guard.rb'
      )
      expect(unlessGuard?.branches).toBe(50) // 1/2 branches covered

      const safeNav = coverage.files.find(
        f => f.filename === '/project/safe_navigation.rb'
      )
      expect(safeNav?.branches).toBe(100) // 2/2 branches covered

      const ternary = coverage.files.find(
        f => f.filename === '/project/ternary.rb'
      )
      expect(ternary?.branches).toBe(100) // 2/2 branches covered
    })

    test('branch hit count changes without percentage change (still 100%)', () => {
      const baseResultset = {
        RSpec: {
          coverage: {
            '/project/threshold.rb': {
              lines: [
                null,
                null,
                1,
                null,
                1,
                100,
                null,
                50,
                null,
                50,
                null,
                null
              ],
              branches: {
                '[:if, 0, 6, 4, 10, 7]': {
                  '[:then, 1, 7, 6, 7, 18]': 50,
                  '[:else, 2, 9, 6, 9, 18]': 50
                }
              }
            }
          }
        }
      }

      const headResultset = {
        RSpec: {
          coverage: {
            '/project/threshold.rb': {
              lines: [
                null,
                null,
                1,
                null,
                1,
                100,
                null,
                51,
                null,
                49,
                null,
                null
              ],
              branches: {
                '[:if, 0, 6, 4, 10, 7]': {
                  '[:then, 1, 7, 6, 7, 18]': 51,
                  '[:else, 2, 9, 6, 9, 18]': 49
                }
              }
            }
          }
        }
      }

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      // Both should be 100% branch coverage (all branches hit at least once)
      expect(baseCoverage.files[0].branches).toBe(100)
      expect(headCoverage.files[0].branches).toBe(100)

      const diff = getCoverageDiff(baseCoverage, headCoverage)
      expect(diff).toHaveLength(0) // No significant diff at file level
    })

    test('detects line coverage increase with branch coverage decrease', () => {
      const baseResultset = {
        RSpec: {
          coverage: {
            '/project/mixed.rb': {
              lines: [null, null, 1, null, 1, 10, null, 5, null, 0, null, null],
              branches: {
                '[:if, 0, 6, 4, 10, 7]': {
                  '[:then, 1, 7, 6, 7, 18]': 5,
                  '[:else, 2, 9, 6, 9, 18]': 0
                }
              }
            }
          }
        }
      }

      const headResultset = {
        RSpec: {
          coverage: {
            '/project/mixed.rb': {
              lines: [null, null, 1, null, 1, 10, null, 8, null, 2, null, null],
              branches: {
                '[:if, 0, 6, 4, 10, 7]': {
                  '[:then, 1, 7, 6, 7, 18]': 8,
                  '[:else, 2, 9, 6, 9, 18]': 0
                }
              }
            }
          }
        }
      }

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      const baseFile = baseCoverage.files[0]
      const headFile = headCoverage.files[0]

      // Line coverage improves: 80% -> 100%
      expect(baseFile.lines).toBe(80) // 4/5 lines (line 10 is 0)
      expect(headFile.lines).toBe(100) // 5/5 lines

      // Branch coverage stays at 50%
      expect(baseFile.branches).toBe(50)
      expect(headFile.branches).toBe(50)
    })

    test('detects branch-only percentage improvements when line coverage unchanged', () => {
      const baseResultset = {
        RSpec: {
          coverage: {
            '/project/branch_only.rb': {
              lines: [1, 1, 1, 1], // 100%
              branches: {
                cond1: {branch1: 1, branch2: 0} // 1/2 = 50%
              }
            }
          }
        }
      }

      const headResultset = {
        RSpec: {
          coverage: {
            '/project/branch_only.rb': {
              lines: [1, 1, 1, 1], // unchanged 100%
              branches: {
                cond1: {branch1: 1, branch2: 1} // 2/2 = 100%
              }
            }
          }
        }
      }

      const baseCoverage = new Coverage(baseResultset)
      const headCoverage = new Coverage(headResultset)

      const diff = getCoverageDiff(baseCoverage, headCoverage)
      expect(diff).toHaveLength(1)
      const fileDiff = diff[0]
      expect(fileDiff.lines.from).toBe(100)
      expect(fileDiff.lines.to).toBe(100)
      expect(fileDiff.branches.from).toBe(50)
      expect(fileDiff.branches.to).toBe(100)
    })
  })
})
