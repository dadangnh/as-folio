/**
 * Lightweight BibTeX parser for as-folio.
 *
 * Handles the common entry types and custom fields used in the publications page.
 * Supports nested braces in values and LaTeX-encoded characters.
 */

export interface BibEntry {
  /** Entry type: article, inproceedings, book, phdthesis, misc, etc. */
  type: string;
  /** Citation key (e.g. einstein1905). */
  key: string;
  /** All parsed fields, lower-cased. Values have outer braces/quotes stripped. */
  fields: Record<string, string>;
}

/**
 * Find the position of the matching closing brace, respecting nesting.
 * Starts scanning from `from` (exclusive — assumes char at `from` is already '{').
 */
function matchingBrace(src: string, from: number): number {
  let depth = 1;
  let i = from + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return depth === 0 ? i - 1 : -1;
}

/**
 * Parse a BibTeX string into an array of entries.
 * Comments (`% ...`) and `@string` / `@preamble` directives are ignored.
 */
export function parseBibtex(src: string): BibEntry[] {
  const entries: BibEntry[] = [];

  // Remove line comments
  const cleaned = src.replace(/%[^\n]*/g, '');

  // Find all @type{ positions
  const entryPattern = /@(\w+)\s*\{/g;
  const matches = [...cleaned.matchAll(entryPattern)];

  for (const m of matches) {
    const type = m[1].toLowerCase();
    const openBrace = (m.index ?? 0) + m[0].length - 1;
    const closeBrace = matchingBrace(cleaned, openBrace);
    if (closeBrace === -1) continue;

    const body = cleaned.slice(openBrace + 1, closeBrace);

    // Skip @string and @preamble
    if (type === 'string' || type === 'preamble' || type === 'comment') continue;

    // Extract citation key (first token before the first comma)
    const keyMatch = body.match(/^\s*([\w:-]+)\s*,/);
    if (!keyMatch) {
      if (import.meta.env.DEV) {
        console.warn(`[as-folio] BibTeX: could not parse citation key in @${type} entry — skipped`);
      }
      continue;
    }
    const key = keyMatch[1];
    const fieldsStr = body.slice(keyMatch[0].length);

    const fields: Record<string, string> = {};
    let pos = 0;

    while (pos < fieldsStr.length) {
      // Skip whitespace and commas
      while (pos < fieldsStr.length && /[\s,]/.test(fieldsStr[pos])) pos++;
      if (pos >= fieldsStr.length) break;

      // Field name
      const nameMatch = fieldsStr.slice(pos).match(/^([\w-]+)\s*=/);
      if (!nameMatch) break;
      const fieldName = nameMatch[1].toLowerCase();
      pos += nameMatch[0].length;

      // Skip whitespace
      while (pos < fieldsStr.length && /\s/.test(fieldsStr[pos])) pos++;

      // Field value — braces, quotes, or bare number
      let value: string;
      if (fieldsStr[pos] === '{') {
        const end = matchingBrace(fieldsStr, pos);
        if (end === -1) break;
        value = fieldsStr.slice(pos + 1, end);
        pos = end + 1;
      } else if (fieldsStr[pos] === '"') {
        const end = fieldsStr.indexOf('"', pos + 1);
        if (end === -1) break;
        value = fieldsStr.slice(pos + 1, end);
        pos = end + 1;
      } else {
        // Bare value (number or macro)
        const bareMatch = fieldsStr.slice(pos).match(/^([^,}\s]+)/);
        if (!bareMatch) break;
        value = bareMatch[1];
        pos += bareMatch[0].length;
      }

      fields[fieldName] = value.trim();
    }

    entries.push({ type, key, fields });
  }

  return entries;
}

// ─── Field accessors ──────────────────────────────────────────────────────────

/** Get the publication year as a number. */
export function getYear(entry: BibEntry): number {
  return parseInt(entry.fields.year ?? '0', 10);
}

/** Get formatted authors string: "First Last, First Last, ..." */
export function getAuthors(entry: BibEntry): string {
  const raw = entry.fields.author ?? '';
  if (!raw) return '';
  return raw
    .split(/\s+and\s+/i)
    .map((a) => {
      const trimmed = a.trim();
      // "Last, First" → "First Last"
      if (trimmed.includes(',')) {
        const [last, first] = trimmed.split(',').map((s) => s.trim());
        return `${first} ${last}`.trim();
      }
      return trimmed;
    })
    .join(', ');
}

/** Get the venue (journal, booktitle, publisher, howpublished). */
export function getVenue(entry: BibEntry): string {
  return (
    entry.fields.journal ??
    entry.fields.booktitle ??
    entry.fields.publisher ??
    entry.fields.howpublished ??
    ''
  );
}

/** Get title with LaTeX braces stripped (e.g. {Word} → Word). */
export function getTitle(entry: BibEntry): string {
  return (entry.fields.title ?? '').replace(/[{}]/g, '');
}

/** Get a boolean custom field (returns true if value is 'true'). */
export function getBoolField(entry: BibEntry, field: string): boolean {
  return entry.fields[field]?.toLowerCase() === 'true';
}

// ─── Clean BibTeX output ──────────────────────────────────────────────────────

/**
 * as-folio display-only fields that should be excluded from the copyable
 * BibTeX citation block. These are template metadata, not standard BibTeX.
 */
export const BIBTEX_INTERNAL_FIELDS = new Set([
  'abbr',
  'abstract',
  'additional_info',
  'altmetric',
  'annotation',
  'award',
  'award_name',
  'bibtex_show',
  'blog',
  'code',
  'dimensions',
  'google_scholar_id',
  'html',
  'inspirehep_id',
  'pdf',
  'poster',
  'preview',
  'selected',
  'slides',
  'supp',
  'video',
  'website',
]);

/**
 * Build a clean BibTeX citation string with as-folio internal fields removed.
 * Use this whenever displaying or copying citations to end users.
 */
export function getCleanBibtex(entry: BibEntry): string {
  const fields = Object.entries(entry.fields)
    .filter(([k]) => !BIBTEX_INTERNAL_FIELDS.has(k))
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(',\n');
  return `@${entry.type}{${entry.key},\n${fields}\n}`;
}
