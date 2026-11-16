import { describe, expect, it } from 'vitest';

import { buildDate, formatDate, isoDate, shortDate } from './date';

describe('formatDate', () => {
  it('formats a Date object to "Month Day, Year"', () => {
    const d = new Date('2024-01-15T12:00:00.000Z');
    expect(formatDate(d)).toMatch(/January 15, 2024/);
  });

  it('accepts an ISO date string', () => {
    expect(formatDate('2024-06-01')).toMatch(/2024/);
  });

  it('accepts a timestamp number', () => {
    const ts = new Date('2024-01-01T00:00:00.000Z').getTime();
    expect(formatDate(ts)).toMatch(/2024/);
  });

  it('accepts custom Intl.DateTimeFormat options', () => {
    const result = formatDate('2024-03-15', { year: 'numeric', month: 'short' });
    expect(result).toMatch(/Mar 2024/);
  });

  it('uses en-US locale', () => {
    // en-US should produce "Month Day, Year" not "Day Month Year"
    const result = formatDate(new Date('2024-06-15T12:00:00.000Z'));
    expect(result).toMatch(/June/);
  });
});

describe('isoDate', () => {
  it('returns an ISO 8601 string from a Date', () => {
    const d = new Date('2024-06-01T00:00:00.000Z');
    expect(isoDate(d)).toBe('2024-06-01T00:00:00.000Z');
  });

  it('accepts an ISO date string', () => {
    const result = isoDate('2024-06-01');
    expect(result).toMatch(/^2024-06-01T/);
  });

  it('accepts a timestamp number', () => {
    const ts = new Date('2024-01-01T00:00:00.000Z').getTime();
    expect(isoDate(ts)).toMatch(/^2024-01-01T/);
  });
});

describe('shortDate', () => {
  it('returns "Mon YYYY" format', () => {
    const d = new Date('2024-03-15T12:00:00.000Z');
    expect(shortDate(d)).toMatch(/Mar 2024/);
  });

  it('accepts a date string', () => {
    expect(shortDate('2024-11-01')).toMatch(/Nov 2024/);
  });
});

describe('buildDate', () => {
  it('uses SOURCE_DATE_EPOCH when set', () => {
    expect(buildDate({ SOURCE_DATE_EPOCH: '1767225600' }).toISOString()).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });

  it('falls back to the current time when unset or invalid', () => {
    const before = Date.now();
    for (const env of [{}, { SOURCE_DATE_EPOCH: '' }, { SOURCE_DATE_EPOCH: 'soon' }]) {
      const t = buildDate(env).getTime();
      expect(t).toBeGreaterThanOrEqual(before);
      expect(t).toBeLessThanOrEqual(Date.now());
    }
  });
});
