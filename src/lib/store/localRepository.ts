import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  DiagramRecordSchema,
  DiagramVersionSchema,
  type DiagramMeta,
  type DiagramModel,
  type DiagramRecord,
  type DiagramVersion,
} from '@/lib/domain';
import { uid } from '@/lib/engine';
import type { CreateDiagramInput, DiagramRepository, SaveOptions, WorkspaceExport } from './types';

const DB_NAME = 'aion-architecture-studio';
const DB_VERSION = 1;

/** Key of the single-diagram autosave written by the original editor. */
export const LEGACY_LOCALSTORAGE_KEY = 'aion-arch-studio-autosave';

/** Owner of every locally created diagram until real accounts exist. */
export const LOCAL_OWNER_ID = 'local-user';

/** How many snapshots to keep per diagram before the oldest are dropped. */
const MAX_VERSIONS_PER_DIAGRAM = 50;

interface StudioDB extends DBSchema {
  diagrams: { key: string; value: DiagramRecord };
  versions: { key: string; value: DiagramVersion; indexes: { byDiagram: string } };
  flags: { key: string; value: boolean };
}

/** Projects a stored record onto its metadata, dropping the heavy model payload. */
function toMeta(record: DiagramRecord): DiagramMeta {
  return {
    id: record.id,
    ownerId: record.ownerId,
    title: record.title,
    description: record.description,
    folder: record.folder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    thumbnail: record.thumbnail,
  };
}

/**
 * IndexedDB-backed store.
 *
 * IndexedDB rather than localStorage because version history quickly exceeds
 * the 5 MB localStorage quota — a single 50-shape diagram is already ~17 KB.
 */
export interface LocalRepositoryOptions {
  /** Override the IndexedDB database name. Used by tests to stay isolated. */
  dbName?: string;
}

export class LocalDiagramRepository implements DiagramRepository {
  private dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null;
  private readonly dbName: string;

  private lastStamp = 0;

  constructor(options: LocalRepositoryOptions = {}) {
    this.dbName = options.dbName ?? DB_NAME;
  }

  /**
   * Strictly increasing ISO timestamp.
   *
   * Two saves inside the same millisecond would otherwise share a timestamp and
   * make the version history order non-deterministic. It also gives DynamoDB a
   * usable sort key when the store moves to AWS.
   */
  private now(): string {
    const ms = Math.max(Date.now(), this.lastStamp + 1);
    this.lastStamp = ms;
    return new Date(ms).toISOString();
  }

  /** Releases the connection so the database can be deleted or upgraded. */
  async close(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  private db(): Promise<IDBPDatabase<StudioDB>> {
    this.dbPromise ??= openDB<StudioDB>(this.dbName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('diagrams')) {
          db.createObjectStore('diagrams', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('versions')) {
          const store = db.createObjectStore('versions', { keyPath: 'id' });
          store.createIndex('byDiagram', 'diagramId');
        }
        if (!db.objectStoreNames.contains('flags')) db.createObjectStore('flags');
      },
    });
    return this.dbPromise;
  }

  async list(): Promise<DiagramMeta[]> {
    const db = await this.db();
    const all = await db.getAll('diagrams');
    return all
      .map(toMeta)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
  }

  async get(id: string): Promise<DiagramRecord | null> {
    const db = await this.db();
    const record = await db.get('diagrams', id);
    if (!record) return null;
    // Parse on read: a hand-edited or outdated record fails here, not deep in the editor.
    return DiagramRecordSchema.parse(record);
  }

  async create(input: CreateDiagramInput): Promise<DiagramRecord> {
    const ts = this.now();
    const record: DiagramRecord = DiagramRecordSchema.parse({
      id: uid('dgm'),
      ownerId: LOCAL_OWNER_ID,
      title: input.title,
      description: input.description ?? '',
      folder: input.folder ?? null,
      createdAt: ts,
      updatedAt: ts,
      thumbnail: null,
      model: input.model,
    });
    const db = await this.db();
    await db.put('diagrams', record);
    return record;
  }

  async save(id: string, model: DiagramModel, options: SaveOptions = {}): Promise<DiagramRecord> {
    const db = await this.db();
    const existing = await db.get('diagrams', id);
    if (!existing) throw new Error(`Diagram not found: ${id}`);

    if (options.snapshot) await this.snapshot(existing, options.label ?? null);

    const updated: DiagramRecord = DiagramRecordSchema.parse({
      ...existing,
      model,
      updatedAt: this.now(),
    });
    await db.put('diagrams', updated);
    return updated;
  }

  async updateMeta(
    id: string,
    patch: Partial<Pick<DiagramMeta, 'title' | 'description' | 'folder' | 'thumbnail'>>,
  ): Promise<DiagramRecord> {
    const db = await this.db();
    const existing = await db.get('diagrams', id);
    if (!existing) throw new Error(`Diagram not found: ${id}`);
    const updated: DiagramRecord = DiagramRecordSchema.parse({
      ...existing,
      ...patch,
      updatedAt: this.now(),
    });
    await db.put('diagrams', updated);
    return updated;
  }

  async duplicate(id: string): Promise<DiagramRecord> {
    const source = await this.get(id);
    if (!source) throw new Error(`Diagram not found: ${id}`);
    return this.create({
      title: `${source.title} copy`,
      description: source.description,
      folder: source.folder,
      model: structuredClone(source.model),
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(['diagrams', 'versions'], 'readwrite');
    await tx.objectStore('diagrams').delete(id);
    const index = tx.objectStore('versions').index('byDiagram');
    for (const key of await index.getAllKeys(id)) {
      await tx.objectStore('versions').delete(key);
    }
    await tx.done;
  }

  async listVersions(diagramId: string): Promise<DiagramVersion[]> {
    const db = await this.db();
    const all = await db.getAllFromIndex('versions', 'byDiagram', diagramId);
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  }

  async restoreVersion(diagramId: string, versionId: string): Promise<DiagramRecord> {
    const db = await this.db();
    const version = await db.get('versions', versionId);
    if (!version || version.diagramId !== diagramId) {
      throw new Error(`Version not found: ${versionId}`);
    }
    // Snapshot current state first, so restoring is itself undoable.
    return this.save(diagramId, version.model, { snapshot: true, label: 'before restore' });
  }

  async exportWorkspace(): Promise<WorkspaceExport> {
    const db = await this.db();
    return {
      exportedAt: this.now(),
      diagrams: await db.getAll('diagrams'),
      versions: await db.getAll('versions'),
    };
  }

  /** Merges an export into the store, giving every record a new ID. Returns the diagram count. */
  async importWorkspace(data: WorkspaceExport): Promise<number> {
    const db = await this.db();
    const idMap = new Map<string, string>();

    for (const raw of data.diagrams) {
      const parsed = DiagramRecordSchema.parse(raw);
      const newId = uid('dgm');
      idMap.set(parsed.id, newId);
      await db.put('diagrams', { ...parsed, id: newId });
    }
    for (const raw of data.versions) {
      const parsed = DiagramVersionSchema.parse(raw);
      const mappedDiagramId = idMap.get(parsed.diagramId);
      if (!mappedDiagramId) continue;
      await db.put('versions', { ...parsed, id: uid('ver'), diagramId: mappedDiagramId });
    }
    return idMap.size;
  }

  /**
   * One-shot import of the original single-diagram localStorage autosave.
   * Safe to call on every boot: a flag makes it a no-op after the first run.
   */
  async migrateLegacyAutosave(storage: Pick<Storage, 'getItem'>): Promise<DiagramRecord | null> {
    const db = await this.db();
    if (await db.get('flags', LEGACY_LOCALSTORAGE_KEY)) return null;

    let record: DiagramRecord | null = null;
    try {
      const raw = storage.getItem(LEGACY_LOCALSTORAGE_KEY);
      if (raw) {
        const model = JSON.parse(raw);
        // Only import something that actually holds work.
        if (Array.isArray(model?.shapes) && model.shapes.length > 0) {
          record = await this.create({ title: 'Recovered diagram', model });
        }
      }
    } catch {
      // A corrupt legacy blob must not block startup; the flag below stops retries.
      record = null;
    }
    await db.put('flags', true, LEGACY_LOCALSTORAGE_KEY);
    return record;
  }

  private async snapshot(record: DiagramRecord, label: string | null): Promise<void> {
    const db = await this.db();
    const version: DiagramVersion = DiagramVersionSchema.parse({
      id: uid('ver'),
      diagramId: record.id,
      createdAt: this.now(),
      label,
      model: record.model,
    });
    await db.put('versions', version);

    const existing = await db.getAllFromIndex('versions', 'byDiagram', record.id);
    if (existing.length <= MAX_VERSIONS_PER_DIAGRAM) return;
    const oldestFirst = existing.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    for (const stale of oldestFirst.slice(0, existing.length - MAX_VERSIONS_PER_DIAGRAM)) {
      await db.delete('versions', stale.id);
    }
  }
}
