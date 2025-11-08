# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

We take the security of SimpleCov Resultset Diff Action seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisory**: Use the [GitHub Security Advisory](https://github.com/Nittarab/simplecov-resultset-diff-action/security/advisories/new) feature to privately report vulnerabilities
2. **Email**: Send details to the repository maintainers

### What to Include

When reporting a vulnerability, please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Affected versions
- Any potential impacts
- Suggested fixes (if you have any)

### Response Timeline

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide a detailed response within 7 days indicating the next steps
- We will keep you informed of the progress toward a fix and full announcement
- We will credit you for the discovery when the vulnerability is announced (if you wish)

## Security Best Practices for Users

### Token Security

When using this action, ensure:

1. **Never commit tokens**: Use GitHub Secrets to store the `GITHUB_TOKEN`
2. **Minimum permissions**: Use the minimum required token permissions
3. **Dry-run mode**: Use dry-run mode for testing without posting comments

Example secure usage:

```yaml
- uses: nittarab/simplecov-resultset-diff-action@v3
  with:
    base-resultset-path: ./base/.resultset.json
    head-resultset-path: ./head/.resultset.json
    token: ${{ secrets.GITHUB_TOKEN }} # Secure token usage
```

### Input Validation

The action validates:

- File paths exist before processing
- JSON files are valid SimpleCov resultsets
- Workspace paths are properly sanitized

### Dependencies

We regularly:

- Update dependencies to patch security vulnerabilities
- Use Dependabot to monitor for security updates
- Review and audit dependency changes

## Known Security Considerations

### Code Execution

This action:

- Does NOT execute arbitrary code from coverage files
- Only reads and parses JSON data
- Does not expose sensitive information in comments

### GitHub API Access

The action uses GitHub API with:

- Read access to repository content
- Write access to post PR comments (when token is provided)
- No access to other repositories or sensitive data

## Security Updates

Security updates will be released as:

- Patch versions for minor security fixes (e.g., 3.0.1 → 3.0.2)
- Minor versions for moderate security improvements (e.g., 3.0.x → 3.1.0)
- Major versions for significant security changes (e.g., 3.x.x → 4.0.0)

## Acknowledgments

We appreciate the security research community's efforts to responsibly disclose vulnerabilities and improve the security of open source software.
