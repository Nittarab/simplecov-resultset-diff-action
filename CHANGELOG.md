# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-08-20

### ⚠️ Breaking Changes

- **Coverage table format changed**: The diff table now displays 5 columns (`Filename`, `Line Coverage`, `Branch Coverage`, `Line Diff`, `Branch Diff`) instead of the previous 3 columns. This provides clearer separation between current coverage values and coverage changes.
- **Visual indicators updated**: Coverage changes now use text-based emoji indicators (📈 increase, 📉 decrease, ➡️ no change) instead of SVG badges. This improves accessibility and reduces external dependencies.

### Added

- **Dry-run mode**: Set `DRY_RUN=true` environment variable to calculate and log coverage differences without posting PR comments. Useful for testing workflows and local development.
- **Optional token parameter**: The `token` input is now optional. When not provided, the action automatically runs in dry-run mode.
- **New file indicators**: Files that are newly added show 🆕 NEW and deleted files show 🗑️ DELETED in the coverage report.

### Changed

- **Improved diff visualization**: Coverage percentages and changes are now formatted more clearly with better visual separation between current values and differences.
- **Enhanced error messages**: Better error reporting when resultset files are missing or invalid.
- **Updated documentation**: Comprehensive examples for both normal and dry-run usage modes.

### Improved

- **Reliability**: Enhanced test coverage and error handling make the action more robust in edge cases.
- **Performance**: Optimized processing of large coverage datasets.
- **Accessibility**: Text-based indicators work better across different platforms and environments.

### For Contributors

- **Build system**: Migrated from pnpm to npm for package management.
- **Code quality**: Upgraded to ESLint 9 and improved TypeScript type definitions.
- **Testing**: Expanded test suite with property-based and performance testing.

---

## [2.0.0] - 2025-08-10

### Added

- SimpleCov resultset comparison functionality
- GitHub PR comment integration with coverage diff tables
- SVG badge-based coverage change indicators
- Support for both line and branch coverage analysis

### Changed

- Initial stable release with core features

---

## [1.0.0-beta.2] - Previous

### Changed

- Beta testing improvements and bug fixes

## [1.0.0-beta.1] - Previous

### Added

- Early beta release with basic functionality

## [1.0.0-beta] - Previous

### Added

- Initial beta version
