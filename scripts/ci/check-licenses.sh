#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

mkdir -p coverage

echo "[ci:license] Checking dependency licenses..."
license-checker --production --csv --out coverage/licenses.csv

# Ensure no unknown licenses leak through
if grep -qi "unknown" coverage/licenses.csv; then
  echo "[ci:license] Found dependencies with unknown licenses" >&2
  exit 1
fi

echo "[ci:license] License check passed."
