#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const DEFAULT_TARGET = path.join('src', 'content', '_aggregated.json');

const serializePayload = payload => JSON.stringify(payload ?? null);

const normalizeExpected = value =>
  typeof value === 'string' && value.length > 0 ? value : null;

const computeIntegrityHash = payload => {
  const input = serializePayload(payload);
  let hash = FNV_OFFSET;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
};

const computeSHA256Hash = payload =>
  crypto
    .createHash('sha256')
    .update(serializePayload(payload))
    .digest('hex');

const verifyIntegrityDual = (payload, expectedFNV, expectedSHA256) => {
  const fnvActual = computeIntegrityHash(payload);
  const shaActual = computeSHA256Hash(payload);

  const fnvExpected = normalizeExpected(expectedFNV);
  const shaExpected = normalizeExpected(expectedSHA256);

  const fnv1a = {
    expected: fnvExpected,
    actual: fnvActual,
    isValid: fnvExpected !== null && fnvExpected === fnvActual,
    algorithm: 'fnv1a',
  };
  const sha256 = {
    expected: shaExpected,
    actual: shaActual,
    isValid: shaExpected !== null && shaExpected === shaActual,
    algorithm: 'sha256',
  };

  return {
    fnv1a,
    sha256,
    isFullyValid: fnv1a.isValid && sha256.isValid,
  };
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  let file = DEFAULT_TARGET;
  let write = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--write' || arg === '-w') {
      write = true;
      continue;
    }
    if (arg.startsWith('--file=')) {
      file = arg.replace('--file=', '');
      continue;
    }
    if (arg === '--file' && args[i + 1]) {
      file = args[i + 1];
      i += 1;
    }
  }

  return {
    file: path.resolve(process.cwd(), file),
    write,
  };
};

const log = message => {
  console.log(`[integrity] ${message}`);
};

const main = () => {
  const { file, write } = parseArgs();

  if (!fs.existsSync(file)) {
    console.error(`[integrity] File not found: ${file}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, 'utf-8');
  const aggregated = JSON.parse(raw);
  const payload = {
    folders: aggregated.folders ?? [],
    images: aggregated.images ?? [],
    pages: aggregated.pages ?? [],
    socials: aggregated.socials ?? [],
  };

  const expectedFnv =
    typeof aggregated._integrity === 'string'
      ? aggregated._integrity
      : null;
  const expectedSha =
    typeof aggregated._integritySHA256 === 'string'
      ? aggregated._integritySHA256
      : null;

  const result = verifyIntegrityDual(payload, expectedFnv, expectedSha);

  log(`Checking ${path.relative(process.cwd(), file)}`);
  log(
    `Legacy checksum (FNV-1a): ${expectedFnv ?? 'missing'} -> ${result.fnv1a.actual}`
  );
  log(
    `SHA-256 checksum: ${expectedSha ?? 'missing'} -> ${result.sha256.actual}`
  );

  if (result.isFullyValid) {
    log('✅ Integrity verified – no action needed.');
    return;
  }

  if (!write) {
    log(
      '❌ Integrity mismatch detected. Re-run with --write to update both hashes.'
    );
    process.exit(2);
  }

  log('⚠️ Updating checksum...');
  const updated = {
    ...aggregated,
    _integrity: computeIntegrityHash(payload),
    _integritySHA256: computeSHA256Hash(payload),
  };
  fs.writeFileSync(file, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8');
  log('✅ Checksum updated.');
};

try {
  main();
} catch (error) {
  console.error('[integrity] Unexpected error:', error);
  process.exit(1);
}
