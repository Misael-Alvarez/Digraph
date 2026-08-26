'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiagramModel, DiagramRecord } from '@/lib/domain';
import { renderThumbnail } from '@/lib/store/thumbnail';
import { useRepository, useRepositoryReady } from './RepositoryProvider';

/**
 * `pending` exists because the previous status model showed "Saved" both when
 * the document was written and when an edit was still sitting in the debounce
 * window. That reads as a guarantee the app had not yet made.
 */
export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';

/** How long after the last edit to write to storage. */
const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * How long between version snapshots.
 *
 * Snapshotting every autosave would bury the useful history under hundreds of
 * near-identical entries; one every few minutes of active editing gives a
 * timeline a person can actually read.
 */
const SNAPSHOT_INTERVAL_MS = 5 * 60_000;

export interface DiagramDocument {
  record: DiagramRecord | null;
  loading: boolean;
  /** Set when the id does not exist, so the page can offer a way back. */
  notFound: boolean;
  status: SaveStatus;
  save: (model: DiagramModel, options?: { immediate?: boolean; snapshot?: boolean }) => void;
  rename: (title: string) => Promise<void>;
  reload: () => Promise<void>;
}

/** Loads one diagram and keeps it saved as it changes. */
export function useDiagramDocument(id: string): DiagramDocument {
  const repository = useRepository();
  const ready = useRepositoryReady();

  const [record, setRecord] = useState<DiagramRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // A freshly loaded document is, by definition, saved.
  const [status, setStatus] = useState<SaveStatus>('saved');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<DiagramModel | null>(null);
  const lastSnapshot = useRef(0);

  /** Re-reads the record from storage. Safe to call from an event handler. */
  const load = useCallback(async () => {
    try {
      const found = await repository.get(id);
      setRecord(found);
      setNotFound(!found);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [repository, id]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    // Every state update happens in a `then` callback, never synchronously in
    // the effect body. The cancelled flag also stops a load that is still in
    // flight when the user navigates to another diagram from landing on this one.
    repository.get(id).then(
      (found) => {
        if (cancelled) return;
        setRecord(found);
        setNotFound(!found);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setNotFound(true);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [ready, repository, id]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flush = useCallback(async () => {
    const model = pending.current;
    if (!model) return;
    pending.current = null;

    const now = Date.now();
    const snapshot = now - lastSnapshot.current > SNAPSHOT_INTERVAL_MS;
    if (snapshot) lastSnapshot.current = now;

    setStatus('saving');
    try {
      const saved = await repository.save(id, model, { snapshot });
      const withThumbnail = await repository.updateMeta(id, {
        thumbnail: renderThumbnail(model),
      });
      setRecord({ ...withThumbnail, model: saved.model });
      setStatus('saved');
    } catch {
      // Keep the edit in hand so the next attempt can still write it.
      pending.current = model;
      setStatus('error');
    }
  }, [repository, id]);

  const save = useCallback<DiagramDocument['save']>(
    (model, options = {}) => {
      pending.current = model;
      if (timer.current) clearTimeout(timer.current);
      if (options.snapshot) lastSnapshot.current = 0;
      if (options.immediate) {
        void flush();
        return;
      }
      setStatus('pending');
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const rename = useCallback(
    async (title: string) => {
      const updated = await repository.updateMeta(id, { title });
      setRecord((current) => (current ? { ...current, title: updated.title } : updated));
    },
    [repository, id],
  );

  return { record, loading, notFound, status, save, rename, reload: load };
}
