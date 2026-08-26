'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { DiagramModel, Shape } from '@/lib/domain';
import { checkCollisions } from '@/lib/engine';
import { canRedo, canUndo, docReducer, initialDocState, type DocState } from '@/lib/editor/reducer';
import type { EditorAction } from '@/lib/editor/actions';
import {
  initialUiState,
  readPreferences,
  toPreferences,
  uiReducer,
  PREFERENCES_KEY,
  type UiAction,
  type UiState,
} from '@/lib/editor/uiState';
import { translate, type MessageKey } from '@/lib/i18n/messages';

interface EditorContextValue {
  doc: DocState;
  ui: UiState;
  dispatch: (action: EditorAction) => void;
  dispatchUi: (action: UiAction) => void;
  /** Shapes that overlap something unrelated, recomputed only when the model changes. */
  collisions: Set<string>;
  /** The single selected shape, or null when zero or several are selected. */
  selectedShape: Shape | null;
  canUndo: boolean;
  canRedo: boolean;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>');
  return ctx;
}

export function EditorProvider({
  initialModel,
  children,
}: {
  initialModel: DiagramModel;
  children: ReactNode;
}) {
  const [doc, dispatch] = useReducer(docReducer, initialModel, initialDocState);
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState);

  // Preferences are read after mount so the server and client render the same
  // markup; reading localStorage during render would cause a hydration mismatch.
  useEffect(() => {
    const stored = readPreferences(window.localStorage);
    if (stored.dark !== undefined && stored.dark !== initialUiState.dark) {
      dispatchUi({ type: 'toggleDark' });
    }
    if (stored.gridSnap !== undefined && stored.gridSnap !== initialUiState.gridSnap) {
      dispatchUi({ type: 'toggleGridSnap' });
    }
    if (stored.minimapOpen !== undefined && stored.minimapOpen !== initialUiState.minimapOpen) {
      dispatchUi({ type: 'toggleMinimap' });
    }
    if (stored.codeOpen !== undefined && stored.codeOpen !== initialUiState.codeOpen) {
      dispatchUi({ type: 'toggleCode' });
    }
    if (stored.brand) dispatchUi({ type: 'setBrand', brand: stored.brand });
    if (stored.locale) dispatchUi({ type: 'setLocale', locale: stored.locale });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(toPreferences(ui)));
    } catch {
      // Private browsing or a full quota must not break the editor.
    }
  }, [ui]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', ui.dark);
  }, [ui.dark]);

  useEffect(() => {
    if (!ui.toast) return;
    const timer = setTimeout(() => dispatchUi({ type: 'toast', message: null }), 4000);
    return () => clearTimeout(timer);
  }, [ui.toast]);

  const collisions = useMemo(() => checkCollisions(doc.model), [doc.model]);

  const selectedShape = useMemo(() => {
    if (ui.selectedIds.size !== 1) return null;
    const [id] = ui.selectedIds;
    return doc.model.shapes.find((s) => s.id === id) ?? null;
  }, [ui.selectedIds, doc.model]);

  const t = useCallback(
    (key: MessageKey, values?: Record<string, string | number>) =>
      translate(ui.locale, key, values),
    [ui.locale],
  );

  const value = useMemo<EditorContextValue>(
    () => ({
      doc,
      ui,
      dispatch,
      dispatchUi,
      collisions,
      selectedShape,
      canUndo: canUndo(doc),
      canRedo: canRedo(doc),
      t,
    }),
    [doc, ui, collisions, selectedShape, t],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
