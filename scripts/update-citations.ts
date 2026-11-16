/**
 * update-citations.ts
 *
 * Fetches up-to-date citation counts for every publication that has both a
 * `doi` and a `google_scholar_id` field in papers.bib, then writes the results
 * to src/data/citations.yml.
 *
 * Citation counts come from the OpenAlex API (https://openalex.org) — a fully
 * open, no-auth scholarly graph. The counts are a close approximation to Google
 * Scholar's numbers and are updated within days of a new citation appearing.
 *
 * Usage:
 *   bun run citations:update
 *
 * Run automatically via the "Update Citations" GitHub Actions workflow (weekly).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as yaml from 'js-yaml';

import { parseBibtex } from '../src/utils/bibtex.ts';

// ─── Config ───────────────────────────────────────────────────────────────────

/** Delay (ms) between API requests — stays well within OpenAlex's rate limits. */
const REQUEST_DELAY_MS = 500;

/**
 * Contact email for OpenAlex's "polite pool" (higher rate limits, lower
 * chance of throttling). Replace with your own address before deploying.
 */
const POLITE_POOL_EMAIL = 'hello@example.com';

// ─── Paths ────────────────────────────────────────────────────────────────────

const root = process.cwd();
const bibPath = join(root, 'src/data/papers.bib');
const citationsPath = join(root, 'src/data/citations.yml');

// ─── OpenAlex fetch ───────────────────────────────────────────────────────────

interface OpenAlexWork {
  cited_by_count?: number;
  display_name?: string;
}

/**
 * Fetch the citation count for a paper from OpenAlex using its DOI.
 * Returns null on network failure or if the paper is not found.
 */
async function fetchCitationCount(doi: string): Promise<number | null> {
  const encoded = encodeURIComponent(`https://doi.org/${doi}`);
  const url = `https://api.openalex.org/works/${encoded}?select=cited_by_count,display_name`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': `as-folio/1.0 (mailto:${POLITE_POOL_EMAIL})`,
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`  ⚠ OpenAlex returned HTTP ${res.status} for DOI ${doi}`);
      return null;
    }
    const data = (await res.json()) as OpenAlexWork;
    return typeof data.cited_by_count === 'number' ? data.cited_by_count : null;
  } catch (err) {
    console.warn(`  ⚠ Network error for DOI ${doi}:`, err);
    return null;
  }
}

/** Sleep for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Parse BibTeX
  const bibRaw = readFileSync(bibPath, 'utf8');
  const entries = parseBibtex(bibRaw);

  // Find entries that have both a google_scholar_id and a doi
  const targets = entries.filter((e) => e.fields.google_scholar_id && e.fields.doi);

  if (targets.length === 0) {
    console.log('No entries with both google_scholar_id and doi found in papers.bib — nothing to update.');
    return;
  }

  // Load existing citations.yml to preserve any manually-set entries
  let existing: Record<string, number> = {};
  try {
    const raw = readFileSync(citationsPath, 'utf8');
    const parsed = yaml.load(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      existing = parsed as Record<string, number>;
    }
  } catch {
    // File may not exist yet — start fresh
  }

  const updated = { ...existing };
  let fetched = 0;
  let failed = 0;

  console.log(`\nFetching citation counts for ${targets.length} publication(s) via OpenAlex…\n`);

  for (const entry of targets) {
    const doi = entry.fields.doi!;
    const gid = entry.fields.google_scholar_id!;

    process.stdout.write(`  [${entry.key}] DOI: ${doi} … `);

    const count = await fetchCitationCount(doi);

    if (count !== null) {
      updated[gid] = count;
      console.log(`${count.toLocaleString()} citations`);
      fetched++;
    } else {
      console.log('not found — keeping existing value');
      failed++;
    }

    if (targets.indexOf(entry) < targets.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  // Write updated citations.yml
  const header = [
    '# Google Scholar citation counts for the publications page.',
    '#',
    '# Keys are google_scholar_id values from papers.bib.',
    '# Counts sourced from OpenAlex (https://openalex.org) — a close approximation',
    '# to Google Scholar citation counts, updated within days of a new citation.',
    '#',
    `# Last updated: ${new Date().toISOString().split('T')[0]}`,
    '# To refresh: bun run citations:update',
    '',
  ].join('\n');

  const body = yaml.dump(updated, { lineWidth: -1, sortKeys: true });
  writeFileSync(citationsPath, header + body, 'utf8');

  console.log(`\n✓ Updated ${citationsPath}`);
  console.log(`  ${fetched} fetched, ${failed} skipped (not in OpenAlex)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
