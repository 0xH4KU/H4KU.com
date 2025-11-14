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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env.production.local');

/**
 * Generate a unique build ID
 */
function generateBuildId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}`;
}

/**
 * Generate a cryptographic fingerprint for the build
 */
function generateBuildFingerprint() {
  const buildId = generateBuildId();
  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString();

  // Create a signature of the build environment
  const signature = crypto
    .createHash('sha256')
    .update(`${buildId}${timestamp}${process.env.USER || 'anonymous'}`)
    .digest('hex')
    .substring(0, 16);

  return {
    buildId,
    timestamp,
    dateStr,
    signature,
  };
}

/**
 * Inject fingerprint into environment variables
 */
function injectFingerprint() {
  const fingerprint = generateBuildFingerprint();

  console.log('🔐 Generating build fingerprint...\n');
  console.log(`   Build ID: ${fingerprint.buildId}`);
  console.log(`   Timestamp: ${fingerprint.dateStr}`);
  console.log(`   Signature: ${fingerprint.signature}`);

  // Read existing .env file if it exists
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf-8');

    // Remove old fingerprint entries
    envContent = envContent
      .split('\n')
      .filter(line => !line.startsWith('VITE_BUILD_'))
      .join('\n');
  }

  // Append new fingerprint
  const fingerprintVars = `
# Build Fingerprint (Auto-generated - DO NOT EDIT)
VITE_BUILD_ID=${fingerprint.buildId}
VITE_BUILD_TIMESTAMP=${fingerprint.timestamp}
VITE_BUILD_DATE=${fingerprint.dateStr}
VITE_BUILD_SIGNATURE=${fingerprint.signature}
`;

  envContent = (envContent.trim() + '\n' + fingerprintVars).trim() + '\n';

  // Write back to file
  fs.writeFileSync(ENV_FILE, envContent, 'utf-8');

  console.log(`\n✅ Fingerprint injected into ${ENV_FILE}`);
  console.log('   These variables will be embedded in the production build.\n');

  return fingerprint;
}

/**
 * Create a fingerprint manifest for record-keeping
 */
function createManifest(fingerprint) {
  const manifestPath = path.join(ROOT_DIR, '.build-manifest.json');

  let manifests = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifests = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (e) {
      console.warn('Warning: Could not parse existing manifest');
    }
  }

  manifests.push({
    ...fingerprint,
    buildHost: process.env.HOSTNAME || 'unknown',
    buildUser: process.env.USER || 'anonymous',
    nodeVersion: process.version,
  });

  // Keep only last 50 builds
  if (manifests.length > 50) {
    manifests = manifests.slice(-50);
  }

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(manifests, null, 2) + '\n',
    'utf-8'
  );

  console.log(`📝 Build manifest updated: ${manifestPath}\n`);
}

try {
  const fingerprint = injectFingerprint();
  createManifest(fingerprint);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
