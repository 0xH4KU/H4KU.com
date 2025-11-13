# Comprehensive CI/CD Guide

This guide provides a complete overview of the CI/CD setup for this project, covering both GitHub Actions and GitLab CI pipelines.

## Table of Contents

1. [Overview](#overview)
2. [CI Pipeline Architecture](#ci-pipeline-architecture)
3. [GitHub Actions Workflows](#github-actions-workflows)
4. [GitLab CI Configuration](#gitlab-ci-configuration)
5. [Quality Gates](#quality-gates)
6. [Local Testing](#local-testing)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Overview

This project uses dual CI/CD pipelines on both GitHub Actions and GitLab CI to ensure:

- ✅ **Code quality** through linting, formatting, and type checking
- ✅ **Test coverage** with automated testing and coverage thresholds
- ✅ **Security** via dependency scanning and vulnerability checks
- ✅ **Performance** through bundle size monitoring
- ✅ **Build verification** to catch integration issues early

Both pipelines are designed to be:
- **Consistent**: Same checks run on both platforms
- **Fast**: Parallel execution where possible
- **Reliable**: Deterministic builds with locked dependencies
- **Informative**: Detailed reports and artifacts

## CI Pipeline Architecture

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────┐
│                     Quality Stage (Parallel)                 │
├──────────────┬──────────────┬──────────────┬────────────────┤
│     Lint     │    Format    │  Type Check  │  Test+Coverage │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Security Stage                           │
├─────────────────────────────────────────────────────────────┤
│  npm audit  │  audit-ci  │  Secret scanning (basic)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Build Stage                              │
├─────────────────────────────────────────────────────────────┤
│  Build Application  │  Bundle Size Check  │  Artifacts      │
└─────────────────────────────────────────────────────────────┘
```

### Execution Flow

1. **Quality checks run in parallel** for speed
2. **Security scan** runs independently (warnings don't block)
3. **Build only runs** if all quality checks pass
4. **Artifacts** are saved for 7 days

## GitHub Actions Workflows

### Main CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

**Jobs:**

#### 1. Lint Job
```yaml
Checks: ESLint rules
Runtime: ~30-45 seconds
Artifacts: None
```

#### 2. Format Check Job
```yaml
Checks: Prettier formatting
Runtime: ~20-30 seconds
Artifacts: None
```

#### 3. Type Check Job
```yaml
Checks: TypeScript compilation
Runtime: ~30-45 seconds
Artifacts: None
```

#### 4. Test & Coverage Job
```yaml
Checks: Vitest test suite with coverage
Runtime: ~1-2 minutes
Artifacts:
  - Coverage report (HTML)
  - Cobertura XML (for Codecov)
Coverage Threshold: 70% (lines, statements, functions, branches)
```

#### 5. Security Scan Job
```yaml
Checks:
  - npm audit (moderate+ vulnerabilities)
  - audit-ci enhanced scanning
Runtime: ~1 minute
Allow Failure: Yes (warnings only)
```

#### 6. Build Job
```yaml
Checks: Production build
Runtime: ~1-2 minutes
Artifacts:
  - dist/ folder (production bundle)
  - Build size report
Depends On: All quality checks + security
```

### Bundle Size Check Workflow (`.github/workflows/size-check.yml`)

**Triggers:**
- Pull requests only

**Purpose:**
- Compare bundle size between PR and main branch
- Prevent bundle size bloat
- Generate detailed size reports

**Outputs:**
- Size comparison table in PR summary
- Gzipped file sizes
- Largest files report

## GitLab CI Configuration

### Configuration File (`.gitlab-ci.yml`)

**Stages:**
1. Quality (parallel jobs)
2. Security
3. Build

**Global Settings:**
- **Image**: `node:20`
- **Cache**: `node_modules/` keyed by `package-lock.json`
- **Cache Policy**: `pull-push` for dependencies, `pull` for jobs

### Job Definitions

#### Quality Stage Jobs

All run in parallel using `.install-deps` template:

```yaml
lint:
  stage: quality
  script: npm run lint

format-check:
  stage: quality
  script: npm run format:check

type-check:
  stage: quality
  script: npm run type-check

test:
  stage: quality
  script: npm run test:coverage
  artifacts:
    - coverage/ (Cobertura XML + HTML)
  coverage: Regex extracts percentage
```

#### Security Stage

```yaml
security-scan:
  stage: security
  script:
    - npm run ci:security
```

#### Build Stage

```yaml
build:
  stage: build
  script: npm run build
  artifacts:
    - dist/ (expires in 7 days)
  needs: [all quality + security jobs]
```

## Quality Gates

### Coverage Thresholds

Defined in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
    perFile: true  // Enforce per-file thresholds
  }
}
```

**Behavior:**
- ❌ CI fails if any metric drops below 70%
- ✅ Coverage report always generated
- 📊 Coverage badge updates automatically

### Bundle Size Limits

Defined in `.size-limit.json`:

| Bundle | Limit (gzipped) |
|--------|-----------------|
| Main Bundle | 150 KB |
| React Vendor | 140 KB |
| Animation Vendor | 80 KB |
| Icons Vendor | 60 KB |
| Total CSS | 50 KB |

**Behavior:**
- ⚠️ Warning if size exceeds limit
- 📊 Size comparison in PR comments
- 🔍 Detailed analysis available

### Security Scanning

**`npm run ci:security`:**
- Wraps `npm audit --audit-level=moderate`, `audit-ci`, and basic secret detection
- Surfaces warnings in CI logs without blocking the pipeline
- Fails only if the scan itself errors (e.g., network issues)
- Review warnings promptly and address vulnerable dependencies

## Local Testing

### Run All CI Checks Locally

```bash
# Run the complete CI suite
bash scripts/ci/run-all-checks.sh
```

This script runs:
1. ✅ Quality checks (lint, format, type-check)
2. ✅ Tests with coverage
3. ✅ Security scan
4. ✅ Build and bundle size check

**Recommended**: Run before every push to catch issues early!

### Individual Check Scripts

```bash
# Quality checks only
bash scripts/ci/check-quality.sh

# Coverage with threshold enforcement
bash scripts/ci/report-coverage.sh

# Security scanning
bash scripts/ci/security-scan.sh

# Bundle size analysis
bash scripts/ci/check-bundle-size.sh
```

### Package.json Scripts

```bash
# Quick checks
npm run lint          # ESLint
npm run format:check  # Prettier
npm run type-check    # TypeScript

# Testing
npm test              # Watch mode
npm run test:run      # CI mode (single run)
npm run test:coverage # With coverage

# Build
npm run build         # Production build
npm run size          # Check bundle size
npm run size:analyze  # Detailed size analysis
```

## Troubleshooting

### Common Issues

#### 1. Coverage Threshold Failures

**Problem**: Tests pass but CI fails on coverage

**Solutions:**
```bash
# Check current coverage
npm run test:coverage

# Identify uncovered code
open coverage/index.html

# Option 1: Add tests for uncovered code
# Option 2: Exclude file in vitest.config.ts if not critical
```

#### 2. Bundle Size Exceeded

**Problem**: Bundle size check fails

**Solutions:**
```bash
# Analyze bundle composition
npm run size:analyze

# Check what's in each chunk
npm run build
ls -lh dist/assets/*.js

# Options to reduce size:
# - Lazy load components
# - Remove unused dependencies
# - Optimize images
# - Use lighter alternatives
```

#### 3. Dependency Vulnerabilities

**Problem**: Security scan fails

**Solutions:**
```bash
# View vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# Update specific package
npm update package-name

# Override audit for false positives
# Add to .npmrc:
# audit-level=high
```

#### 4. Type Check Failures

**Problem**: TypeScript compilation errors

**Solutions:**
```bash
# Run type check with detailed output
npm run type-check -- --pretty

# Common fixes:
# - Add missing type definitions
# - Update @types/* packages
# - Fix type mismatches
# - Add proper type assertions
```

#### 5. Flaky Tests

**Problem**: Tests pass locally but fail in CI

**Common causes:**
- Timing issues (use fake timers)
- Race conditions (wrap in `act()`)
- Environment differences (check NODE_ENV)
- Async operations not awaited

**Debug approach:**
```bash
# Run tests multiple times
npm run test:run -- --repeat=10

# Run in CI mode locally
CI=true npm run test:run

# Enable verbose output
npm run test:run -- --reporter=verbose
```

### CI-Specific Issues

#### GitHub Actions

**Workflow not running:**
1. Check if Actions are enabled: Settings → Actions
2. Verify workflow syntax: Actions tab → View workflow
3. Check branch protection rules

**Secret not working:**
1. Verify secret is added: Settings → Secrets
2. Check secret name matches exactly
3. Secrets are not passed to forks (by design)

#### GitLab CI

**Pipeline not starting:**
1. Check `.gitlab-ci.yml` syntax: CI/CD → Pipeline Editor
2. Verify runners are available: Settings → CI/CD → Runners
3. Check pipeline triggers: CI/CD → Pipelines

**Cache issues:**
1. Clear pipeline cache: CI/CD → Pipelines → Clear runner caches
2. Update cache key in `.gitlab-ci.yml`
3. Check cache policy (`pull` vs `pull-push`)

## Best Practices

### Pre-commit Checks

Set up a pre-commit hook to run checks before committing:

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run lint && npm run type-check && npm run test:run
```

Or use `husky` for team consistency:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run test:run"
```

### Pull Request Workflow

1. ✅ Run `bash scripts/ci/run-all-checks.sh` locally
2. ✅ Create feature branch from `develop`
3. ✅ Make focused commits with clear messages
4. ✅ Push and create PR
5. ✅ Wait for CI to pass
6. ✅ Address any CI failures
7. ✅ Request review
8. ✅ Merge to `develop` (not `main` directly)

### Branch Strategy

```
main (protected)
  ↑
  └─ develop (protected)
       ↑
       ├─ feature/new-feature
       ├─ fix/bug-fix
       └─ refactor/improvements
```

**Protection rules:**
- Require passing CI checks
- Require code review
- No force pushes
- No deletion

### Performance Tips

**Faster CI runs:**
1. Use npm `ci` instead of `install` (deterministic, faster)
2. Cache `node_modules/` aggressively
3. Run quality checks in parallel
4. Skip unnecessary jobs for docs-only changes
5. Use `concurrency` groups to cancel stale runs

**Local optimization:**
1. Use `--only-changed` flags where available
2. Run `npm test` in watch mode during development
3. Use `--coverage=false` when speed matters
4. Install dependencies once, run multiple checks

### Maintenance

**Weekly:**
- Review dependency vulnerabilities: `npm audit`
- Check for outdated packages: `npm outdated`

**Monthly:**
- Update dependencies: `npm update`
- Review and update CI configs
- Check CI performance metrics
- Update Node.js version if needed

**After major updates:**
- Test CI locally first
- Update documentation
- Notify team of changes
- Monitor first few CI runs

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Vitest Documentation](https://vitest.dev)
- [size-limit Documentation](https://github.com/ai/size-limit)
- [CI Badges Setup](./CI_BADGES.md)
- [Testing Guide](../TESTING.md)

## Support

If you encounter issues not covered in this guide:

1. Check existing issues on GitHub/GitLab
2. Review recent pipeline runs for patterns
3. Consult team members or maintainers
4. Create a detailed issue with:
   - What you tried
   - Expected vs actual behavior
   - CI logs
   - Local reproduction steps
