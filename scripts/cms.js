#!/usr/bin/env node

/**
 * CMS Content Sync Script
 * 
 * Scans public/content/ directory and generates configuration files:
 * - src/content/folders/*.json (folder definitions)
 * - src/content/images/*.json (image items and work files)
 * - src/content/pages/*.json (text pages)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_SOURCE = path.join(ROOT_DIR, 'public', 'content');
const OUTPUT_FOLDERS = path.join(ROOT_DIR, 'src', 'content', 'folders');
const OUTPUT_IMAGES = path.join(ROOT_DIR, 'src', 'content', 'images');
const OUTPUT_PAGES = path.join(ROOT_DIR, 'src', 'content', 'pages');

// Supported file extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
const TEXT_EXTENSIONS = ['.txt', '.md'];

// Ensure output directories exist
function ensureDirectories() {
  [OUTPUT_FOLDERS, OUTPUT_IMAGES, OUTPUT_PAGES].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Clean output directories
function cleanOutputDirectories() {
  console.log('🧹 Cleaning output directories...');
  
  [OUTPUT_FOLDERS, OUTPUT_IMAGES, OUTPUT_PAGES].forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });
}

// Read metadata.json from a directory
function readMetadata(dirPath) {
  const metadataPath = path.join(dirPath, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️  Failed to parse metadata in ${dirPath}:`, error.message);
      return null;
    }
  }
  return null;
}

// Generate folder ID from path
function generateFolderId(pathSegments) {
  return pathSegments.join('-');
}

// Get file extension
function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

// Check if file is an image
function isImage(filename) {
  return IMAGE_EXTENSIONS.includes(getExtension(filename));
}

// Check if file is a text file
function isTextFile(filename) {
  return TEXT_EXTENSIONS.includes(getExtension(filename));
}

// Scan directory and collect folders and files
function scanDirectory(dirPath, currentPath = [], parentId = null) {
  const folders = [];
  const works = [];
  const pages = [];
  
  if (!fs.existsSync(dirPath)) {
    return { folders, works, pages };
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const metadata = readMetadata(dirPath);
  
  // Process subdirectories (folders)
  const subdirs = entries.filter(entry => entry.isDirectory());
  subdirs.forEach((dir, index) => {
    const subDirPath = path.join(dirPath, dir.name);
    const subPath = [...currentPath, dir.name];
    const folderId = generateFolderId(subPath);
    
    // Read folder's own metadata
    const subMetadata = readMetadata(subDirPath);
    const folderMeta = subMetadata?.folder || {};
    const folderName = folderMeta.name || dir.name;
    const folderDesc = folderMeta.description;
    const folderOrder = folderMeta.order !== undefined ? folderMeta.order : index + 1;
    
    // Create folder definition
    const folder = {
      id: folderId,
      name: folderName,
      type: 'folder',
      parentId: parentId,
      order: folderOrder
    };
    
    if (folderDesc) {
      folder.description = folderDesc;
    }
    
    folders.push(folder);
    
    // Recursively scan subdirectory
    const subResults = scanDirectory(subDirPath, subPath, folderId);
    folders.push(...subResults.folders);
    works.push(...subResults.works);
    pages.push(...subResults.pages);
  });
  
  // Process files in current directory
  const files = entries.filter(entry => 
    entry.isFile() && 
    entry.name !== 'metadata.json'
  );
  
  files.forEach((file, index) => {
    const filename = file.name;
    const basename = path.basename(filename, path.extname(filename));
    const filePath = path.join(dirPath, filename);
    const relativePath = path.relative(CONTENT_SOURCE, filePath);
    const publicPath = '/content/' + relativePath.replace(/\\/g, '/');
    
    // Get item metadata
    const itemMeta = metadata?.items?.[filename] || {};
    const itemId = currentPath.length > 0 
      ? `${generateFolderId(currentPath)}-${basename}`
      : basename.toLowerCase();
    
    if (isImage(filename)) {
      // Create work item
      const work = {
        id: itemId,
        filename: filename,
        folderId: parentId,
        itemType: 'work',
        thumb: publicPath,
        full: publicPath
      };
      
      if (itemMeta.title) work.title = itemMeta.title;
      if (itemMeta.description) work.description = itemMeta.description;
      if (itemMeta.date) work.date = itemMeta.date;
      if (itemMeta.tags) work.tags = itemMeta.tags;
      if (itemMeta.order !== undefined) {
        work.order = itemMeta.order;
      } else {
        work.order = index + 1;
      }
      
      works.push(work);
      
    } else if (isTextFile(filename)) {
      // Read text content
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Create page item
      const page = {
        id: itemId,
        filename: filename,
        content: content
      };
      
      if (itemMeta.title) {
        page.title = itemMeta.title;
      }
      
      if (parentId) {
        // Text file inside a folder - treat as work item
        page.itemType = 'page';
        page.folderId = parentId;
        if (itemMeta.order !== undefined) {
          page.order = itemMeta.order;
        } else {
          page.order = index + 1;
        }
        works.push(page);
      } else {
        // Text file at homepage level - treat as standalone page
        pages.push(page);
      }
    }
  });
  
  return { folders, works, pages };
}

// Write JSON file
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Main function
function main() {
  console.log('🚀 Starting CMS content sync...\n');
  
  // Ensure directories exist
  ensureDirectories();
  
  // Clean existing files
  cleanOutputDirectories();
  
  // Scan content directory
  console.log('📂 Scanning content directory...');
  const homepagePath = path.join(CONTENT_SOURCE, 'homepage');
  
  if (!fs.existsSync(homepagePath)) {
    console.error('❌ Error: public/content/homepage directory not found!');
    console.log('   Please create the directory and add your content there.');
    process.exit(1);
  }
  
  const results = scanDirectory(homepagePath);
  
  // Write folder definitions
  console.log(`\n📁 Found ${results.folders.length} folders`);
  results.folders.forEach(folder => {
    const filename = `${folder.id}.json`;
    const filePath = path.join(OUTPUT_FOLDERS, filename);
    writeJson(filePath, folder);
    console.log(`   ✓ ${filename}`);
  });
  
  // Write image items
  console.log(`\n🖼️  Found ${results.works.length} image items`);
  results.works.forEach(work => {
    const filename = `${work.id}.json`;
    const filePath = path.join(OUTPUT_IMAGES, filename);
    writeJson(filePath, work);
    console.log(`   ✓ ${filename}`);
  });
  
  // Write pages
  console.log(`\n📄 Found ${results.pages.length} pages`);
  results.pages.forEach(page => {
    const filename = `${page.id}.json`;
    const filePath = path.join(OUTPUT_PAGES, filename);
    writeJson(filePath, page);
    console.log(`   ✓ ${filename}`);
  });
  
  console.log('\n✨ Content sync completed successfully!\n');
}

// Run main function
try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
