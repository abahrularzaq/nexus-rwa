import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const ASSET_DATA_ROOT = join(import.meta.dirname, '../data/asset');

export const ASSET_LAYER_FILES = [
  'identity.md',
  'reserve.md',
  'legal.md',
  'risk.md',
  'metadata.json',
  'scoring.json',
  'sources.yaml',
  'master.md',
] as const;

/** Optional — auto-sync layer; template placeholder only. */
export const ASSET_OPTIONAL_FILES = ['market.md'] as const;

export type AssetLayerFile = (typeof ASSET_LAYER_FILES)[number];

export function assetDirForSlug(slug: string): string {
  return join(ASSET_DATA_ROOT, slug);
}

export function assetFilePath(slug: string, file: AssetLayerFile): string {
  return join(assetDirForSlug(slug), file);
}

export function readAssetFile(slug: string, file: AssetLayerFile): string {
  const path = assetFilePath(slug, file);
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }
  return readFileSync(path, 'utf8');
}

export function readAssetJson<T>(slug: string, file: 'metadata.json' | 'scoring.json'): T {
  return JSON.parse(readAssetFile(slug, file)) as T;
}

/** Strip optional ``` fence and extract YAML-like frontmatter block. */
export function extractFrontmatterBlock(raw: string): string {
  let content = raw.trim();

  if (content.startsWith('```')) {
    const fenceEnd = content.indexOf('```', 3);
    if (fenceEnd !== -1) {
      content = content.slice(3, fenceEnd).trim();
    }
  }

  const open = content.startsWith('---') ? 3 : 0;
  if (open === 0) {
    throw new Error('Frontmatter must start with ---');
  }

  const afterOpen = content.slice(open).replace(/^\r?\n/, '');
  const closeMatch = afterOpen.match(/\r?\n(-{3,})\s*(?:\r?\n|$)/);
  if (!closeMatch || closeMatch.index == null) {
    throw new Error('Frontmatter closing --- not found');
  }

  return afterOpen.slice(0, closeMatch.index);
}

function unwrapMarkdownLink(value: string): string {
  const trimmed = value.trim();
  const linkMatch = trimmed.match(/^\[[^\]]*]\(([^)]+)\)$/);
  if (linkMatch) {
    return linkMatch[1]!.trim();
  }
  return trimmed.replace(/^["']|["']$/g, '');
}

function parseScalar(raw: string): unknown {
  const value = unwrapMarkdownLink(raw.trim());
  if (value === '' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Lightweight frontmatter parser for asset layer .md files.
 * Supports key: value, YAML lists (- / *), and nested maps (e.g. reserveBreakdown).
 */
export function parseFrontmatter(raw: string): Record<string, unknown> {
  const block = extractFrontmatterBlock(raw);
  const lines = block.split(/\r?\n/);
  const result: Record<string, unknown> = {};

  let currentKey: string | null = null;
  let currentArray: string[] | null = null;
  let currentObject: Record<string, unknown> | null = null;

  function flushArray(): void {
    if (currentKey && currentArray) {
      result[currentKey] = currentArray;
    }
    currentArray = null;
  }

  function flushObject(): void {
    if (currentKey && currentObject) {
      result[currentKey] = currentObject;
    }
    currentObject = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch && currentArray) {
      currentArray.push(parseScalar(listMatch[1]!) as string);
      continue;
    }

    const quotedKeyMatch = trimmed.match(/^"([^"]+)":\s*(.+)$/);
    if (quotedKeyMatch && currentObject) {
      currentObject[quotedKeyMatch[1]!] = parseScalar(quotedKeyMatch[2]!);
      continue;
    }

    const kvMatch = trimmed.match(/^([A-Za-z_][\w.]*):\s*(.*)$/);
    if (kvMatch) {
      flushArray();
      flushObject();

      const key = kvMatch[1]!;
      const rest = kvMatch[2] ?? '';

      if (rest === '') {
        currentKey = key;
        if (key === 'tags' || key === 'riskFactors' || key === 'mitigants') {
          currentArray = [];
        } else if (key === 'reserveBreakdown') {
          currentObject = {};
        } else {
          currentKey = key;
          result[key] = null;
        }
        continue;
      }

      currentKey = null;
      result[key] = parseScalar(rest);
      continue;
    }
  }

  flushArray();
  flushObject();

  return result;
}

export function parseAssetMarkdown(slug: string, file: 'identity.md' | 'reserve.md' | 'legal.md' | 'risk.md'): Record<string, unknown> {
  return parseFrontmatter(readAssetFile(slug, file));
}

/** Minimal YAML reader for sources.yaml (string values + simple nesting). */
export function parseSourcesYaml(raw: string): Record<string, unknown> {
  const lines = raw.split(/\r?\n/);
  const root: Record<string, unknown> = {};
  const stack: Array<{ indent: number; obj: Record<string, unknown> }> = [{ indent: -1, obj: root }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]!.obj;

    const listMatch = trimmed.match(/^-\s+(\w+):\s*(.*)$/);
    if (listMatch) {
      const itemKey = listMatch[1]!;
      const itemVal = parseScalar(listMatch[2]!);
      const arrKey = Object.keys(parent).find((k) => Array.isArray(parent[k])) ?? 'dataGaps';
      if (!Array.isArray(parent[arrKey])) {
        parent[arrKey] = [];
      }
      const entry: Record<string, unknown> = { [itemKey]: itemVal };
      (parent[arrKey] as unknown[]).push(entry);
      continue;
    }

    const kvMatch = trimmed.match(/^([\w]+):\s*(.*)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1]!;
    const rest = kvMatch[2] ?? '';

    if (rest === '') {
      const child: Record<string, unknown> = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
      continue;
    }

    parent[key] = parseScalar(rest);
  }

  return root;
}

export function loadSourcesYaml(slug: string): Record<string, unknown> {
  return parseSourcesYaml(readAssetFile(slug, 'sources.yaml'));
}

export type MetadataFile = {
  slug: string;
  isActive?: boolean;
  dataVersion?: number;
  externalIds?: Record<string, unknown>;
  blockchain?: Array<Record<string, unknown>>;
  yield?: Record<string, unknown>;
  liquidity?: Record<string, unknown>;
};

export type ScoringFile = {
  version?: number;
  assessmentDate?: string;
  assessmentMethod?: string;
  subScores?: {
    smartContract?: number;
    counterparty?: number;
    liquidity?: number;
    regulatory?: number;
    market?: number;
    concentration?: number;
  };
  overallScore?: number;
  overallLevel?: string;
};

export function loadAssetFileBundle(slug: string): {
  identity: Record<string, unknown>;
  reserve: Record<string, unknown>;
  legal: Record<string, unknown>;
  risk: Record<string, unknown>;
  metadata: MetadataFile;
  scoring: ScoringFile;
  sources: Record<string, unknown>;
} {
  return {
    identity: parseAssetMarkdown(slug, 'identity.md'),
    reserve: parseAssetMarkdown(slug, 'reserve.md'),
    legal: parseAssetMarkdown(slug, 'legal.md'),
    risk: parseAssetMarkdown(slug, 'risk.md'),
    metadata: readAssetJson<MetadataFile>(slug, 'metadata.json'),
    scoring: readAssetJson<ScoringFile>(slug, 'scoring.json'),
    sources: loadSourcesYaml(slug),
  };
}
