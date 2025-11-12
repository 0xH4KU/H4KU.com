#!/usr/bin/env node

/**
 * Build Data Aggregator
 *
 * Aggregates all JSON files from src/content/ into a single optimized data file.
 * This eliminates the need for eager glob imports at runtime and reduces
 * the initial bundle size.
 *
 * Run this script during build time (before vite build).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content');
const OUTPUT_FILE = path.join(CONTENT_DIR, '_aggregated.json');

// Read all JSON files from a directory
function readJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  const data = [];

  files.forEach(file => {
    if (file.endsWith('.json') && !file.startsWith('_')) {
      const filePath = path.join(dir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);
        data.push(json);
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
      }
    }
  });

  return data;
}

// Main aggregation function
function main() {
  console.log('🔨 Building aggregated data file...\n');

  const folders = readJsonFiles(path.join(CONTENT_DIR, 'folders'));
  const images = readJsonFiles(path.join(CONTENT_DIR, 'images'));
  const pages = readJsonFiles(path.join(CONTENT_DIR, 'pages'));
  const socials = readJsonFiles(path.join(CONTENT_DIR, 'socials'));

  const aggregated = {
    folders,
    works: images,
    pages,
    socials,
    _buildTime: new Date().toISOString(),
  };

  // Write aggregated file
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(aggregated, null, 2) + '\n',
    'utf-8'
  );

  console.log(`📊 Aggregated data stats:`);
  console.log(`   Folders: ${folders.length}`);
  console.log(`   Works: ${images.length}`);
  console.log(`   Pages: ${pages.length}`);
  console.log(`   Socials: ${socials.length}`);
  console.log(`\n✅ Built: ${OUTPUT_FILE}`);
  console.log(`   Size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB\n`);
}

try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
