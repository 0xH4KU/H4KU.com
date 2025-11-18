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
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_SOURCE = path.join(ROOT_DIR, 'public', 'content');
const OPTIMIZED_OUTPUT_ROOT = path.join(CONTENT_SOURCE, '_optimized');
const OPTIMIZED_PUBLIC_PREFIX = '/content/_optimized';
const OUTPUT_FOLDERS = path.join(ROOT_DIR, 'src', 'content', 'folders');
const OUTPUT_IMAGES = path.join(ROOT_DIR, 'src', 'content', 'images');
const OUTPUT_PAGES = path.join(ROOT_DIR, 'src', 'content', 'pages');
const CACHE_DIR = path.join(ROOT_DIR, '.cache');
const BACKUP_ROOT = path.join(CACHE_DIR, 'cms-backups');

// Supported file extensions
const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
];
const TEXT_EXTENSIONS = ['.txt', '.md'];

const HTTP_OR_DATA_PROTOCOL = /^(https?:|data:)/i;

const toPublicPath = absolutePath => {
  const relativePath = path.relative(CONTENT_SOURCE, absolutePath);
  if (relativePath.startsWith('..')) {
    return null;
  }
  return `/content/${relativePath.replace(/\\/g, '/')}`;
};

const resolveAssetReference = (baseDir, targetPath) => {
  if (typeof targetPath !== 'string') {
    return null;
  }

  const trimmed = targetPath.trim();
  if (!trimmed) {
    return null;
  }

  if (HTTP_OR_DATA_PROTOCOL.test(trimmed)) {
    return {
      publicPath: trimmed,
      filePath: null,
    };
  }

  if (trimmed.startsWith('/content/')) {
    const relativePath = trimmed.replace(/^\/content\//, '');
    return {
      publicPath: trimmed,
      filePath: path.join(CONTENT_SOURCE, relativePath),
    };
  }

  if (trimmed.startsWith('/')) {
    return {
      publicPath: trimmed,
      filePath: null,
    };
  }

  const absoluteCandidate = path.resolve(baseDir, trimmed);
  const publicPath = toPublicPath(absoluteCandidate);
  if (!publicPath) {
    return {
      publicPath: trimmed,
      filePath: null,
    };
  }

  return {
    publicPath,
    filePath: absoluteCandidate,
  };
};

const markFileConsumed = (consumedSet, filePath) => {
  if (!filePath) {
    return;
  }
  consumedSet.add(path.resolve(filePath));
};

const findSiblingAsset = (baseDir, basename, extension) => {
  const candidatePath = path.join(baseDir, `${basename}${extension}`);
  if (!fs.existsSync(candidatePath)) {
    return null;
  }

  const publicPath = toPublicPath(candidatePath);
  if (!publicPath) {
    return null;
  }

  return {
    publicPath,
    filePath: candidatePath,
  };
};

const normalizeMetadataSources = (rawSources, baseDir, consumedSet) => {
  if (!Array.isArray(rawSources)) {
    return null;
  }

  const normalized = [];

  rawSources.forEach(source => {
    if (!source || typeof source !== 'object') {
      return;
    }
    const resolved = resolveAssetReference(baseDir, source.srcSet);
    if (!resolved?.publicPath) {
      return;
    }

    normalized.push({
      type: typeof source.type === 'string' ? source.type : undefined,
      srcSet: resolved.publicPath,
      media: typeof source.media === 'string' ? source.media : undefined,
    });

    if (resolved.filePath) {
      markFileConsumed(consumedSet, resolved.filePath);
    }
  });

  return normalized.length > 0 ? normalized : null;
};

const isGeneratableSource = extension =>
  extension === '.png' || extension === '.jpg' || extension === '.jpeg';

const buildOptimizedPath = (relativeDir, basename, format) => {
  const safeDir = relativeDir ? relativeDir.replace(/\\/g, '/') : '';
  const targetDir = path.join(OPTIMIZED_OUTPUT_ROOT, safeDir);
  const filename = `${basename}.${format}`;
  const filePath = path.join(targetDir, filename);
  const publicPath = `${OPTIMIZED_PUBLIC_PREFIX}/${safeDir}/${filename}`.replace(
    /\/{2,}/g,
    '/'
  );
  return { filePath, publicPath, targetDir };
};

const ensureOptimizedVariant = async ({
  inputPath,
  relativeDir,
  basename,
  format,
}) => {
  const { filePath, publicPath, targetDir } = buildOptimizedPath(
    relativeDir,
    basename,
    format
  );

  if (fs.existsSync(filePath)) {
    return publicPath;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const quality =
    format === 'avif'
      ? { quality: 45, speed: 6 }
      : { quality: 82, effort: 5 };

  await sharp(inputPath)
    .rotate()
    .toFormat(format, quality)
    .toFile(filePath);

  return publicPath;
};

const collectAlternateFormats = async ({
  baseDir,
  basename,
  extension,
  itemMeta,
  consumedSet,
  sourcePath,
  relativeDir,
}) => {
  const alternates = {
    avif: null,
    webp: null,
    sources: null,
  };

  const metaAvif = resolveAssetReference(baseDir, itemMeta?.avif);
  if (metaAvif) {
    alternates.avif = metaAvif.publicPath;
    markFileConsumed(consumedSet, metaAvif.filePath);
  } else if (extension !== '.avif') {
    const siblingAvif = findSiblingAsset(baseDir, basename, '.avif');
    if (siblingAvif) {
      alternates.avif = siblingAvif.publicPath;
      markFileConsumed(consumedSet, siblingAvif.filePath);
    }
  }

  const metaWebp = resolveAssetReference(baseDir, itemMeta?.webp);
  if (metaWebp) {
    alternates.webp = metaWebp.publicPath;
    markFileConsumed(consumedSet, metaWebp.filePath);
  } else if (extension !== '.webp') {
    const siblingWebp = findSiblingAsset(baseDir, basename, '.webp');
    if (siblingWebp) {
      alternates.webp = siblingWebp.publicPath;
      markFileConsumed(consumedSet, siblingWebp.filePath);
    }
  }

  const allowGeneration =
    itemMeta?.generateAlternates === undefined ||
    itemMeta?.generateAlternates === true;

  if (
    allowGeneration &&
    isGeneratableSource(extension) &&
    fs.existsSync(sourcePath)
  ) {
    try {
      if (!alternates.avif) {
        alternates.avif = await ensureOptimizedVariant({
          inputPath: sourcePath,
          relativeDir,
          basename,
          format: 'avif',
        });
      }
      if (!alternates.webp) {
        alternates.webp = await ensureOptimizedVariant({
          inputPath: sourcePath,
          relativeDir,
          basename,
          format: 'webp',
        });
      }
    } catch (error) {
      console.warn(
        `⚠️  Failed to generate WebP/AVIF for ${basename}${extension}:`,
        error?.message ?? error
      );
    }
  }

  alternates.sources = normalizeMetadataSources(
    itemMeta?.sources,
    baseDir,
    consumedSet
  );

  return alternates;
};

function throwReadableFsError(action, targetPath, error) {
  const code = error && typeof error === 'object' ? error.code : null;
  if (code === 'EACCES' || code === 'EPERM') {
    const reason = error?.message ?? 'permission denied';
    throw new Error(
      `\n🚫 CMS could not ${action} "${targetPath}" due to insufficient permissions.\n` +
        'Fix the directory/file permissions or rerun the sync with the appropriate access.\n' +
        `Original error: ${reason}`
    );
  }

  throw error;
}

// Ensure output directories exist
function ensureDirectories() {
  [OUTPUT_FOLDERS, OUTPUT_IMAGES, OUTPUT_PAGES, OPTIMIZED_OUTPUT_ROOT].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sourcePath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}
const cleanOptimizedOutput = () => {
  if (fs.existsSync(OPTIMIZED_OUTPUT_ROOT)) {
    fs.rmSync(OPTIMIZED_OUTPUT_ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(OPTIMIZED_OUTPUT_ROOT, { recursive: true });
};

function createBackup() {
  const backupPath = path.join(BACKUP_ROOT, `backup-${Date.now()}`);

  copyDirectory(OUTPUT_FOLDERS, path.join(backupPath, 'folders'));
  copyDirectory(OUTPUT_IMAGES, path.join(backupPath, 'images'));
  copyDirectory(OUTPUT_PAGES, path.join(backupPath, 'pages'));

  return backupPath;
}

function restoreBackup(backupPath) {
  if (!backupPath || !fs.existsSync(backupPath)) {
    return;
  }

  console.log('\n⏪ Restoring CMS output from backup...');
  cleanDirectory(OUTPUT_FOLDERS);
  cleanDirectory(OUTPUT_IMAGES);
  cleanDirectory(OUTPUT_PAGES);

  copyDirectory(path.join(backupPath, 'folders'), OUTPUT_FOLDERS);
  copyDirectory(path.join(backupPath, 'images'), OUTPUT_IMAGES);
  copyDirectory(path.join(backupPath, 'pages'), OUTPUT_PAGES);
}

function removeBackup(backupPath) {
  if (backupPath && fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
  }
}

// Clean output directories
function cleanOutputDirectories() {
  console.log('🧹 Cleaning output directories...');

  [OUTPUT_FOLDERS, OUTPUT_IMAGES, OUTPUT_PAGES].forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
            return;
          }
          if (stats.isFile()) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          throwReadableFsError('remove', filePath, error);
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
      console.warn(
        `⚠️  Failed to parse metadata in ${dirPath}:`,
        error.message
      );
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
async function scanDirectory(
  dirPath,
  currentPath = [],
  parentId = null,
  consumedFiles = new Set()
) {
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
  for (const [index, dir] of subdirs.entries()) {
    const subDirPath = path.join(dirPath, dir.name);
    const subPath = [...currentPath, dir.name];
    const folderId = generateFolderId(subPath);

    // Read folder's own metadata
    const subMetadata = readMetadata(subDirPath);
    const folderMeta = subMetadata?.folder || {};
    const folderName = folderMeta.name || dir.name;
    const folderDesc = folderMeta.description;
    const folderOrder =
      folderMeta.order !== undefined ? folderMeta.order : index + 1;

    // Create folder definition
    const folder = {
      id: folderId,
      name: folderName,
      type: 'folder',
      parentId: parentId,
      order: folderOrder,
    };

    if (folderDesc) {
      folder.description = folderDesc;
    }

    folders.push(folder);

    // Recursively scan subdirectory
    const subResults = await scanDirectory(
      subDirPath,
      subPath,
      folderId,
      consumedFiles
    );
    folders.push(...subResults.folders);
    works.push(...subResults.works);
    pages.push(...subResults.pages);
  }

  // Process files in current directory
  const files = entries.filter(
    entry => entry.isFile() && entry.name !== 'metadata.json'
  );

  for (const [index, file] of files.entries()) {
    const filename = file.name;
    const basename = path.basename(filename, path.extname(filename));
    const filePath = path.join(dirPath, filename);
    const resolvedFilePath = path.resolve(filePath);
    if (consumedFiles.has(resolvedFilePath)) {
      return;
    }
    const relativePath = path.relative(CONTENT_SOURCE, filePath);
    const publicPath = '/content/' + relativePath.replace(/\\/g, '/');

    // Get item metadata
    const itemMeta = metadata?.items?.[filename] || {};
    const itemId =
      currentPath.length > 0
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
        full: publicPath,
      };

      const extension = getExtension(filename);
      const relativeDir = path
        .relative(CONTENT_SOURCE, dirPath)
        .replace(/\\/g, '/');
      const alternates = await collectAlternateFormats({
        baseDir: dirPath,
        basename,
        extension,
        itemMeta,
        consumedSet: consumedFiles,
        sourcePath: filePath,
        relativeDir,
      });

      if (alternates.avif) {
        work.avif = alternates.avif;
      }
      if (alternates.webp) {
        work.webp = alternates.webp;
      }
      if (alternates.sources) {
        work.sources = alternates.sources;
      }

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
        content: content,
      };

      if (itemMeta.title) {
        page.title = itemMeta.title;
      }

      const orderValue =
        itemMeta.order !== undefined ? itemMeta.order : index + 1;

      if (parentId) {
        // Text file inside a folder - treat as a folder-scoped page
        page.folderId = parentId;
        page.order = orderValue;
      }

      // Persist all text files under the pages collection so the aggregator
      // can attach them to folders later.
      pages.push(page);
    }
  }

  return { folders, works, pages };
}

// Write JSON file
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Main function
async function main() {
  console.log('🚀 Starting CMS content sync...\n');

  // Ensure directories exist
  ensureDirectories();
  cleanOptimizedOutput();

  // Clean existing files
  cleanOutputDirectories();

  // Scan content directory
  console.log('📂 Scanning content directory...');
  const homepagePath = path.join(CONTENT_SOURCE, 'homepage');

  if (!fs.existsSync(homepagePath)) {
    const error = new Error(
      'public/content/homepage directory not found. Create it and add content.'
    );
    throw error;
  }

  const results = await scanDirectory(homepagePath, [], null, new Set());

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

// Auto-run build-data after CMS sync
async function runBuildData() {
  console.log('\n🔄 Running data aggregation...');
  try {
    const buildDataPath = path.join(__dirname, 'build-data.js');
    const { execSync } = await import('child_process');
    execSync(`node "${buildDataPath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to run build-data.js:', error.message);
    console.log('   Refer to the validation errors above.');
    throw error;
  }
}

// Run main function
async function run() {
  ensureDirectories();
  const backupPath = createBackup();

  try {
    await main();
    await runBuildData();
    removeBackup(backupPath);
    console.log('\n✨ All done! Your content is ready.\n');
  } catch (error) {
    restoreBackup(backupPath);
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run();
