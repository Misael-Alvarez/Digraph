import type { Locale } from '@/lib/i18n/messages';
import { DEFAULT_VIEWPORT, type Viewport } from './viewport';
import type { BrandMode, ToolMode } from './types';

export type ModalKind = 'templates' | 'markdown' | 'shortcuts' | 'switchCloud' | null;

export interface UiState {
  tool: ToolMode;
  selectedIds: Set<string>;
  selectedConnectorId: string | null;
  /** Set while the connector tool is waiting for its second click. */
  connectorSourceId: string | null;
  viewport: Viewport;
  gridSnap: boolean;
  dark: boolean;
  brand: BrandMode;
  locale: Locale;
  minimapOpen: boolean;
  paletteOpen: boolean;
  inspectorPinned: boolean;
  modal: ModalKind;
  toast: string | null;
}

export const initialUiState: UiState = {
  tool: 'select',
  selectedIds: new Set(),
  selectedConnectorId: null,
  connectorSourceId: null,
  viewport: DEFAULT_VIEWPORT,
  gridSnap: true,
  dark: false,
  brand: 'aion',
  locale: 'es',
  minimapOpen: true,
  paletteOpen: false,
  inspectorPinned: false,
  modal: null,
  toast: null,
};

export type UiAction =
  | { type: 'setTool'; tool: ToolMode }
  | { type: 'select'; ids: string[]; additive?: boolean }
  | { type: 'toggleSelected'; id: string }
  | { type: 'clearSelection' }
  | { type: 'selectConnector'; id: string | null }
  | { type: 'setConnectorSource'; id: string | null }
  | { type: 'setViewport'; viewport: Viewport }
  | { type: 'toggleGridSnap' }
  | { type: 'toggleDark' }
  | { type: 'setBrand'; brand: BrandMode }
  | { type: 'setLocale'; locale: Locale }
  | { type: 'toggleMinimap' }
  | { type: 'setPaletteOpen'; open: boolean }
  | { type: 'toggleInspectorPinned' }
  | { type: 'setModal'; modal: ModalKind }
  | { type: 'toast'; message: string | null };

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'setTool':
      // Changing tool always abandons a half-drawn connector.
      return { ...state, tool: action.tool, connectorSourceId: null };

    case 'select': {
      const ids = action.additive
        ? new Set([...state.selectedIds, ...action.ids])
        : new Set(action.ids);
      return { ...state, selectedIds: ids, selectedConnectorId: null };
    }

    case 'toggleSelected': {
      const ids = new Set(state.selectedIds);
      if (ids.has(action.id)) ids.delete(action.id);
      else ids.add(action.id);
      return { ...state, selectedIds: ids, selectedConnectorId: null };
    }

    case 'clearSelection':
      return { ...state, selectedIds: new Set(), selectedConnectorId: null };

    case 'selectConnector':
      return { ...state, selectedConnectorId: action.id, selectedIds: new Set() };

    case 'setConnectorSource':
      return { ...state, connectorSourceId: action.id };

    case 'setViewport':
      return { ...state, viewport: action.viewport };

    case 'toggleGridSnap':
      return { ...state, gridSnap: !state.gridSnap };

    case 'toggleDark':
      return { ...state, dark: !state.dark };

    case 'setBrand':
      return { ...state, brand: action.brand };

    case 'setLocale':
      return { ...state, locale: action.locale };

    case 'toggleMinimap':
      return { ...state, minimapOpen: !state.minimapOpen };

    case 'setPaletteOpen':
      return { ...state, paletteOpen: action.open };

    case 'toggleInspectorPinned':
      return { ...state, inspectorPinned: !state.inspectorPinned };

    case 'setModal':
      return { ...state, modal: action.modal };

    case 'toast':
      return { ...state, toast: action.message };

    default:
      return state;
  }
}

/** Preferences worth remembering between sessions. */
export interface StoredPreferences {
  dark: boolean;
  gridSnap: boolean;
  brand: BrandMode;
  locale: Locale;
  minimapOpen: boolean;
}

export const PREFERENCES_KEY = 'aion-studio-preferences';

export function readPreferences(storage: Pick<Storage, 'getItem'>): Partial<StoredPreferences> {
  try {
    const raw = storage.getItem(PREFERENCES_KEY);
    return raw ? (JSON.parse(raw) as Partial<StoredPreferences>) : {};
  } catch {
    // Corrupt preferences must never stop the editor from opening.
    return {};
  }
}

export function toPreferences(state: UiState): StoredPreferences {
  return {
    dark: state.dark,
    gridSnap: state.gridSnap,
    brand: state.brand,
    locale: state.locale,
    minimapOpen: state.minimapOpen,
  };
}
