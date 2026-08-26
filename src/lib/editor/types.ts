/**
 * Editor-only types.
 *
 * These describe transient UI state and never reach persistence — that is the
 * domain layer's job (`@/lib/domain`). Keeping them apart stops view concerns
 * from leaking into the stored model.
 */
import type { CloudProvider, DiagramModel } from '@/lib/domain';

export type ToolMode =
  'select' | 'boundary' | 'subboundary' | 'group' | 'item' | 'connector' | 'pan';

export type BrandMode = 'aion' | 'banorte' | 'dual' | 'none';

export interface EditorState {
  tool: ToolMode;
  selectedIds: Set<string>;
  connectorSourceId: string | null;
  zoom: number;
  gridSnap: boolean;
  darkMode: boolean;
  activeContainerId: string | null;
}

export interface ContextMenuState {
  x: number;
  y: number;
  shapeId?: string;
  connectorId?: string;
}

export interface InlineEditState {
  shapeId: string;
  field: 'title' | 'subtitle' | 'note';
  x: number;
  y: number;
  w: number;
}

export interface ServiceIcon {
  key: string;
  label: string;
  category: CloudProvider;
  subcategory?: string;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  model: DiagramModel;
}
