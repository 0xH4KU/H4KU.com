#!/bin/bash
# Unified quality check script for both GitHub Actions and GitLab CI
set -e

echo "🔍 Running quality checks..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Lint check
echo "📝 Checking code style with ESLint..."
if npm run lint; then
  echo -e "${GREEN}✓ ESLint passed${NC}"
else
  echo -e "${RED}✗ ESLint failed${NC}"
  FAILED=1
fi
echo ""

# Format check
echo "💅 Checking code formatting with Prettier..."
if npm run format:check; then
  echo -e "${GREEN}✓ Prettier check passed${NC}"
else
  echo -e "${RED}✗ Prettier check failed${NC}"
  FAILED=1
fi
echo ""

# Type check
echo "🔧 Checking types with TypeScript..."
if npm run type-check; then
  echo -e "${GREEN}✓ Type check passed${NC}"
else
  echo -e "${RED}✗ Type check failed${NC}"
  FAILED=1
fi
echo ""

# Exit with error if any check failed
if [ $FAILED -ne 0 ]; then
  echo -e "${RED}❌ Some quality checks failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ All quality checks passed!${NC}"
