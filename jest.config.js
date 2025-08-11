module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts' // Entry point is just import/run, not much to test
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  // GitHub Actions specific timeouts
  testTimeout: 30000,
  // Better error reporting
  verbose: true,
  // Test matching patterns
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts']
}
