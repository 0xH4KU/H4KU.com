#!/bin/bash
# Run all CI checks locally
# This script runs the same checks that CI will run
set -e

echo "🚀 Running all CI checks..."
echo "==========================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Use workspace-local tmp to avoid sandboxed tmp issues
TMPDIR="${TMPDIR:-$SCRIPT_DIR/../.tmp}"
mkdir -p "$TMPDIR"
export TMPDIR

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Track failures
FAILED=0

# Run quality checks
echo "1️⃣  Quality Checks"
echo "=================="
if bash "$SCRIPT_DIR/check-quality.sh"; then
  echo "✅ Quality checks passed"
else
  echo "❌ Quality checks failed"
  FAILED=1
fi
echo ""
echo ""

# Run tests with coverage
echo "2️⃣  Test Coverage"
echo "================="
if bash "$SCRIPT_DIR/report-coverage.sh"; then
  echo "✅ Tests and coverage passed"
else
  echo "❌ Tests or coverage failed"
  FAILED=1
fi
echo ""
echo ""

# Run security scan
echo "3️⃣  Security Scan"
echo "================="
if bash "$SCRIPT_DIR/security-scan.sh"; then
  echo "✅ Security scan passed"
else
  echo "⚠️  Security scan completed with warnings"
  # Don't fail on security warnings
fi
echo ""
echo ""

# Run E2E tests
echo "4️⃣  E2E Tests"
echo "============="
# Ensure browsers are available (chromium + firefox so both Playwright projects can run)
echo "(Ensuring Playwright browsers are installed: chromium, firefox ...)"
if npx playwright install --with-deps chromium firefox; then
  echo "✅ Playwright browsers ready"
else
  echo "❌ Failed to install Playwright browsers"
  exit 1
fi
echo ""

if npm run test:e2e; then
  echo "✅ E2E tests passed"
else
  echo "❌ E2E tests failed"
  FAILED=1
fi
echo ""
echo ""

# Build and check bundle size
echo "5️⃣  Build & Bundle Size"
echo "======================="
if bash "$SCRIPT_DIR/check-bundle-size.sh"; then
  echo "✅ Build and bundle size check passed"
else
  echo "❌ Build or bundle size check failed"
  FAILED=1
fi
echo ""
echo ""

# Final summary
echo "==========================="
if [ $FAILED -ne 0 ]; then
  echo "❌ Some checks failed"
  echo "Please fix the issues above before pushing"
  exit 1
fi

echo "✅ All CI checks passed!"
echo "Your code is ready to push! 🚀"
