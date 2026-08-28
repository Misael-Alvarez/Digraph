'use client';

import { useCallback } from 'react';
import { useStoredPreferences } from '@/lib/editor/usePreferences';
import { LOCALES, translate, type Locale, type MessageKey } from './messages';

/**
 * The stored language, outside the editor's own state.
 *
 * Read after mount rather than during render: reading localStorage while
 * rendering would make the server and client markup disagree.
 */
export function useLocale(): {
  locale: Locale;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
} {
  const stored = useStoredPreferences().locale;
  // A value written by an older build — or by hand — must not be able to index
  // the catalogue with a language that is not in it.
  const locale: Locale = stored && LOCALES.includes(stored) ? stored : 'es';

  const t = useCallback(
    (key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values),
    [locale],
  );

  return { locale, t };
}
