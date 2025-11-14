#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { computeIntegrityHash } from '../src/utils/integrity';

type CliArgs = {
  file: string;
  write: boolean;
};

const DEFAULT_TARGET = path.join('src', 'content', '_aggregated.json');

const parseArgs = (): CliArgs => {
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

const log = (message: string) => {
  console.log(`[integrity] ${message}`);
};

function main() {
  const { file, write } = parseArgs();

  if (!fs.existsSync(file)) {
    console.error(`[integrity] File not found: ${file}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, 'utf-8');
  const aggregated = JSON.parse(raw) as Record<string, unknown>;
  const payload = {
    folders: aggregated.folders ?? [],
    works: aggregated.works ?? [],
    pages: aggregated.pages ?? [],
    socials: aggregated.socials ?? [],
  };

  const expected = typeof aggregated._integrity === 'string'
    ? (aggregated._integrity as string)
    : null;
  const actual = computeIntegrityHash(payload);

  log(`Checking ${path.relative(process.cwd(), file)}`);
  log(`Current checksum: ${expected ?? 'missing'}`);
  log(`Computed checksum: ${actual}`);

  if (expected === actual) {
    log('✅ Integrity verified – no action needed.');
    return;
  }

  if (!write) {
    log('❌ Integrity mismatch detected. Re-run with --write to update.');
    process.exit(2);
  }

  log('⚠️ Updating checksum...');
  const updated = { ...aggregated, _integrity: actual };
  fs.writeFileSync(file, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8');
  log('✅ Checksum updated.');
}

try {
  main();
} catch (error) {
  console.error('[integrity] Unexpected error:', error);
  process.exit(1);
}
