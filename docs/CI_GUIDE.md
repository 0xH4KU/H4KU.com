# Continuous Integration Guide

_One reference for the Lum.bio CI/CD workflows, local commands, and status badges._

## Overview

Lum.bio runs identical quality, security, and build checks on both GitHub Actions and GitLab CI. The pipelines share the same npm scripts so that `npm run ci` locally exercises every gate before pushing. Each run:

- lints, formats, and type-checks the repository
- executes the Vitest suite with coverage thresholds
- performs dependency and audit scans
- rebuilds the aggregated content payload so `_integrity` / `_integritySHA256` stay fresh
- checks bundle size trends and captures build artifacts for Cloudflare Pages

## Local Workflow

| Goal | Command |
| --- | --- |
| Full pre-push verification | `npm run ci` |
| Quality gate only (lint/format/type-check) | `npm run ci:quality` |
| Tests with coverage | `npm run ci:coverage` |
| Security scan only | `npm run ci:security` |
| Bundle sizing report | `npm run ci:bundle` |
| Regenerate aggregated content | `npm run build:data` |

Before creating a pull request:

1. Run `npm run ci` and ensure the Status Bar in dev mode displays `[verified]`.
2. Commit any refreshed `src/content/_aggregated.json` files produced by `npm run build:data`.
3. Keep commit messages and PR descriptions clear so pipeline logs remain searchable.

## Pipeline Architecture

```
Quality Stage  ─►  Security Stage  ─►  Build Stage
   lint             npm audit          npm run build:data
   format           audit-ci           vite build
   type-check                           size limit check
   tests + coverage                      artifact upload
```

All quality jobs run in parallel. The security stage is warning-only today (pipelines continue even if npm audit reports advisories), and the build stage only starts when the earlier stages succeed.

## GitHub Actions

### Workflows

| File | Purpose | Notes |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Main workflow | Parallel quality jobs, coverage upload (Codecov), optional security scan, and build artifacts |
| `.github/workflows/size-check.yml` | Bundle-size regression guard | Comments the PR with gzip stats and fails when the configured limit is exceeded |
| `.github/workflows/codeql.yml` | Static analysis | Weekly schedule plus on-push/PR triggers using the extended query set |

### Required Secrets

Configure **Settings → Secrets and variables → Actions**:

| Secret | Why |
| --- | --- |
| `VITE_CONTACT_ENDPOINT` | Injects the API endpoint during builds |
| `CODECOV_TOKEN` (optional) | Enables coverage uploads to Codecov |

## GitLab CI

The `.gitlab-ci.yml` pipeline mirrors the GitHub workflow with `quality`, `security`, and `build` stages. Artifacts from the build stage (the `dist/` directory) remain available for seven days so Cloudflare Pages can deploy a verified bundle.

### Required Variables

Add these under **Settings → CI/CD → Variables**:

| Variable | Purpose |
| --- | --- |
| `VITE_CONTACT_ENDPOINT` | Same contact API endpoint used in GitHub Actions |

Mark variables as **Masked** and **Protected** if you use protected branches.

### When Pipelines Run

- push events on `main` or `develop`
- merge requests targeting `main` or `develop`
- manual runs via **Build → Pipelines → Run pipeline**

## Status Badges

Embed badges at the top of `README.md` to surface pipeline health:

```markdown
[![CI](https://github.com/USER/REPO/workflows/CI/badge.svg)](https://github.com/USER/REPO/actions)
[![GitLab Pipeline](https://gitlab.com/USER/REPO/badges/main/pipeline.svg)](https://gitlab.com/USER/REPO/-/pipelines)
[![Coverage](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/REPO)
[![License](https://img.shields.io/badge/license-LPSL--1.0-blue.svg)](./LICENSE.md)
```

Use [shields.io](https://shields.io) for custom runtime details such as Node, React, or TypeScript versions. To mirror the integrity indicator, publish a shields.io endpoint badge with `"label":"integrity"` and set `"message":"verified"` or `"tamper detected"` based on deployment telemetry.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Coverage threshold failure | Run `npm run test:coverage`, inspect `coverage/index.html`, add focused tests, and rerun. |
| `npm run build:data` fails in CI | Invalid JSON under `src/content/**`. Fix locally, rerun `npm run build:data`, commit the updated `_aggregated.json`. |
| Bundle size exceeded | Use `npm run size:analyze` to inspect dependencies and lazy-load or split heavy modules. |
| Badge stuck in “unknown” | Ensure workflow names in badge URLs exactly match file names and that at least one run has completed on the tracked branch. |
| Status Bar shows `[tamper detected]` in production | Run `npm run integrity:check` (or `npm run integrity:check -- --write` after intentional content edits) and redeploy once both hashes match. |

## Best Practices

- Keep feature branches rebased so pipelines run against the latest `main`.
- Prefer small PRs—fast pipelines encourage fast reviews.
- Store new secrets / API endpoints once in the CI providers and reference them via environment variables rather than duplicating `.env` files.
- Monitor pipeline durations; if a job creeps past a minute, profile it locally before it becomes a bottleneck for others.
- Document new scripts or gates in `README.md` and this guide whenever the CI surface changes.
