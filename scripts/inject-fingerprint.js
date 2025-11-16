#!/usr/bin/env node

/**
 * Fingerprint Injection Script
 *
 * Generates a unique build fingerprint and injects it into environment variables
 * for use during the build process. This creates a traceable identifier for
 * each build that can be used for legal enforcement if the code is stolen.
 *
 * Run this before vite build to embed fingerprints in the production bundle.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT_DIR, '.cache');
const BUILD_META_PATH = path.join(CACHE_DIR, 'build-meta.json');
const MANIFEST_PATH = path.join(CACHE_DIR, 'build-manifest.json');

const envSeedCandidates = [
  process.env.BUILD_FINGERPRINT_SEED,
  process.env.GIT_COMMIT_SHA,
  process.env.CI_COMMIT_SHA,
  process.env.CI_COMMIT_SHORT_SHA,
  process.env.GITHUB_SHA,
  process.env.VERCEL_GIT_COMMIT_SHA,
  process.env.NETLIFY_COMMIT_SHA,
  process.env.SOURCE_VERSION,
];

const envTimestampCandidates = [
  process.env.BUILD_FINGERPRINT_TIMESTAMP,
  process.env.GIT_COMMIT_TIMESTAMP,
  process.env.CI_COMMIT_TIMESTAMP,
  process.env.VERCEL_GIT_COMMIT_TIME,
  process.env.DEPLOY_TIMESTAMP,
];

/**
 * Generate a unique build ID
 */
function generateBuildId(seed) {
  return crypto
    .createHash('sha256')
    .update(seed)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Generate a cryptographic fingerprint for the build
 */
const firstTruthyString = candidates => {
  return candidates.find(
    value => typeof value === 'string' && value.trim().length > 0
  );
};

const normalizeTimestamp = value => {
  if (!value) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  // Most CI providers expose seconds. Convert to ms to match previous format.
  return numeric < 1e12 ? numeric * 1000 : numeric;
};

const safeExec = command => {
  try {
    const output = execSync(command, {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.toString().trim();
  } catch {
    return null;
  }
};

const resolveGitMetadata = () => {
  const sha = safeExec('git rev-parse HEAD');
  let timestamp = null;

  if (sha) {
    const raw = safeExec('git show -s --format=%ct HEAD');
    timestamp = normalizeTimestamp(raw);
  }

  return { sha, timestamp };
};

const resolveSeed = gitMeta => {
  const envSeed = firstTruthyString(envSeedCandidates);
  if (envSeed) {
    return { seed: envSeed.trim(), source: 'env' };
  }
  if (gitMeta.sha) {
    return { seed: gitMeta.sha, source: 'git' };
  }
  return {
    seed: `${process.env.USER || 'anonymous'}-${
      process.env.NODE_ENV || 'development'
    }`,
    source: 'fallback',
  };
};

const resolveTimestamp = gitMeta => {
  const envTimestamp = firstTruthyString(envTimestampCandidates);
  if (envTimestamp) {
    const normalized = normalizeTimestamp(envTimestamp);
    if (normalized) {
      return normalized;
    }
  }
  if (gitMeta.timestamp) {
    return gitMeta.timestamp;
  }
  return Date.now();
};

function generateBuildFingerprint() {
  const gitMeta = resolveGitMetadata();
  const { seed, source: seedSource } = resolveSeed(gitMeta);
  const timestamp = resolveTimestamp(gitMeta);
  const dateStr = new Date(timestamp).toISOString();

  const buildId = generateBuildId(seed);
  const signature = crypto
    .createHash('sha256')
    .update(`${seed}-${timestamp}`)
    .digest('hex')
    .substring(0, 16);

  return {
    buildId,
    timestamp,
    dateStr,
    signature,
    seed,
    seedSource,
    gitCommitSha: gitMeta.sha || null,
  };
}

/**
 * Ensure cache directory exists for build metadata
*/
const ensureCacheDir = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
};

/**
 * Create a fingerprint manifest for record-keeping
 */
function writeBuildMeta(fingerprint) {
  const meta = {
    ...fingerprint,
    environment:
      process.env.NODE_ENV === 'production' ? 'production' : 'development',
    buildHost: process.env.HOSTNAME || 'unknown',
    buildUser: process.env.USER || 'anonymous',
    nodeVersion: process.version,
  };

  ensureCacheDir();
  fs.writeFileSync(BUILD_META_PATH, JSON.stringify(meta, null, 2) + '\n');
  console.log(`\n🗂️  Build metadata written to ${BUILD_META_PATH}`);

  return meta;
}

function updateManifest(meta) {
  ensureCacheDir();
  let manifests = [];

  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifests = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch (e) {
      console.warn('Warning: Could not parse existing manifest');
    }
  }

  manifests.push(meta);

  // Keep only last 50 builds
  if (manifests.length > 50) {
    manifests = manifests.slice(-50);
  }

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(manifests, null, 2) + '\n',
    'utf-8'
  );

  console.log(`📝 Build manifest updated: ${MANIFEST_PATH}\n`);
}

try {
  const fingerprint = generateBuildFingerprint();

  console.log('🔐 Generating build fingerprint...\n');
  console.log(`   Build ID: ${fingerprint.buildId}`);
  console.log(`   Timestamp: ${fingerprint.dateStr}`);
  console.log(`   Signature: ${fingerprint.signature}`);
  console.log(`   Seed Source: ${fingerprint.seedSource}`);
  if (fingerprint.gitCommitSha) {
    console.log(`   Git SHA: ${fingerprint.gitCommitSha}`);
  }

  const meta = writeBuildMeta(fingerprint);
  updateManifest(meta);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
