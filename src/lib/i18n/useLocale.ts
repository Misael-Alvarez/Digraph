'use client';

import { useCallback } from 'react';
import { PREFERENCES_KEY, readPreferences } from '@/lib/editor/uiState';
import { useStoredValue } from '@/lib/browserStore';
import { translate, type Locale, type MessageKey } from './messages';

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
  const locale = useStoredValue<Locale>(
    PREFERENCES_KEY,
    (raw) => readPreferences({ getItem: () => raw }).locale ?? 'es',
    'es',
  );

  const t = useCallback(
    (key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values),
    [locale],
  );

  return { locale, t };
}
