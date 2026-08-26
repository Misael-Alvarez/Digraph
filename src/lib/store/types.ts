import type { DiagramMeta, DiagramModel, DiagramRecord, DiagramVersion } from '@/lib/domain';

export interface CreateDiagramInput {
  title: string;
  model: DiagramModel;
  description?: string;
  folder?: string | null;
}

export interface SaveOptions {
  /** Also snapshot the previous content into the version history. */
  snapshot?: boolean;
  /** Human label attached to that snapshot. */
  label?: string;
}

export interface WorkspaceExport {
  exportedAt: string;
  diagrams: DiagramRecord[];
  versions: DiagramVersion[];
}

/**
 * The single I/O boundary of the app.
 *
 * Today the only implementation is IndexedDB in the browser. The AWS
 * implementation will be a `fetch` wrapper with exactly this shape, so no
 * component or hook has to change when it lands. Every method is async for
 * that reason, even where the local store could answer synchronously.
 */
export interface DiagramRepository {
  list(): Promise<DiagramMeta[]>;
  get(id: string): Promise<DiagramRecord | null>;
  create(input: CreateDiagramInput): Promise<DiagramRecord>;
  save(id: string, model: DiagramModel, options?: SaveOptions): Promise<DiagramRecord>;
  updateMeta(
    id: string,
    patch: Partial<Pick<DiagramMeta, 'title' | 'description' | 'folder' | 'thumbnail'>>,
  ): Promise<DiagramRecord>;
  duplicate(id: string): Promise<DiagramRecord>;
  delete(id: string): Promise<void>;

  listVersions(diagramId: string): Promise<DiagramVersion[]>;
  restoreVersion(diagramId: string, versionId: string): Promise<DiagramRecord>;

  exportWorkspace(): Promise<WorkspaceExport>;
  importWorkspace(data: WorkspaceExport): Promise<number>;
}
