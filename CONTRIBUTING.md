# Contributing to SimpleCov Resultset Diff Action

Thank you for your interest in contributing to SimpleCov Resultset Diff Action! We welcome contributions from the community.

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm 10.x or higher

### Development Setup

1. Fork and clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/simplecov-resultset-diff-action.git
cd simplecov-resultset-diff-action
```

2. Install dependencies:

```bash
npm install
```

3. Make sure everything is working:

```bash
npm test
```

## Development Workflow

### Running Tests

Run the test suite:

```bash
npm test
```

Run tests with coverage report:

```bash
npm run coverage
```

### Code Quality

We maintain high code quality standards. Before submitting a pull request:

1. **Format your code:**

```bash
npm run format:write
```

2. **Check formatting:**

```bash
npm run format:check
```

3. **Run the linter:**

```bash
npm run lint
```

4. **Run the full build pipeline:**

```bash
npm run all
```

This command will format, lint, test, generate coverage, and package the action.

### Building the Action

After making changes to the source code in `src/`, you need to rebuild the distribution:

```bash
npm run package
```

For development with auto-rebuilding:

```bash
npm run package:watch
```

**Important:** Always commit the updated `dist/` directory along with your source changes. The CI pipeline will verify that `dist/` is up to date.

## Submitting Changes

### Pull Request Process

1. Create a new branch for your feature or bugfix:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following our coding standards

3. Write or update tests for your changes

4. Ensure all tests pass and code is formatted:

```bash
npm run all
```

5. Commit your changes with a clear commit message:

```bash
git commit -m "Add feature: description of your changes"
```

6. Push to your fork and submit a pull request

7. Wait for review and address any feedback

### Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 72 characters
- Reference issues and pull requests when relevant

## Testing

### Test Structure

Our test suite is organized into:

- **Unit Tests** (`__tests__/*.test.ts`): Core functionality testing
- **Integration Tests** (`__tests__/main.integration.test.ts`): Full action testing
- **Property-Based Tests** (`__tests__/coverage.property.test.ts`): Mathematical validation
- **Performance Tests** (`__tests__/performance.test.ts`): Large dataset handling

### Writing Tests

When adding new functionality:

1. Add unit tests for individual functions
2. Add integration tests if the feature affects the main workflow
3. Ensure test coverage remains above 95%

Example test structure:

```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = {
      /* test data */
    }

    // Act
    const result = yourFunction(input)

    // Assert
    expect(result).toBe(expected)
  })
})
```

## Code Style

- We use TypeScript with strict type checking
- Code is formatted with Prettier
- Code is linted with ESLint
- Follow existing code patterns and conventions

## Architecture

The action follows this flow:

1. `src/index.ts` → Entry point
2. `src/main.ts` → Main logic and GitHub API interaction
3. `src/simplecov.ts` → Coverage parsing and diff calculation
4. `src/utils.ts` → Helper functions and formatting

See `.github/copilot-instructions.md` for detailed architecture information.

## Need Help?

- Check existing issues and pull requests
- Read the [README.md](README.md) for usage examples
- Review [.github/copilot-instructions.md](.github/copilot-instructions.md) for architecture details

## License

By contributing to SimpleCov Resultset Diff Action, you agree that your contributions will be licensed under the MIT License.
