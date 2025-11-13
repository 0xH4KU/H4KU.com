# GitLab CI/CD Guide

Lum.bio ships with a lightweight GitLab pipeline that keeps code quality high and guarantees reproducible builds for Cloudflare Pages.

## Pipeline Overview

```
Quality Gate ─► Build & Artifact
```

### 1. Quality Gate
- `npm run lint`
- `npm run type-check`
- `npm run test:run`

Any failure in this stage stops the pipeline.

### 2. Build & Artifact
- `npm run build:data` – refreshes `src/content/_aggregated.json`
- `vite build`
- Upload `dist/` as an artifact (retained for 7 days) so Cloudflare Pages can fetch a known-good bundle.

## Required Environment Variables

Configure them under **Settings → CI/CD → Variables**:

| Variable | Purpose |
| --- | --- |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | Template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | Public key |

Mark them as **Masked** and **Protected** if your repo uses protected branches.

## When Pipelines Run

Pipelines trigger automatically when:
- pushing to `main`
- pushing to `develop`
- opening or updating a Merge Request

## Manual Execution

1. Navigate to **Build → Pipelines**.
2. Click **Run pipeline**.
3. Choose the target branch and confirm.

## Cloudflare Pages Deployment

Cloudflare Pages listens to the `main` branch artifacts. Use the following settings:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | same EmailJS variables as GitLab |

## Monitoring Pipeline Status

- **Pipelines** tab → full history
- **Jobs** tab → per-job logs
- Merge Requests → badge showing pass/fail status

## Troubleshooting

| Issue | Resolution |
| --- | --- |
| Pipeline doesn’t start | Ensure `.gitlab-ci.yml` exists at the repo root, CI is enabled, and the branch matches the trigger rules. |
| `build:data` fails | Check for invalid JSON under `src/content/`. Re-run `npm run build:data` locally for details. |
| Missing EmailJS config | Confirm variables exist in both GitLab and Cloudflare Pages. |
| Cloudflare deploy returns 404 | Make sure `public/_redirects` is included in the final `dist/`. |

## Pre-push Checklist

Run the same commands locally before pushing:

```bash
npm run lint
npm run type-check
npm run format:check
npm run build
```

Keeping these green locally ensures CI stays green too.
