import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src', 'tests'];
const files = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
}

for (const root of roots) {
  try {
    if (statSync(root).isDirectory()) walk(root);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

files.sort();

if (files.length === 0) {
  console.error('No test files found under src or tests.');
  process.exit(1);
}

const passthroughArgs = process.argv.slice(2);
const nodeArgs = ['--import', 'tsx', ...passthroughArgs, ...files];
const result = spawnSync(process.execPath, nodeArgs, { stdio: 'inherit' });

if (result.error) throw result.error;
process.exit(result.status ?? 1);
