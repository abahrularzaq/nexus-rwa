#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['src', 'tests'];
const testFilePattern = /(?:^|[\\/]).+\.test\.ts$/u;

function collectTestFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return collectTestFiles(path);
    return testFilePattern.test(path) ? [path] : [];
  });
}

const testFiles = roots.flatMap(collectTestFiles).map((file) => relative(process.cwd(), file));

if (testFiles.length === 0) {
  console.log('No backend test files found; skipping node:test run.');
  process.exit(0);
}

const extraArgs = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...extraArgs, ...testFiles],
  { stdio: 'inherit' },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
