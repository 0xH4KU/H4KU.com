#!/bin/bash
# Generate and report test coverage
set -e

echo "🧪 Running tests with coverage..."
echo ""

# Run tests with coverage
npm run test:coverage

echo ""
echo "📊 Coverage Summary:"
echo "===================="

# Display coverage summary
SUMMARY_FILE="coverage/coverage-summary.json"

if [ -f "$SUMMARY_FILE" ]; then
  # Parse and display coverage summary
  node -e "
    const fs = require('fs');
    const coverage = JSON.parse(fs.readFileSync('$SUMMARY_FILE', 'utf8'));
    const total = coverage.total;

    console.log('Lines:      ' + total.lines.pct.toFixed(2) + '%');
    console.log('Statements: ' + total.statements.pct.toFixed(2) + '%');
    console.log('Functions:  ' + total.functions.pct.toFixed(2) + '%');
    console.log('Branches:   ' + total.branches.pct.toFixed(2) + '%');

    // Check if coverage meets thresholds
    const threshold = 70;
    const failed = [];

    if (total.lines.pct < threshold) failed.push('lines');
    if (total.statements.pct < threshold) failed.push('statements');
    if (total.functions.pct < threshold) failed.push('functions');
    if (total.branches.pct < threshold) failed.push('branches');

    if (failed.length > 0) {
      console.log('\n❌ Coverage below threshold (70%) for: ' + failed.join(', '));
      process.exit(1);
    } else {
      console.log('\n✅ All coverage thresholds met!');
    }
  "
else
  echo "⚠️  Coverage summary not found. Make sure the 'json-summary' reporter is enabled in vitest.config.ts."
  exit 1
fi

echo ""
echo "📄 Detailed coverage report available at: coverage/index.html"
