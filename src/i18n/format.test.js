// src/i18n/format.test.js
import { describe, expect, test } from 'vitest';
import { formatDuration, formatRelativeDate } from './format.js';

describe('formatDuration', () => {
  test('formats whole minutes', () => {
    expect(formatDuration(1200, 'es')).toBe('20 min');
    expect(formatDuration(1200, 'en')).toBe('20 min');
  });

  test('rounds to nearest minute', () => {
    expect(formatDuration(90, 'es')).toBe('2 min');
  });
});

describe('formatRelativeDate', () => {
  const now = new Date('2026-06-14T12:00:00.000Z');

  test('formats same-day as relative hours in es', () => {
    const earlier = new Date('2026-06-14T10:00:00.000Z');
    expect(formatRelativeDate(earlier, 'es', now)).toContain('hace');
  });

  test('formats days ago in en', () => {
    const past = new Date('2026-06-12T12:00:00.000Z');
    expect(formatRelativeDate(past, 'en', now)).toBe('2 days ago');
  });
});
