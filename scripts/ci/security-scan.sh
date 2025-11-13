#!/bin/bash
# Security scanning script for CI
set -e

echo "🔒 Running security scans..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

WARNINGS=0

# NPM audit check
echo "🔍 Checking for vulnerable dependencies with npm audit..."
if npm audit --audit-level=moderate; then
  echo -e "${GREEN}✓ No moderate or higher vulnerabilities found${NC}"
else
  echo -e "${YELLOW}⚠️  Vulnerabilities found - review npm audit output${NC}"
  WARNINGS=1
fi
echo ""

# Additional security checks with audit-ci
echo "🔍 Running enhanced security scan with audit-ci..."
if npx -y audit-ci@^6 --moderate; then
  echo -e "${GREEN}✓ audit-ci check passed${NC}"
else
  echo -e "${YELLOW}⚠️  audit-ci found issues${NC}"
  WARNINGS=1
fi
echo ""

# Check for common security issues in code
echo "🔍 Checking for common security patterns..."

# Check for hardcoded secrets (basic check)
echo "Checking for potential hardcoded secrets..."
if grep -r -i -E "(api[_-]?key|secret|password|token|auth)" src/ --exclude-dir=tests --exclude="*.test.*" | grep -i "=" | grep -v "process.env" | grep -v "import" | head -5; then
  echo -e "${YELLOW}⚠️  Potential hardcoded secrets found - please review${NC}"
  WARNINGS=1
else
  echo -e "${GREEN}✓ No obvious hardcoded secrets found${NC}"
fi
echo ""

# Summary
if [ $WARNINGS -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Security scan completed with warnings${NC}"
  echo "Please review the findings above and take appropriate action."
  exit 0  # Don't fail CI, just warn
fi

echo -e "${GREEN}✅ All security checks passed!${NC}"
