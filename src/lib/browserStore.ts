'use client';

import { useSyncExternalStore } from 'react';

/**
 * Reads a value out of `localStorage` without a hydration mismatch.
 *
 * `useSyncExternalStore` is the primitive for exactly this: the server renders
 * the fallback, the client swaps to the stored value during hydration, and no
 * effect has to call setState to make it happen.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Tells every hook reading local storage that something changed. */
export function notifyStoreChanged(): void {
  for (const listener of listeners) listener();
}

/** Cache keyed by raw string so the snapshot is referentially stable. */
const cache = new Map<string, { raw: string | null; value: unknown }>();

export function useStoredValue<T>(key: string, read: (raw: string | null) => T, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(key);
      } catch {
        return fallback;
      }
      const cached = cache.get(key);
      // getSnapshot must return the same reference for the same input, or React
      // will loop re-rendering.
      if (cached && cached.raw === raw) return cached.value as T;
      const value = read(raw);
      cache.set(key, { raw, value });
      return value;
    },
    () => fallback,
  );
}
