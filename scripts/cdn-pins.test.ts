import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function findFiles(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('CDN pins', () => {
  it('every CDN URL pins an exact version', () => {
    const rootDir = path.resolve(__dirname, '..');
    const srcDir = path.join(rootDir, 'src');
    const extensions = ['.astro', '.md', '.mdx', '.ts', '.tsx'];
    const files = findFiles(srcDir, extensions);

    // Matches:
    // https://cdn.jsdelivr.net/npm/<pkg>@<spec>
    // https://unpkg.com/<pkg>@<spec>
    // Group 1: cdn host (cdn.jsdelivr.net/npm or unpkg.com)
    // Group 2: package name (e.g. chart.js, @org/pkg, vega-lite)
    // Group 3: specifier (version or tag, before any slash, quote, backtick, query, etc.)
    const cdnRegex = /https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com)\/((?:@[^/]+\/)?[^/@]+)@([^/"'`\s#?]+)/g;
    const semverRegex = /^\d+\.\d+\.\d+$/;

    const unpinned: { file: string; pkg: string; spec: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      let match: RegExpExecArray | null;
      while ((match = cdnRegex.exec(content)) !== null) {
        const pkg = match[1];
        const spec = match[2];
        if (!semverRegex.test(spec)) {
          const relPath = path.relative(rootDir, file);
          unpinned.push({ file: relPath, pkg, spec });
        }
      }
    }

    expect(unpinned).toEqual([]);
  });
});
