#!/bin/bash
# Check bundle size and report
set -e

echo "📦 Analyzing bundle size..."
echo ""

# Build the project
echo "🏗️  Building project..."
npm run build
echo ""

# Calculate sizes
echo "📊 Bundle Size Report:"
echo "====================="
echo ""

# Total dist size
TOTAL_SIZE=$(du -sh dist/ | cut -f1)
echo "Total dist size: $TOTAL_SIZE"
echo ""

# JavaScript files
echo "JavaScript files (largest 10):"
find dist/assets -type f -name "*.js" -exec du -h {} \; | sort -rh | head -10 | while read size file; do
  # Calculate gzipped size
  GZIP_SIZE=$(gzip -c "$file" | wc -c | awk '{printf "%.2f KB", $1/1024}')
  echo "  $file"
  echo "    Original: $size"
  echo "    Gzipped:  $GZIP_SIZE"
done
echo ""

# CSS files
echo "CSS files:"
find dist/assets -type f -name "*.css" -exec du -h {} \; | sort -rh | while read size file; do
  GZIP_SIZE=$(gzip -c "$file" | wc -c | awk '{printf "%.2f KB", $1/1024}')
  echo "  $file"
  echo "    Original: $size"
  echo "    Gzipped:  $GZIP_SIZE"
done
echo ""

# Check if size-limit is available
if command -v size-limit &> /dev/null; then
  echo "🔍 Running size-limit checks..."
  npm run size
else
  echo "⚠️  size-limit not installed, skipping size checks"
  echo "   Install with: npm install --save-dev size-limit @size-limit/preset-app @size-limit/file"
fi

echo ""
echo "✅ Bundle analysis complete!"
