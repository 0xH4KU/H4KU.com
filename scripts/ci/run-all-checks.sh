#!/bin/bash
# Run all CI checks locally
# This script runs the same checks that CI will run
set -e

echo "🚀 Running all CI checks..."
echo "==========================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Build and check bundle size
echo "4️⃣  Build & Bundle Size"
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
