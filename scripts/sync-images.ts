#!/usr/bin/env tsx

/**
 * ⚠️ DEPRECATED: This script is deprecated
 *
 * This project now uses Decap CMS for content management.
 * All content should be managed through the CMS at /admin/
 *
 * This script is kept for reference and emergency backup purposes only.
 * Do not use it unless you understand it will overwrite CMS-managed content!
 */

console.warn('⚠️  WARNING: This script is DEPRECATED!');
console.warn('This project now uses Decap CMS for content management.');
console.warn('Visit https://lum-bio-mh2.pages.dev/admin/ to manage content.');
console.warn('');
console.warn('Running this script will OVERWRITE all CMS-managed content!');
console.warn('Press Ctrl+C within 5 seconds to cancel...');
console.warn('');

// Wait 5 seconds before continuing
await new Promise(resolve => setTimeout(resolve, 5000));

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WorkItem {
  id: string;
  filename: string;
  thumb: string;
  full: string;
  date: string;
  dimensions?: string;
  title?: string;
  description?: string;
  tags?: string[];
  client?: string;
}

interface FolderMetadata {
  [filename: string]: {
    title?: string;
    description?: string;
    tags?: string[];
    client?: string;
    dimensions?: string;
  };
}

interface Folder {
  id: string;
  name: string;
  type: 'folder';
  children?: Folder[];
  items?: WorkItem[];
}

const WORKS_DIR = path.join(__dirname, '../src/assets/works');
const OUTPUT_FILE = path.join(__dirname, '../src/data/mockData.ts');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

const ASSET_PLACEHOLDER_PREFIX = '__ASSET__';
const ASSET_PLACEHOLDER_SUFFIX = '__';

const assetImports = new Map<string, string>();

function registerAsset(importPath: string): string {
  const existing = assetImports.get(importPath);
  if (existing) {
    return existing;
  }

  const identifier = `asset${assetImports.size + 1}`;
  assetImports.set(importPath, identifier);
  return identifier;
}

function createAssetPlaceholder(identifier: string): string {
  return `${ASSET_PLACEHOLDER_PREFIX}${identifier}${ASSET_PLACEHOLDER_SUFFIX}`;
}

function replaceAssetPlaceholders(content: string): string {
  const placeholderRegex = new RegExp(
    `"${ASSET_PLACEHOLDER_PREFIX}(asset\\d+)${ASSET_PLACEHOLDER_SUFFIX}"`,
    'g',
  );
  return content.replace(placeholderRegex, (_, identifier: string) => identifier);
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function getFilesInDirectory(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath).filter((file) => {
      const fullPath = path.join(dirPath, file);
      return fs.statSync(fullPath).isFile() && isImageFile(file);
    });
  } catch (error) {
    return [];
  }
}

function loadMetadata(dirPath: string): FolderMetadata {
  const metadataPath = path.join(dirPath, '_metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    } catch (error) {
      console.warn(`⚠️  Failed to parse metadata in ${dirPath}`);
      return {};
    }
  }
  return {};
}

function getImageDimensions(imagePath: string): string | undefined {
  // For now, return undefined. We can add image-size library later if needed.
  // This keeps dependencies minimal.
  return undefined;
}

function getFileDate(filePath: string): string {
  const stats = fs.statSync(filePath);
  const date = stats.mtime;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function generateWorkItems(dirPath: string, folderId: string): WorkItem[] {
  const files = getFilesInDirectory(dirPath);
  const metadata = loadMetadata(dirPath);
  const items: WorkItem[] = [];

  files.forEach((filename, index) => {
    const fullPath = path.join(dirPath, filename);
    const relativePath = path.relative(
      path.join(__dirname, '../src'),
      fullPath
    );
    const importPath = `@/${relativePath.replace(/\\/g, '/')}`;
    const assetIdentifier = registerAsset(importPath);
    const assetPlaceholder = createAssetPlaceholder(assetIdentifier);

    const fileMeta = metadata[filename] || {};
    const itemId = `${folderId}_${index + 1}`;

    items.push({
      id: itemId,
      filename,
      thumb: assetPlaceholder,
      full: assetPlaceholder,
      date: getFileDate(fullPath),
      dimensions: fileMeta.dimensions || getImageDimensions(fullPath),
      title: fileMeta.title,
      description: fileMeta.description,
      tags: fileMeta.tags,
      client: fileMeta.client,
    });
  });

  return items;
}

function scanFolder(folderPath: string, folderId: string, folderName: string): Folder {
  const folder: Folder = {
    id: folderId,
    name: folderName,
    type: 'folder',
  };

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const subfolders: Folder[] = [];

  // Check for subfolders
  entries.forEach((entry) => {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const subfolderId = `${folderId}-${entry.name.toLowerCase().replace(/\s+/g, '-')}`;
      const subfolderPath = path.join(folderPath, entry.name);
      subfolders.push(scanFolder(subfolderPath, subfolderId, entry.name));
    }
  });

  // Get images in current folder
  const items = generateWorkItems(folderPath, folderId);

  if (subfolders.length > 0) {
    folder.children = subfolders;
  }

  if (items.length > 0) {
    folder.items = items;
  }

  return folder;
}

function generateMockData(): string {
  const rootFolders: Folder[] = [];

  // Scan top-level folders in works directory
  const entries = fs.readdirSync(WORKS_DIR, { withFileTypes: true });

  entries.forEach((entry) => {
    if (entry.isDirectory()) {
      const folderPath = path.join(WORKS_DIR, entry.name);
      const folderId = entry.name.toLowerCase().replace(/\s+/g, '-');
      rootFolders.push(scanFolder(folderPath, folderId, entry.name));
    }
  });

  // Generate TypeScript file
  const importStatements = Array.from(assetImports.entries())
    .map(([importPath, identifier]) => `import ${identifier} from '${importPath}';`)
    .join('\n');

  const foldersContent = replaceAssetPlaceholders(
    JSON.stringify(rootFolders, null, 2),
  );

  const output = `import { MockData } from '@/types';
${importStatements ? `${importStatements}\n` : ''}

export const mockData: MockData = {
  folders: ${foldersContent},
  pages: [
    {
      id: 'about',
      name: 'About.txt',
      type: 'txt',
      content: \`ABOUT
════════════════════════

Lum (@lummuu_)
Freelance illustrator

Anime-style illustrations
Character design
Digital art

Available for commissions\`,
    },
    {
      id: 'contact',
      name: 'Contact.txt',
      type: 'txt',
      content: \`CONTACT
════════════════════════

Email: hi@lum.bio

For commissions and inquiries,
please reach out via email or
use the contact form.

Response time: 1-2 business days\`,
    },
  ],
  socials: [
    { name: 'Instagram', code: 'IG', url: 'https://instagram.com/lummuu_' },
    { name: 'Twitter', code: 'TW', url: 'https://twitter.com/lummuu_' },
    { name: 'Email', code: 'EM', url: 'mailto:hi@lum.bio' },
  ],
};
`;

  return output;
}

// Main execution
console.log('🔍 Scanning images in assets/works...');

if (!fs.existsSync(WORKS_DIR)) {
  console.error('❌ Works directory not found:', WORKS_DIR);
  process.exit(1);
}

const mockDataContent = generateMockData();

fs.writeFileSync(OUTPUT_FILE, mockDataContent, 'utf-8');

console.log('✅ mockData.ts has been updated successfully!');
console.log('📁 Scanned folders:', fs.readdirSync(WORKS_DIR).filter(f =>
  fs.statSync(path.join(WORKS_DIR, f)).isDirectory()
).join(', '));
