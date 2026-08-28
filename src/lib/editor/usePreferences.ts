'use client';

import { useStoredValue } from '@/lib/browserStore';
import { PREFERENCES_KEY, readPreferences, type StoredPreferences } from './uiState';

/**
 * The stored preferences, read once for every screen outside the editor.
 *
 * There is deliberately a single reader for `PREFERENCES_KEY`: `useStoredValue`
 * caches its parsed snapshot per storage key, so two hooks reading the same key
 * with different parse functions hand each other the wrong value — which is how
 * the theme's `false` once arrived where the locale was expected and took the
 * whole page down. Selecting from one parsed object cannot do that.
 */
export function useStoredPreferences(): Partial<StoredPreferences> {
  return useStoredValue<Partial<StoredPreferences>>(
    PREFERENCES_KEY,
    (raw) => readPreferences({ getItem: () => raw }),
    {},
  );
}
