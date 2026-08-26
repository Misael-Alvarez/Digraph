'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocalDiagramRepository, type DiagramRepository } from '@/lib/store';

interface RepositoryContextValue {
  repository: DiagramRepository;
  /** False until the one-shot import of the old localStorage autosave has run. */
  ready: boolean;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function useRepository(): DiagramRepository {
  const context = useContext(RepositoryContext);
  if (!context) throw new Error('useRepository must be used inside <RepositoryProvider>');
  return context.repository;
}

export function useRepositoryReady(): boolean {
  return useContext(RepositoryContext)?.ready ?? false;
}

/**
 * Provides the single I/O boundary of the app.
 *
 * The concrete implementation is chosen here and nowhere else, which is the
 * whole point: swapping IndexedDB for an API client is a change to this file.
 */
export function RepositoryProvider({ children }: { children: ReactNode }) {
  const repository = useMemo(() => new LocalDiagramRepository(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void repository
      .migrateLegacyAutosave(window.localStorage)
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const value = useMemo(() => ({ repository, ready }), [repository, ready]);
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}
