import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

// Guards js-yaml upgrades: every hand-edited data file must parse to exactly the same
// value, and the citations writer (scripts/update-citations.ts) must serialise the same.
// citations.yml is rewritten weekly by a bot, so only its shape is pinned.
const dataDir = join(process.cwd(), 'src/data');
const files = readdirSync(dataDir)
  .filter((f) => f.endsWith('.yml') && f !== 'citations.yml')
  .sort();

describe('src/data YAML', () => {
  it.each(files)('%s parses to the snapshot', (file) => {
    const data = yaml.load(readFileSync(join(dataDir, file), 'utf8'));
    expect(data).toMatchSnapshot();
  });

  it('citations.yml maps ids to non-negative integers', () => {
    const data = yaml.load(readFileSync(join(dataDir, 'citations.yml'), 'utf8'));
    expect(data).toBeTypeOf('object');
    const entries = Object.entries(data as Record<string, unknown>);
    expect(entries.length).toBeGreaterThan(0);
    for (const [id, count] of entries) {
      expect(id).toMatch(/\S/);
      expect(Number.isInteger(count) && (count as number) >= 0).toBe(true);
    }
  });

  it('dump with the update-citations options keeps its format', () => {
    const fixture = { 'b:paper-2': 1200, 'a:paper-1': 7, 'c:long id with spaces': 0 };
    expect(yaml.dump(fixture, { lineWidth: -1, sortKeys: true })).toMatchSnapshot();
  });
});
