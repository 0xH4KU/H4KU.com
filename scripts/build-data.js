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

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content');
const OUTPUT_FILE = path.join(CONTENT_DIR, '_aggregated.json');

function computeIntegrityHash(payload) {
  const input = JSON.stringify(payload ?? null);
  let hash = FNV_OFFSET;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

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

const isPlainObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = value =>
  typeof value === 'string' && value.trim().length > 0;

const VALID_WORK_TYPES = new Set(['work', 'page']);

function validateAggregatedPayload(payload) {
  const errors = [];

  const ensureArray = (section, value) => {
    if (!Array.isArray(value)) {
      errors.push(`[${section}] must be an array`);
      return [];
    }
    return value;
  };

  const folders = ensureArray('folders', payload.folders);
  const works = ensureArray('works', payload.works);
  const pages = ensureArray('pages', payload.pages);
  const socials = ensureArray('socials', payload.socials);

  folders.forEach((folder, index) => {
    if (!isPlainObject(folder)) {
      errors.push(`[folders][${index}] must be an object`);
      return;
    }
    if (!isNonEmptyString(folder.id)) {
      errors.push(`[folders][${index}].id must be a non-empty string`);
    }
    if (!isNonEmptyString(folder.name)) {
      errors.push(`[folders][${index}].name must be a non-empty string`);
    }
    if (
      folder.type !== undefined &&
      folder.type !== null &&
      folder.type !== 'folder'
    ) {
      errors.push(`[folders][${index}].type must be "folder" when specified`);
    }
    if (
      folder.parentId !== undefined &&
      folder.parentId !== null &&
      typeof folder.parentId !== 'string'
    ) {
      errors.push(
        `[folders][${index}].parentId must be a string or null when provided`
      );
    }
    if (
      folder.order !== undefined &&
      folder.order !== null &&
      typeof folder.order !== 'number' &&
      typeof folder.order !== 'string'
    ) {
      errors.push(
        `[folders][${index}].order must be a number or numeric string when provided`
      );
    }
    if (folder.hidden !== undefined && typeof folder.hidden !== 'boolean') {
      errors.push(`[folders][${index}].hidden must be a boolean when provided`);
    }
  });

  works.forEach((work, index) => {
    if (!isPlainObject(work)) {
      errors.push(`[works][${index}] must be an object`);
      return;
    }
    if (!isNonEmptyString(work.id)) {
      errors.push(`[works][${index}].id must be a non-empty string`);
    }
    if (!isNonEmptyString(work.filename)) {
      errors.push(`[works][${index}].filename must be a non-empty string`);
    }
    if (
      work.folderId !== undefined &&
      work.folderId !== null &&
      typeof work.folderId !== 'string'
    ) {
      errors.push(
        `[works][${index}].folderId must be a string or null when provided`
      );
    }
    if (
      work.itemType !== undefined &&
      work.itemType !== null &&
      !VALID_WORK_TYPES.has(work.itemType)
    ) {
      errors.push(
        `[works][${index}].itemType must be "work" or "page" when provided`
      );
    }
  });

  pages.forEach((page, index) => {
    if (!isPlainObject(page)) {
      errors.push(`[pages][${index}] must be an object`);
      return;
    }
    if (typeof page.content !== 'string') {
      errors.push(`[pages][${index}].content must be a string`);
    }
    if (
      page.id !== undefined &&
      page.id !== null &&
      typeof page.id !== 'string'
    ) {
      errors.push(`[pages][${index}].id must be a string when provided`);
    }
    if (
      page.filename !== undefined &&
      page.filename !== null &&
      typeof page.filename !== 'string'
    ) {
      errors.push(`[pages][${index}].filename must be a string when provided`);
    }
    if (
      page.folderId !== undefined &&
      page.folderId !== null &&
      typeof page.folderId !== 'string'
    ) {
      errors.push(
        `[pages][${index}].folderId must be a string or null when provided`
      );
    }
    if (
      page.order !== undefined &&
      page.order !== null &&
      typeof page.order !== 'number' &&
      typeof page.order !== 'string'
    ) {
      errors.push(
        `[pages][${index}].order must be a number or numeric string when provided`
      );
    }
  });

  socials.forEach((social, index) => {
    if (!isPlainObject(social)) {
      errors.push(`[socials][${index}] must be an object`);
      return;
    }
    if (!isNonEmptyString(social.name)) {
      errors.push(`[socials][${index}].name must be a non-empty string`);
    }
    if (!isNonEmptyString(social.code)) {
      errors.push(`[socials][${index}].code must be a non-empty string`);
    }
    if (!isNonEmptyString(social.url)) {
      errors.push(`[socials][${index}].url must be a non-empty string`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Main aggregation function
function main() {
  console.log('🔨 Building aggregated data file...\n');

  const folders = readJsonFiles(path.join(CONTENT_DIR, 'folders'));
  const images = readJsonFiles(path.join(CONTENT_DIR, 'images'));
  const pages = readJsonFiles(path.join(CONTENT_DIR, 'pages'));
  const socials = readJsonFiles(path.join(CONTENT_DIR, 'socials'));

  const payload = {
    folders,
    works: images,
    pages,
    socials,
  };

  const validation = validateAggregatedPayload(payload);
  if (!validation.isValid) {
    console.error('❌ Content validation failed:');
    validation.errors.forEach(error => {
      console.error(`   • ${error}`);
    });
    console.error(
      '\nPlease fix the content JSON files above before regenerating.'
    );
    process.exit(1);
  }

  const aggregated = {
    ...payload,
    _buildTime: new Date().toISOString(),
    _integrity: computeIntegrityHash(payload),
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
  console.log(`   Integrity: ${aggregated._integrity}`);
  console.log(`\n✅ Built: ${OUTPUT_FILE}`);
  console.log(
    `   Size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB\n`
  );
}

try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
