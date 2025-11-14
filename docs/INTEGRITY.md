# Integrity Verification Guide

_How to verify `src/content/_aggregated.json` checksums and respond to tamper warnings._

## Status Bar Indicator

- The footer displays `[verified]` when the checksum embedded in `_aggregated.json` matches the payload on disk.
- If someone edits the aggregated file without re-running the data builder, the indicator switches to `[tamper detected]` and surfaces actionable guidance.
- Error boundaries reference the same checksum and include a reference code so production crashes can be correlated with monitoring alerts.

## CLI Verification

Run the integrity checker whenever you pull new content or before pushing a release:

```bash
npm run integrity:check
```

The script recomputes the checksum across `folders`, `images`, `pages`, and `socials` inside `_aggregated.json` and compares it with the persisted `_integrity` field. It exits with a non-zero status when the numbers do not match so CI pipelines can fail fast.

### Updating the Checksum

If you intentionally edited JSON under `src/content/**`, regenerate the checksum (and preserve the pretty-printed file) with:

```bash
npm run build:data          # preferred – regenerates everything
# or, for quick fixes
npm run integrity:check -- --write
```

The `--write` flag only replaces the `_integrity` value; it does not rebuild folders or metadata.

## Responding to Tamper Alerts

1. Re-run `npm run integrity:check` to confirm the bundled files are authentic.
2. If the mismatch persists, rebuild the aggregated file (`npm run build:data`) and redeploy.
3. Encourage visitors to reload or contact `hi@lum.bio` with the reference code displayed in the crash dialog so we can inspect Sentry logs tied to that hash.

Keeping this checksum up to date ensures the published builds always match the source of truth captured in this repository.
