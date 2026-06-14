// src/i18n/format.js

// Whole-minute duration. "min" is the same token in es/en; other locales can
// override later via a key if needed.
export function formatDuration(seconds, lang) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${new Intl.NumberFormat(lang).format(minutes)} min`;
}

// Relative date ("hace 2 dias" / "2 days ago") via Intl.RelativeTimeFormat,
// choosing the coarsest sensible unit.
export function formatRelativeDate(date, lang, now = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const diffSeconds = Math.round((d.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const abs = Math.abs(diffSeconds);

  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  return rtf.format(Math.round(diffSeconds / 86400), 'day');
}
