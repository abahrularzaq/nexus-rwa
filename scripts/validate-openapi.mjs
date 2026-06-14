import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const specPath = process.argv[2] ?? 'docs/openapi.yaml';
const spec = readFileSync(specPath, 'utf8');
const errors = [];

function requirePattern(label, pattern) {
  if (!pattern.test(spec)) {
    errors.push(`Missing or invalid ${label}`);
  }
}

function requireSnippet(label, snippet) {
  if (!spec.includes(snippet)) {
    errors.push(`Missing ${label}: ${snippet}`);
  }
}

requirePattern('OpenAPI version 3.1.x', /^openapi:\s*3\.1\.\d+\s*$/m);
requirePattern('info.title', /^info:\n(?:[\s\S]*?)^\s{2}title:\s+Nexus RWA API\s*$/m);

const requiredPaths = [
  '/health:',
  '/v1/market/overview:',
  '/v1/market/brief:',
  '/v1/assets:',
  '/v1/assets/{slug}:',
  '/v1/search:',
  '/v1/assets/{slug}/full:',
  '/v1/assets/{slug}/history:',
  '/v1/assets/{slug}/risk:',
  '/v1/assets/{slug}/sources:',
  '/v1/assets/{slug}/insight:',
  '/v1/analytics/bulk:',
  '/v1/export:',
  '/v1/ask:',
];

for (const path of requiredPaths) {
  requireSnippet('path', `  ${path}`);
}

const requiredSecuritySchemes = [
  'ApiKeyAuth:',
  'WalletAddressAuth:',
  'PaymentAuth:',
  'PaymentTxAuth:',
  'name: X-API-Key',
  'name: X-Wallet-Address',
  'name: X-Payment',
  'name: X-Payment-Tx',
];

for (const scheme of requiredSecuritySchemes) {
  requireSnippet('security scheme', scheme);
}

const requiredResponses = [
  'Unauthorized:',
  'PaymentRequired:',
  'NotFound:',
  'RateLimited:',
  "'200':",
  "'401':",
  "'402':",
  "'404':",
  "'429':",
];

for (const response of requiredResponses) {
  requireSnippet('response status/component', response);
}

const requiredExamples = [
  'HealthOk:',
  'MarketOverviewOk:',
  'MarketBriefOk:',
  'AssetsListOk:',
  'AssetOk:',
  'SearchOk:',
  'AssetFullOk:',
  'HistoryOk:',
  'RiskOk:',
  'SourcesOk:',
  'InsightOk:',
  'BulkOk:',
  'ExportOk:',
  'UnauthorizedError:',
  'PaymentRequiredError:',
  'NotFoundError:',
  'RateLimitedError:',
];

for (const example of requiredExamples) {
  requireSnippet('example', example);
}

const pathCount = requiredPaths.filter((path) => spec.includes(`  ${path}`)).length;

// If Ruby is available, use Psych as an additional YAML syntax check without
// adding a Node dependency. This repository already used the same check during
// initial OpenAPI authoring, but the requirement-level checks above are the
// source of truth for this script.
const ruby = spawnSync(
  'ruby',
  [
    '-e',
    "require 'yaml'; d=YAML.load_file(ARGV[0]); abort('OpenAPI root must be a mapping') unless d.is_a?(Hash); puts [d['openapi'], d.fetch('paths', {}).length].join(' ')",
    specPath,
  ],
  { encoding: 'utf8' },
);

if (ruby.error && ruby.error.code !== 'ENOENT') {
  errors.push(`Ruby YAML check failed to start: ${ruby.error.message}`);
} else if (ruby.status !== 0 && !ruby.error) {
  errors.push(`YAML syntax check failed: ${ruby.stderr.trim() || ruby.stdout.trim()}`);
}

if (errors.length > 0) {
  console.error(`OpenAPI validation failed for ${specPath}:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`OpenAPI validation passed for ${specPath}`);
console.log(`Required paths documented: ${pathCount}/${requiredPaths.length}`);
if (!ruby.error) {
  console.log(`YAML parse check: ${ruby.stdout.trim()}`);
} else {
  console.log('YAML parse check: skipped because Ruby is not installed');
}
