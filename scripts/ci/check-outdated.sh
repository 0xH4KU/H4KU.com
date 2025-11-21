#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[ci:deps] Checking for outdated npm packages..."
mkdir -p ./coverage
# npm outdated exits with 1 when anything is outdated; capture and normalize
if ! npm outdated --json > ./coverage/npm-outdated.json; then
  echo "[ci:deps] Outdated dependencies detected. See coverage/npm-outdated.json" >&2
  exit 1
fi

echo "[ci:deps] Dependencies are up to date."
