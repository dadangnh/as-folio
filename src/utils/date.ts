/**
 * Format a Date (or date string / timestamp) for display.
 *
 * @param date - Input date
 * @param opts - Intl.DateTimeFormat options (defaults to full: e.g. "January 1, 2025")
 * @returns Formatted string
 */
export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', opts);
}

/**
 * Format a date as ISO 8601 (for datetime attributes).
 */
export function isoDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString();
}

/**
 * Format a date as a short label, e.g. "Jan 2025".
 */
export function shortDate(date: Date | string | number): string {
  return formatDate(date, { year: 'numeric', month: 'short' });
}

/**
 * The "current" date for build-time output (footer year, "last updated", sitemap).
 *
 * Honours the reproducible-builds convention `SOURCE_DATE_EPOCH` (Unix seconds) so a
 * build can be pinned to a fixed date — the visual regression suite uses this so its
 * baselines do not change when the calendar year does. Falls back to the real clock.
 *
 * @param env - Environment to read (defaults to `process.env`)
 */
export function buildDate(env: Record<string, string | undefined> = process.env): Date {
  const epoch = env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) return new Date(Number(epoch) * 1000);
  return new Date();
}
