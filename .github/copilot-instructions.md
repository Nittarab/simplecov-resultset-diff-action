# Copilot Instructions for SimpleCov Resultset Diff Action

## Project Overview

A GitHub Action that compares SimpleCov coverage reports between base and head branches, posting diff results as PR comments. Processes Ruby SimpleCov `.resultset.json` files and generates markdown tables with coverage deltas and emoji indicators.

## Architecture & Data Flow

**Entry Point**: `src/index.ts` → `src/main.ts:run()`

**Core Pipeline**:

1. **Input** → `core.getInput()` reads paths + token from `action.yml`
2. **Parse** → `utils.ts:parseResultset()` reads JSON files via `fs.readFileSync()`
3. **Model** → `Coverage` class instances wrap raw data, calculate totals
4. **Diff** → `getCoverageDiff()` and `getTotalCoverageDiff()` compare base vs head
5. **Format** → `formatDiff()` and `formatTotalCoverageDiff()` create markdown rows with emojis (📈/📉/➡️, 🆕/🗑️)
6. **Output** → Post via `octokit.rest.issues.createComment()` OR log to console in dry-run mode

**Distribution**: Built to `dist/index.js` using `@vercel/ncc` (must commit `dist/` after changes)

## SimpleCov Format Deep Dive

```typescript
// Resultset structure from Ruby SimpleCov
{
  "[command_name]": {
    "coverage": {
      "path/to/file.rb": {
        "lines": [null, 1, 0, 5, null],  // null=not executable, 0=miss, >0=hit count
        "branches": {
          "[:if, 0, 5, 10]": {           // condition identifier
            "[:then, 1]": 1,              // branch hit count
            "[:else, 2]": 0
          }
        }
      }
    }
  }
}
```

**Coverage calculation** (`simplecov.ts`):

- Line coverage: `covered/total` where `total` excludes `null` entries
- Branch coverage: Counts all branch keys across all conditions
- Percentages use `floor(n, 2)` for two-decimal precision
- Empty files/branches default to 100% coverage

## Critical Development Workflows

```bash
# Quick iteration cycle
npm test                      # Jest with ~45 tests
npm run package:watch         # Auto-rebuild dist/ on src changes

# Full CI pipeline (run before commit)
npm run all                   # format → lint → test → coverage badge → package

# Local GitHub Actions testing (requires Docker + 'act')
./scripts/test-workflows.sh test    # Unit tests only
./scripts/test-workflows.sh ci      # Full CI pipeline locally
```

**Must commit `dist/` after src changes** - CI checks for uncommitted dist/ diffs and fails if found.

## Testing Architecture

- **Unit tests**: `__tests__/*.test.ts` test individual functions with mocked deps
- **Integration tests**: `main.integration.test.ts` tests full `run()` flow with mocked GitHub APIs
- **Property tests**: `coverage.property.test.ts` validates math precision edge cases
- **Performance tests**: `performance.test.ts` stress-tests large resultsets

**Key patterns**:

- Mock `@actions/core` and `@actions/github` using `jest.mock()` at top of test files
- Use real SimpleCov fixtures from `__tests__/fixtures/` (not generated data)
- Test both "diff found" and "no diff" scenarios separately
- Custom matcher: `expect(str).toBeValidCoverageDiff()` defined in `__tests__/setup.ts`
- Environment: `NODE_ENV=test` switches workspace path from `GITHUB_WORKSPACE` to `/`

**Fixture management**:

- `resultset1.json` / `resultset2.json` - Test pairs with known diffs
- `old/resultset*.json` - Legacy format fixtures for backward compatibility
- `not_coverage.json` - Invalid JSON for error path testing

## Dry-Run Mode

Set `DRY_RUN=true` or `DRY_RUN=1` environment variable to calculate and log diffs without posting PR comments. Used in CI integration tests (`.github/workflows/ci.yml`) to validate action without spamming the repo.

**Why it exists**: Allows testing the full action flow in CI without creating actual PR comments. Check `main.ts:run()` for implementation - returns early after logging when `isDryRun`.

## Error Handling Patterns

- **File validation**: `doesPathExists()` throws immediately if path missing
- **JSON parsing**: Errors bubble up from `JSON.parse()` - no try/catch at parse level
- **GitHub API**: Only `run()` catches errors, calls `core.setFailed(error.message)`
- **Path resolution**: Always use absolute paths via `path.resolve(process.cwd(), relativePath)`

**Anti-pattern**: Don't add defensive try/catch everywhere - fail fast on invalid data.

## Formatting & Output Conventions

- **Emoji indicators**: 📈 (increase), 📉 (decrease), ➡️ (no change), 🆕 (new file), 🗑️ (deleted file)
- **Percentage truncation**: `Math.sign(n) * Math.trunc(Math.abs(n) * 10) / 10` (keeps one decimal)
- **Workspace path trimming**: Strips `GITHUB_WORKSPACE/` prefix from filenames in output
- **Two-section output**: "Coverage Summary" (totals) + "File Coverage" (per-file) if any changes exist

## Action Configuration & Deployment

**Inputs** (`action.yml`):

- `base-resultset-path` / `head-resultset-path` - Relative or absolute paths to `.resultset.json`
- `token` - Optional; if omitted, action runs in implicit dry-run mode (no PR posting)

**Runtime**: Node.js 20 (specified as `using: node20` in `action.yml`)

**Release process**:

1. Update version in `package.json`
2. Run `npm run all` to rebuild dist/
3. Commit dist/ changes
4. Tag release (e.g., `v3.0.0`) and push
5. GitHub releases reference the tag (e.g., `uses: nittarab/simplecov-resultset-diff-action@v3`)

## CI Pipeline Structure

`.github/workflows/ci.yml` runs three jobs sequentially:

1. **test** - Formatting, linting, unit tests, coverage badge generation
2. **build** - Full bundle, validates dist/ is committed
3. **integration-test** - Runs action in dry-run mode with fixture data

**Coverage badge**: Auto-committed to `badges/coverage.svg` on main branch pushes via `make-coverage-badge` npm package.
