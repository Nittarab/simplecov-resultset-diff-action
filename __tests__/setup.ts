// Jest setup file for GitHub Actions testing
import {jest} from '@jest/globals'

// Global setup for all tests
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()

  // Reset environment variables
  delete process.env.DRY_RUN
  delete process.env.GITHUB_WORKSPACE
  process.env.NODE_ENV = 'test'
})

// Suppress console.log in tests unless explicitly needed
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
})

// Add custom matchers for better assertions
expect.extend({
  toBeValidCoverageDiff(received: string) {
    const pass =
      received.includes('Coverage difference') &&
      (received.includes('No differences') || received.includes('Filename'))

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid coverage diff`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid coverage diff`,
        pass: false
      }
    }
  }
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCoverageDiff(): R
    }
  }
}
