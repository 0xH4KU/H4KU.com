#!/usr/bin/env node
/**
 * Suggest CMS view filters based on existing folders
 * This script ONLY prints suggestions - it doesn't modify files
 * Copy the output and manually paste into config.yml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOLDERS_DIR = path.join(__dirname, '../src/content/folders');

// Emoji mapping for folder types
const FOLDER_EMOJIS = {
  featured: '⭐',
  sketches: '✏️',
  commission: '💼',
  default: '📁',
};

function getEmojiForFolder(folderId) {
  for (const [key, emoji] of Object.entries(FOLDER_EMOJIS)) {
    if (folderId.startsWith(key)) return emoji;
  }
  return FOLDER_EMOJIS.default;
}

// Read all folder files
function getAllFolders() {
  const files = fs.readdirSync(FOLDERS_DIR).filter(f => f.endsWith('.json') && !f.includes('test'));
  const folders = files.map(file => {
    const content = fs.readFileSync(path.join(FOLDERS_DIR, file), 'utf-8');
    return JSON.parse(content);
  });
  return folders.filter(f => !f.hidden);  // Exclude hidden folders
}

// Generate filter configuration
function generateFilterSuggestions(folders) {
  console.log('\n📋 Suggested view_filters configuration:\n');
  console.log('```yaml');
  console.log('    view_filters:');
  console.log('      - label: "📍 Homepage Only"');
  console.log('        field: folderId');
  console.log('        pattern: false');
  console.log('      - label: "📁 All in Folders"');
  console.log('        field: folderId');
  console.log("        pattern: '.+'");

  // Group by parent
  const topLevel = folders
    .filter(f => !f.parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const children = folders.filter(f => f.parentId);

  // Add top-level folder filters
  topLevel.forEach(folder => {
    const emoji = getEmojiForFolder(folder.id);
    console.log(`      - label: "${emoji} ${folder.name} (All)"`);
    console.log('        field: folderId');
    console.log(`        pattern: '^${folder.id}'`);
  });

  // Add child folder filters
  children.forEach(child => {
    const parent = topLevel.find(f => f.id === child.parentId);
    if (parent) {
      console.log(`      - label: "🗓️ ${parent.name} › ${child.name}"`);
      console.log('        field: folderId');
      console.log(`        pattern: '^${child.id}$'`);
    }
  });

  console.log('```\n');
  console.log('📝 Copy the above configuration and paste it into:');
  console.log('   - public/admin/config.yml (for Pages collection)');
  console.log('   - public/admin/config.yml (for Images collection)\n');
}

// Print current folders
function printCurrentFolders(folders) {
  console.log('\n📁 Current folder structure:\n');

  const topLevel = folders.filter(f => !f.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const children = folders.filter(f => f.parentId);

  topLevel.forEach(folder => {
    const emoji = getEmojiForFolder(folder.id);
    console.log(`${emoji} ${folder.name} (${folder.id})`);

    const childFolders = children.filter(c => c.parentId === folder.id);
    childFolders.forEach((child, idx) => {
      const isLast = idx === childFolders.length - 1;
      const prefix = isLast ? '└─' : '├─';
      console.log(`  ${prefix} ${child.name} (${child.id})`);
    });
  });
  console.log();
}

// Run the script
try {
  console.log('🔍 Reading folders from', FOLDERS_DIR);
  const folders = getAllFolders();
  console.log(`✓ Found ${folders.length} folders\n`);

  printCurrentFolders(folders);
  generateFilterSuggestions(folders);

  console.log('💡 Tip: Run this script whenever you add new folders to get updated filter suggestions');
  console.log('   Command: npm run cms:suggest-filters\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
