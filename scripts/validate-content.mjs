#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const contentRoot = path.join(repoRoot, 'src', 'content');

const foldersDir = path.join(contentRoot, 'folders');
const pagesDir = path.join(contentRoot, 'pages');
const worksDir = path.join(contentRoot, 'works');
const socialsDir = path.join(contentRoot, 'socials');

const errors = [];
const warnings = [];

const readJsonFile = async filePath => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON file ${relativePath(filePath)}: ${error.message}`);
  }
};

const readFrontmatterFile = async filePath => {
  const raw = await fs.readFile(filePath, 'utf8');
  if (!raw.startsWith('---')) {
    throw new Error(`Missing frontmatter in ${relativePath(filePath)}`);
  }
  const endIndex = raw.indexOf('\n---', 3);
  if (endIndex === -1) {
    throw new Error(`Unterminated frontmatter block in ${relativePath(filePath)}`);
  }
  const fm = raw.slice(3, endIndex).trim();
  try {
    return yaml.load(fm) ?? {};
  } catch (error) {
    throw new Error(`Failed to parse frontmatter in ${relativePath(filePath)}: ${error.message}`);
  }
};

const relativePath = targetPath => path.relative(repoRoot, targetPath);

const assertUnique = (value, map, message) => {
  if (!value) {
    return false;
  }
  if (map.has(value)) {
    errors.push(`${message} (already used in ${relativePath(map.get(value))})`);
    return false;
  }
  map.set(value, message.split(' ').pop());
  return true;
};

const collectFolders = async () => {
  const files = await fs.readdir(foldersDir);
  const folderMap = new Map();
  for (const file of files.filter(f => f.endsWith('.json'))) {
    const fullPath = path.join(foldersDir, file);
    const data = await readJsonFile(fullPath);
    if (!data.id) {
      errors.push(`Folder missing id: ${relativePath(fullPath)}`);
      continue;
    }
    if (folderMap.has(data.id)) {
      errors.push(
        `Duplicate folder id "${data.id}" in ${relativePath(fullPath)} (also in ${relativePath(
          folderMap.get(data.id)
        )})`
      );
    } else {
      folderMap.set(data.id, fullPath);
    }
  }
  return folderMap;
};

const validatePages = async folderMap => {
  const files = await fs.readdir(pagesDir);
  const ids = new Map();
  for (const file of files.filter(f => f.endsWith('.md'))) {
    const fullPath = path.join(pagesDir, file);
    let data;
    try {
      data = await readFrontmatterFile(fullPath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const id = data?.id;
    if (!id) {
      errors.push(`Page missing id: ${relativePath(fullPath)}`);
    } else if (ids.has(id)) {
      errors.push(
        `Duplicate page id "${id}" in ${relativePath(fullPath)} (also in ${relativePath(ids.get(id))})`
      );
    } else {
      ids.set(id, fullPath);
    }
    const folderId = data?.folderId;
    if (folderId && !folderMap.has(folderId)) {
      errors.push(
        `Page "${id ?? relativePath(fullPath)}" references missing folder "${folderId}" (${relativePath(
          fullPath
        )})`
      );
    }
  }
};

const validateWorks = async folderMap => {
  const files = await fs.readdir(worksDir);
  const ids = new Map();
  for (const file of files.filter(f => f.endsWith('.json'))) {
    const fullPath = path.join(worksDir, file);
    let data;
    try {
      data = await readJsonFile(fullPath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const { id, folderId, filename, date } = data;
    if (!id) {
      errors.push(`Work missing id: ${relativePath(fullPath)}`);
    } else if (ids.has(id)) {
      errors.push(
        `Duplicate work id "${id}" in ${relativePath(fullPath)} (also in ${relativePath(ids.get(id))})`
      );
    } else {
      ids.set(id, fullPath);
    }
    if (folderId && !folderMap.has(folderId)) {
      errors.push(
        `Work "${id ?? filename ?? relativePath(fullPath)}" references missing folder "${folderId}" (${relativePath(
          fullPath
        )})`
      );
    }
    if (!filename) {
      warnings.push(`Work missing filename (will break gallery display): ${relativePath(fullPath)}`);
    }
    if (!date) {
      warnings.push(`Work missing date (sorting may be inconsistent): ${relativePath(fullPath)}`);
    }
  }
};

const validateSocials = async () => {
  const files = await fs.readdir(socialsDir);
  const codes = new Map();
  for (const file of files.filter(f => f.endsWith('.json'))) {
    const fullPath = path.join(socialsDir, file);
    let data;
    try {
      data = await readJsonFile(fullPath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const code = data?.code;
    if (!code) {
      warnings.push(`Social link missing code: ${relativePath(fullPath)}`);
      continue;
    }
    if (codes.has(code)) {
      errors.push(
        `Duplicate social code "${code}" in ${relativePath(fullPath)} (also in ${relativePath(
          codes.get(code)
        )})`
      );
    } else {
      codes.set(code, fullPath);
    }
  }
};

const run = async () => {
  try {
    const folderMap = await collectFolders();
    await Promise.all([validatePages(folderMap), validateWorks(folderMap), validateSocials()]);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (warnings.length) {
    console.warn('Warnings:');
    for (const warning of warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  if (errors.length) {
    console.error('Errors:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log('Content validation passed ✔︎');
};

run();
