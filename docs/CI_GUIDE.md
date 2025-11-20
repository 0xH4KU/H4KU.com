# Continuous Integration Guide

_One reference for Lum.bio local and GitLab pipelines._

## Overview

`npm run ci` mirrors the GitLab pipeline. Each run:

- lint + format check + type-check
- Vitest with 95% global coverage thresholds
- dependency / security scan (`scripts/ci/security-scan.sh`)
- build orchestration (CMS → fingerprint → Vite) + bundle-size gate

Use the same command locally before pushing to avoid surprises.

## Local Commands

| Goal                          | Command               |
| ----------------------------- | --------------------- |
| Full pre-push run             | `npm run ci`          |
| Quality gate only             | `npm run ci:quality`  |
| Coverage run                  | `npm run ci:coverage` |
| Security scan                 | `npm run ci:security` |
| Bundle size check             | `npm run ci:bundle`   |
| Regenerate aggregated content | `npm run build:data`  |

## GitLab Pipeline

- Stages: `quality` → `security` → `build`
- Artifacts: build stage uploads `dist/` for seven days; earlier stages are downloaded as needed.
- Triggers: pushes and merge requests to `main`/`develop`, plus manual runs.

### Required Variables

| Variable                | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `VITE_CONTACT_ENDPOINT` | Contact API endpoint injected at build time |

Set variables under **Settings → CI/CD → Variables**, masked and protected as appropriate.

## Failure Recovery

| Symptom                   | Action                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Coverage below 95%        | Run `npm run test:coverage`, inspect `coverage/index.html`, add targeted tests.                |
| `build:data` errors in CI | Check JSON under `src/content/**`, fix, rerun `npm run build:data`, commit `_aggregated.json`. |
| Bundle size regression    | Run `npm run size:analyze` and trim dependencies or split chunks.                              |
| Tamper warning in deploy  | `npm run integrity:check` (or `-- --write` after intentional edits) then rebuild and redeploy. |

Keep PRs small and rebased so pipelines stay quick. Document new gates in this guide whenever the CI surface changes.
