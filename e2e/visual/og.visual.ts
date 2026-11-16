import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import defaultPlaywrightConfig from '../../playwright.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Default config isolation', () => {
  test('default config ignores visual suite', () => {
    const testIgnore = defaultPlaywrightConfig.testIgnore;
    let ignoresVisual = false;

    if (typeof testIgnore === 'string') {
      ignoresVisual = testIgnore === 'visual/**' || testIgnore.includes('visual/**');
    } else if (Array.isArray(testIgnore)) {
      ignoresVisual = testIgnore.some((item) =>
        typeof item === 'string' ? item.includes('visual/**') : item.test('visual/**'),
      );
    } else if (testIgnore instanceof RegExp) {
      ignoresVisual = testIgnore.test('visual/foo.ts');
    }

    expect(ignoresVisual).toBe(true);
  });
});

test.describe('Open Graph images', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop', 'OG images tested once on desktop');
  });

  const distOgDir = path.resolve(process.cwd(), 'dist', 'og');

  function collectPngFiles(dir: string, baseDir: string): { relPath: string; fullPath: string }[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files: { relPath: string; fullPath: string }[] = [];

    for (const entry of entries) {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(collectPngFiles(res, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.png')) {
        files.push({
          relPath: path.relative(baseDir, res),
          fullPath: res,
        });
      }
    }

    return files;
  }

  const ogFiles = collectPngFiles(distOgDir, distOgDir);

  // The per-file tests below are generated from dist/, so a missing or extra OG image would
  // silently change the test count. Pin the set itself against the committed baselines.
  test('OG image set matches the baselines', () => {
    test.skip(
      ['all', 'changed'].includes(test.info().config.updateSnapshots),
      'baselines are being regenerated',
    );
    const baselineDir = path.join(__dirname, '__screenshots__', 'desktop', 'og.visual.ts', 'og');
    const rel = (files: { relPath: string }[]) => files.map((f) => f.relPath).sort();
    expect(ogFiles.length).toBeGreaterThan(0);
    expect(rel(ogFiles)).toEqual(rel(collectPngFiles(baselineDir, baselineDir)));
  });

  for (const file of ogFiles) {
    const relSegments = file.relPath.split(path.sep);
    test(`og snapshot: ${file.relPath}`, () => {
      const buf = fs.readFileSync(file.fullPath);
      expect(buf).toMatchSnapshot(['og', ...relSegments]);
    });
  }
});
