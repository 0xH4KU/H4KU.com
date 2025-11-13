# CI Badges Configuration Guide

This guide explains how to add CI status badges to your README to showcase your project's build status, test coverage, and code quality.

## Available Badges

### GitHub Actions

Add these badges to your README.md (replace `USERNAME` and `REPO` with your actual values):

```markdown
<!-- CI Status -->
![CI](https://github.com/USERNAME/REPO/workflows/CI/badge.svg)

<!-- Bundle Size Check -->
![Bundle Size](https://github.com/USERNAME/REPO/workflows/Bundle%20Size%20Check/badge.svg)
```

### GitLab CI

For GitLab, use these badge URLs:

```markdown
<!-- Pipeline Status -->
![Pipeline](https://gitlab.com/USERNAME/REPO/badges/main/pipeline.svg)

<!-- Coverage -->
![Coverage](https://gitlab.com/USERNAME/REPO/badges/main/coverage.svg)
```

### Codecov (Optional)

If you're using Codecov for coverage tracking:

```markdown
[![codecov](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)
```

## Recommended Badge Layout

Add this section right after your main heading in README.md:

```markdown
# Lum.bio

[![CI](https://github.com/USERNAME/REPO/workflows/CI/badge.svg)](https://github.com/USERNAME/REPO/actions)
[![Coverage](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)
[![GitLab Pipeline](https://gitlab.com/USERNAME/REPO/badges/main/pipeline.svg)](https://gitlab.com/USERNAME/REPO/-/pipelines)
[![License](https://img.shields.io/badge/license-LPSL--1.0-blue.svg)](./LICENSE.md)

A file-system inspired portfolio built with React 19, TypeScript, and modern web standards...
```

## Setup Instructions

### 1. GitHub Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `CODECOV_TOKEN` (optional, for coverage tracking)

### 2. GitLab CI/CD Variables

Configure these variables in your GitLab project settings (Settings → CI/CD → Variables):

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

Mark these as "Protected" and "Masked" for security.

### 3. Codecov Setup (Optional)

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get your upload token
4. Add `CODECOV_TOKEN` to GitHub Secrets
5. Coverage will be automatically uploaded by the CI workflow

## Custom Badges

You can create custom badges using [shields.io](https://shields.io):

```markdown
<!-- Node version -->
![Node](https://img.shields.io/badge/node-20.x-green.svg)

<!-- TypeScript -->
![TypeScript](https://img.shields.io/badge/typescript-5.4-blue.svg)

<!-- React -->
![React](https://img.shields.io/badge/react-19.2-61dafb.svg)
```

## Badge Status Meanings

| Badge Color | Meaning |
|-------------|---------|
| 🟢 Green | All checks passing |
| 🔴 Red | Build/tests failing |
| 🟡 Yellow | Warnings or partial success |
| ⚪ Gray | No status / pending |

## Troubleshooting

### Badge Not Updating

1. **GitHub Actions**: Check if workflows are enabled in repository settings
2. **GitLab CI**: Verify pipeline ran successfully at least once
3. **Codecov**: Confirm token is correctly configured and upload succeeded

### Badge Shows "Unknown"

- GitHub: Workflow name in badge URL must exactly match workflow file name
- GitLab: Ensure badge URL uses correct project path and branch name

### Coverage Badge Missing

1. Verify tests are running with coverage: `npm run test:coverage`
2. Check coverage reports are generated in `coverage/` directory
3. Confirm coverage report upload step in CI workflow
4. For GitLab, ensure `coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'` regex matches your coverage output

## Example Badge Section

Here's a complete example with all recommended badges:

```markdown
# Project Name

<div align="center">

[![CI](https://github.com/user/repo/workflows/CI/badge.svg)](https://github.com/user/repo/actions)
[![Coverage](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/user/repo)
[![GitLab Pipeline](https://gitlab.com/user/repo/badges/main/pipeline.svg)](https://gitlab.com/user/repo/-/pipelines)
[![Node](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.4-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-LPSL--1.0-blue.svg)](./LICENSE.md)

</div>
```

## Additional Resources

- [GitHub Actions Badge Documentation](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge)
- [GitLab CI Badge Documentation](https://docs.gitlab.com/ee/user/project/badges.html)
- [Shields.io Badge Generator](https://shields.io/)
- [Codecov Badge Documentation](https://docs.codecov.com/docs/status-badges)
