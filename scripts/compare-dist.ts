#!/usr/bin/env bun
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

export type DistDiff = {
  onlyInA: string[];
  onlyInB: string[];
  changed: string[];
};

/**
 * Normalizes HTML content by stripping build-specific hashes from asset URLs.
 * Hashes are 8-char [A-Za-z0-9_-] tokens before .js/.css, and /_s/<8>.css.
 */
export function normalizeHtml(html: string): string {
  // Normalize /_s/[A-Za-z0-9_-]{8}\.css -> /_s/[HASH].css
  let normalized = html.replace(/\/_s\/[A-Za-z0-9_-]{8}\.css/g, '/_s/[HASH].css');

  // Normalize tokens like .[A-Za-z0-9_-]{8}\.(js|css)
  normalized = normalized.replace(/\.[A-Za-z0-9_-]{8}\.(js|css)/g, '.[HASH].$1');

  return normalized;
}

/**
 * Normalize an asset filename or path by removing 8-char hash tokens.
 */
export function normalizeAssetPath(filePath: string): string {
  // For _s/<hash>.css -> _s/[HASH].css
  let norm = filePath.replace(/_s\/[A-Za-z0-9_-]{8}\.css/g, '_s/[HASH].css');
  norm = norm.replace(/\.[A-Za-z0-9_-]{8}\.(js|css)/g, '.[HASH].$1');
  return norm;
}

/**
 * Recursively list all files in dir relative to dir, forward-slash normalized.
 */
function getAllFiles(dir: string, baseDir = dir): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const rel = path.relative(baseDir, fullPath).split(path.sep).join('/');
      results.push(rel);
    }
  }
  return results;
}

/**
 * Check whether a file relative path is under _astro/ or _s/ or remote optimized images.
 */
function isPresenceOnlyAsset(relPath: string): boolean {
  if (relPath.startsWith('_astro/') || relPath.startsWith('_s/')) {
    return true;
  }
  return false;
}

/** Pseudo-entry reported in `changed` when any CSS bundle content differs. */
export const CSS_BUNDLES_ENTRY = '[css bundles]';

function cssDigests(dist: string, assets: Set<string>): string {
  return [...assets]
    .filter((f) => f.endsWith('.css'))
    .map((f) =>
      createHash('sha256')
        .update(fs.readFileSync(path.join(dist, f)))
        .digest('hex'),
    )
    .sort()
    .join(',');
}

/**
 * Compares two build output directories.
 */
export function compareDist(distA: string, distB: string): DistDiff {
  const filesA = getAllFiles(distA).filter((f) => !f.startsWith('pagefind/'));
  const filesB = getAllFiles(distB).filter((f) => !f.startsWith('pagefind/'));

  const filesASet = new Set(filesA);
  const filesBSet = new Set(filesB);

  // Separate presence-only asset files vs regular files
  const regularFilesA = new Set<string>();
  const assetFilesA = new Set<string>();
  for (const f of filesA) {
    if (isPresenceOnlyAsset(f)) {
      assetFilesA.add(f);
    } else {
      regularFilesA.add(f);
    }
  }

  const regularFilesB = new Set<string>();
  const assetFilesB = new Set<string>();
  for (const f of filesB) {
    if (isPresenceOnlyAsset(f)) {
      assetFilesB.add(f);
    } else {
      regularFilesB.add(f);
    }
  }

  // Map normalized asset paths to presence
  const normAssetA = new Map<string, string[]>();
  for (const f of assetFilesA) {
    const norm = normalizeAssetPath(f);
    if (!normAssetA.has(norm)) normAssetA.set(norm, []);
    normAssetA.get(norm)!.push(f);
  }

  const normAssetB = new Map<string, string[]>();
  for (const f of assetFilesB) {
    const norm = normalizeAssetPath(f);
    if (!normAssetB.has(norm)) normAssetB.set(norm, []);
    normAssetB.get(norm)!.push(f);
  }

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const changed: string[] = [];

  // Check regular files in A
  for (const file of regularFilesA) {
    if (!regularFilesB.has(file)) {
      onlyInA.push(file);
    } else {
      // Both exist: check content (HTML normalized, everything else byte-for-byte)
      if (file.endsWith('.html')) {
        const contentA = fs.readFileSync(path.join(distA, file), 'utf-8');
        const contentB = fs.readFileSync(path.join(distB, file), 'utf-8');
        if (normalizeHtml(contentA) !== normalizeHtml(contentB)) {
          changed.push(file);
        }
      } else {
        const bufA = fs.readFileSync(path.join(distA, file));
        const bufB = fs.readFileSync(path.join(distB, file));
        if (!bufA.equals(bufB)) {
          changed.push(file);
        }
      }
    }
  }

  // Check regular files only in B
  for (const file of regularFilesB) {
    if (!regularFilesA.has(file)) {
      onlyInB.push(file);
    }
  }

  // Compare presence-only asset files by normalized name
  for (const [norm, origs] of normAssetA.entries()) {
    if (!normAssetB.has(norm)) {
      onlyInA.push(...origs);
    }
  }
  for (const [norm, origs] of normAssetB.entries()) {
    if (!normAssetA.has(norm)) {
      onlyInB.push(...origs);
    }
  }

  // Non-JS/CSS assets (optimised images, fonts) keep a stable name across builds because
  // Astro hashes their *inputs*, so an encoder change would not rename them: compare bytes.
  for (const [norm, origsA] of normAssetA.entries()) {
    const origsB = normAssetB.get(norm);
    if (!origsB || origsA.length !== 1 || origsB.length !== 1) continue;
    if (/\.(js|css)$/.test(origsA[0])) continue;
    const a = fs.readFileSync(path.join(distA, origsA[0]));
    const b = fs.readFileSync(path.join(distB, origsB[0]));
    if (!a.equals(b)) changed.push(origsB[0]);
  }

  // CSS bundles have hash-only names that cannot be paired across builds, so compare
  // the multiset of their content digests instead: any stylesheet change is reported.
  if (cssDigests(distA, assetFilesA) !== cssDigests(distB, assetFilesB)) {
    changed.push(CSS_BUNDLES_ENTRY);
  }

  onlyInA.sort();
  onlyInB.sort();
  changed.sort();

  return { onlyInA, onlyInB, changed };
}

function printUnifiedDiff(file: string, pathA: string, pathB: string): void {
  const isHtml = file.endsWith('.html');
  const rawA = fs.existsSync(pathA) ? fs.readFileSync(pathA, 'utf-8') : '';
  const rawB = fs.existsSync(pathB) ? fs.readFileSync(pathB, 'utf-8') : '';
  const normA = isHtml ? normalizeHtml(rawA) : rawA;
  const normB = isHtml ? normalizeHtml(rawB) : rawB;

  const linesA = normA.split('\n');
  const linesB = normB.split('\n');

  console.log(`--- A/${file}`);
  console.log(`+++ B/${file}`);

  let i = 0;
  let j = 0;
  while (i < linesA.length || j < linesB.length) {
    if (i < linesA.length && j < linesB.length && linesA[i] === linesB[j]) {
      i++;
      j++;
    } else {
      if (i < linesA.length) {
        console.log(`- ${linesA[i]}`);
        i++;
      }
      if (j < linesB.length) {
        console.log(`+ ${linesB[j]}`);
        j++;
      }
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);
  let showRelPath: string | null = null;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--show' && i + 1 < args.length) {
      showRelPath = args[i + 1];
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  if (positional.length < 2) {
    console.error('Usage: scripts/compare-dist.ts [--show <relpath>] <distA> <distB>');
    process.exit(1);
  }

  const [distA, distB] = positional;

  if (showRelPath) {
    printUnifiedDiff(showRelPath, path.join(distA, showRelPath), path.join(distB, showRelPath));
    return;
  }

  const diff = compareDist(distA, distB);

  let hasDiff = false;
  if (diff.onlyInA.length > 0) {
    hasDiff = true;
    console.log(`Only in ${distA}:`);
    for (const f of diff.onlyInA) {
      console.log(`  - ${f}`);
    }
  }

  if (diff.onlyInB.length > 0) {
    hasDiff = true;
    console.log(`Only in ${distB}:`);
    for (const f of diff.onlyInB) {
      console.log(`  + ${f}`);
    }
  }

  if (diff.changed.length > 0) {
    hasDiff = true;
    console.log('Changed files:');
    for (const f of diff.changed) {
      console.log(`  M ${f}`);
    }
  }

  if (hasDiff) {
    process.exit(1);
  } else {
    console.log('No differences found.');
    process.exit(0);
  }
}

// Run CLI when executed directly
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  main();
}
