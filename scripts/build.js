#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BIN_EXT = process.platform === 'win32' ? '.cmd' : '';

const resolveViteStep = () => {
  const localVite = path.join(
    ROOT_DIR,
    'node_modules',
    '.bin',
    `vite${BIN_EXT}`
  );

  if (fs.existsSync(localVite)) {
    return {
      command: localVite,
      args: ['build'],
    };
  }

  // Fallback to npx if local binary is not available
  return {
    command: `npx${BIN_EXT}`.trim(),
    args: ['vite', 'build'],
  };
};

const viteStep = resolveViteStep();

const steps = [
  {
    id: 'cms',
    name: 'CMS content sync',
    command: 'node',
    args: [path.join(__dirname, 'cms.js')],
    skipEnv: 'SKIP_CMS',
    skipFlag: '--skip-cms',
  },
  {
    id: 'fingerprint',
    name: 'Fingerprint injection',
    command: 'node',
    args: [path.join(__dirname, 'inject-fingerprint.js')],
    skipEnv: 'SKIP_FINGERPRINT',
    skipFlag: '--skip-fingerprint',
  },
  {
    id: 'vite',
    name: 'Vite production build',
    command: viteStep.command,
    args: viteStep.args,
    skipEnv: 'SKIP_VITE',
    skipFlag: '--skip-vite',
  },
  {
    id: 'inline',
    name: 'Inline critical assets',
    command: 'node',
    args: [path.join(__dirname, 'inline-critical.js')],
    skipEnv: 'SKIP_INLINE',
    skipFlag: '--skip-inline',
  },
];

const cliArgs = process.argv.slice(2);
const cliFlags = new Set(cliArgs);

const isTruthy = value => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const normalizeStepId = value =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const parseListValue = value => {
  if (!value || typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map(segment => normalizeStepId(segment))
    .filter(Boolean);
};

const collectEnvList = keys =>
  keys.flatMap(key => parseListValue(process.env[key]));

const collectCliList = flag => {
  const prefix = `${flag}=`;
  return cliArgs
    .filter(arg => arg.startsWith(prefix))
    .flatMap(arg => parseListValue(arg.slice(prefix.length)));
};

const skipStepSet = new Set([
  ...collectEnvList(['SKIP_BUILD_STEPS', 'SKIP_STEPS']),
  ...collectCliList('--skip'),
]);

const onlyStepSet = new Set([
  ...collectEnvList(['ONLY_BUILD_STEPS', 'ONLY_STEPS']),
  ...collectCliList('--only'),
]);

const shouldSkip = step => {
  if (step.skipFlag && cliFlags.has(step.skipFlag)) {
    return true;
  }
  if (step.skipEnv && isTruthy(process.env[step.skipEnv] || '')) {
    return true;
  }

  const stepId = normalizeStepId(step.id);
  if (stepId) {
    if (onlyStepSet.size > 0 && !onlyStepSet.has(stepId)) {
      return true;
    }
    if (skipStepSet.has(stepId)) {
      return true;
    }
  }
  return false;
};

const runStep = step => {
  if (shouldSkip(step)) {
    console.log(`⚪ Skipping ${step.name}`);
    return;
  }

  console.log(`▶ ${step.name}`);
  const startedAt = Date.now();

  const result = spawnSync(step.command, step.args, {
    cwd: ROOT_DIR,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`${step.name} failed with exit code ${result.status}`);
  }

  const duration = Date.now() - startedAt;
  console.log(`✅ ${step.name} (${duration}ms)`);
};

try {
  const overallStart = Date.now();
  steps.forEach(runStep);
  const totalDuration = Date.now() - overallStart;
  console.log(`\n🎉 Build completed in ${totalDuration}ms`);
} catch (error) {
  console.error('\n❌ Build aborted:', error.message);
  process.exit(1);
}
