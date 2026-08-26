import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyModel, addGroup } from '@/lib/engine';
import { LEGACY_LOCALSTORAGE_KEY, LocalDiagramRepository } from './localRepository';

function modelWithGroups(n: number) {
  const m = createEmptyModel();
  for (let i = 0; i < n; i++) addGroup(m, i * 500, 0);
  return m;
}

/** Fresh, isolated database per repository so tests never share state. */
let dbCounter = 0;
function freshRepo() {
  return new LocalDiagramRepository({ dbName: `test-db-${++dbCounter}` });
}

let repo: LocalDiagramRepository;
beforeEach(() => {
  repo = freshRepo();
});

describe('create / get / list', () => {
  it('round-trips a diagram', async () => {
    const created = await repo.create({ title: 'My arch', model: modelWithGroups(2) });
    const fetched = await repo.get(created.id);
    expect(fetched?.title).toBe('My arch');
    expect(fetched?.model.shapes).toHaveLength(6);
  });

  it('starts empty and returns null for an unknown id', async () => {
    expect(await repo.list()).toEqual([]);
    expect(await repo.get('nope')).toBeNull();
  });

  it('lists metadata without the model payload', async () => {
    await repo.create({ title: 'A', model: modelWithGroups(1) });
    const [meta] = await repo.list();
    expect(meta.title).toBe('A');
    expect('model' in meta).toBe(false);
  });

  it('sorts the library by most recently updated', async () => {
    const a = await repo.create({ title: 'A', model: createEmptyModel() });
    await repo.create({ title: 'B', model: createEmptyModel() });
    await repo.save(a.id, modelWithGroups(1));

    expect((await repo.list()).map((d) => d.title)).toEqual(['A', 'B']);
  });

  it('gives every diagram a distinct id', async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add((await repo.create({ title: `d${i}`, model: createEmptyModel() })).id);
    }
    expect(ids.size).toBe(50);
  });
});

describe('save', () => {
  it('replaces the model and bumps updatedAt', async () => {
    const created = await repo.create({ title: 'A', model: createEmptyModel() });
    const saved = await repo.save(created.id, modelWithGroups(3));

    expect(saved.model.shapes).toHaveLength(9);
    expect(saved.updatedAt > created.updatedAt).toBe(true);
    expect(saved.createdAt).toBe(created.createdAt);
  });

  it('rejects an unknown diagram', async () => {
    await expect(repo.save('ghost', createEmptyModel())).rejects.toThrow(/not found/i);
  });

  it('does not snapshot unless asked', async () => {
    const created = await repo.create({ title: 'A', model: createEmptyModel() });
    await repo.save(created.id, modelWithGroups(1));
    expect(await repo.listVersions(created.id)).toHaveLength(0);
  });
});

describe('version history', () => {
  it('snapshots the previous content, not the new one', async () => {
    const created = await repo.create({ title: 'A', model: createEmptyModel() });
    await repo.save(created.id, modelWithGroups(2), { snapshot: true, label: 'v1' });

    const versions = await repo.listVersions(created.id);
    expect(versions).toHaveLength(1);
    expect(versions[0].label).toBe('v1');
    expect(versions[0].model.shapes).toHaveLength(0);
  });

  it('restores an earlier model and keeps the current one recoverable', async () => {
    const created = await repo.create({ title: 'A', model: modelWithGroups(1) });
    await repo.save(created.id, modelWithGroups(4), { snapshot: true });
    const [firstVersion] = await repo.listVersions(created.id);

    const restored = await repo.restoreVersion(created.id, firstVersion.id);

    expect(restored.model.shapes).toHaveLength(3);
    const versions = await repo.listVersions(created.id);
    expect(versions).toHaveLength(2);
    expect(versions[0].label).toBe('before restore');
    expect(versions[0].model.shapes).toHaveLength(12);
  });

  it('refuses a version belonging to another diagram', async () => {
    const a = await repo.create({ title: 'A', model: createEmptyModel() });
    const b = await repo.create({ title: 'B', model: createEmptyModel() });
    await repo.save(a.id, modelWithGroups(1), { snapshot: true });
    const [v] = await repo.listVersions(a.id);

    await expect(repo.restoreVersion(b.id, v.id)).rejects.toThrow(/not found/i);
  });

  it('caps the history so the store cannot grow without bound', async () => {
    const created = await repo.create({ title: 'A', model: createEmptyModel() });
    for (let i = 0; i < 60; i++) {
      await repo.save(created.id, modelWithGroups(1), { snapshot: true, label: `v${i}` });
    }
    const versions = await repo.listVersions(created.id);
    expect(versions).toHaveLength(50);
    // The oldest were dropped, the newest kept.
    expect(versions[0].label).toBe('v59');
  });

  it('returns an empty history for a diagram with no snapshots', async () => {
    const created = await repo.create({ title: 'A', model: createEmptyModel() });
    expect(await repo.listVersions(created.id)).toEqual([]);
  });
});

describe('duplicate / delete / updateMeta', () => {
  it('duplicates into an independent copy', async () => {
    const created = await repo.create({ title: 'Original', model: modelWithGroups(1) });
    const copy = await repo.duplicate(created.id);

    expect(copy.id).not.toBe(created.id);
    expect(copy.title).toBe('Original copy');

    await repo.save(copy.id, modelWithGroups(5));
    expect((await repo.get(created.id))!.model.shapes).toHaveLength(3);
  });

  it('deletes the diagram together with its versions', async () => {
    const created = await repo.create({ title: 'A', model: createEmptyModel() });
    await repo.save(created.id, modelWithGroups(1), { snapshot: true });

    await repo.delete(created.id);

    expect(await repo.get(created.id)).toBeNull();
    expect(await repo.listVersions(created.id)).toHaveLength(0);
  });

  it('leaves other diagrams untouched when deleting', async () => {
    const a = await repo.create({ title: 'A', model: createEmptyModel() });
    const b = await repo.create({ title: 'B', model: createEmptyModel() });
    await repo.save(b.id, modelWithGroups(1), { snapshot: true });

    await repo.delete(a.id);

    expect(await repo.get(b.id)).not.toBeNull();
    expect(await repo.listVersions(b.id)).toHaveLength(1);
  });

  it('patches metadata without touching the model', async () => {
    const created = await repo.create({ title: 'A', model: modelWithGroups(2) });
    const updated = await repo.updateMeta(created.id, { title: 'Renamed', folder: 'Clients' });

    expect(updated.title).toBe('Renamed');
    expect(updated.folder).toBe('Clients');
    expect(updated.model.shapes).toHaveLength(6);
  });
});

describe('workspace export / import', () => {
  it('round-trips every diagram and version', async () => {
    const a = await repo.create({ title: 'A', model: modelWithGroups(1) });
    await repo.create({ title: 'B', model: modelWithGroups(2) });
    await repo.save(a.id, modelWithGroups(3), { snapshot: true, label: 'snap' });

    const dump = await repo.exportWorkspace();
    expect(dump.diagrams).toHaveLength(2);
    expect(dump.versions).toHaveLength(1);

    const target = freshRepo();
    expect(await target.importWorkspace(dump)).toBe(2);

    const titles = (await target.list()).map((d) => d.title).sort();
    expect(titles).toEqual(['A', 'B']);
  });

  it('rewires imported versions to their new diagram ids', async () => {
    const a = await repo.create({ title: 'A', model: modelWithGroups(1) });
    await repo.save(a.id, modelWithGroups(3), { snapshot: true, label: 'snap' });
    const dump = await repo.exportWorkspace();

    const target = freshRepo();
    await target.importWorkspace(dump);

    const [imported] = await target.list();
    const versions = await target.listVersions(imported.id);
    expect(versions).toHaveLength(1);
    expect(versions[0].label).toBe('snap');
  });

  it('merges into an existing store rather than replacing it', async () => {
    await repo.create({ title: 'Existing', model: createEmptyModel() });
    const other = freshRepo();
    await other.create({ title: 'Incoming', model: createEmptyModel() });

    await repo.importWorkspace(await other.exportWorkspace());

    expect((await repo.list()).map((d) => d.title).sort()).toEqual(['Existing', 'Incoming']);
  });

  it('rejects a dump containing an invalid diagram', async () => {
    await expect(
      repo.importWorkspace({
        exportedAt: new Date().toISOString(),
        // @ts-expect-error deliberately malformed payload
        diagrams: [{ id: 'x', title: 'broken' }],
        versions: [],
      }),
    ).rejects.toThrow();
  });
});

describe('legacy autosave migration', () => {
  const storage = (value: string | null) => ({ getItem: () => value });

  it('imports the old single-diagram autosave once', async () => {
    const legacy = JSON.stringify(modelWithGroups(2));
    const imported = await repo.migrateLegacyAutosave(storage(legacy));

    expect(imported?.title).toBe('Recovered diagram');
    expect(imported?.model.shapes).toHaveLength(6);

    // Second boot must not duplicate it.
    expect(await repo.migrateLegacyAutosave(storage(legacy))).toBeNull();
    expect(await repo.list()).toHaveLength(1);
  });

  it('ignores an empty autosave', async () => {
    const empty = JSON.stringify(createEmptyModel());
    expect(await repo.migrateLegacyAutosave(storage(empty))).toBeNull();
    expect(await repo.list()).toHaveLength(0);
  });

  it('ignores a missing key', async () => {
    expect(await repo.migrateLegacyAutosave(storage(null))).toBeNull();
  });

  it('survives a corrupt blob without blocking startup', async () => {
    expect(await repo.migrateLegacyAutosave(storage('{not json'))).toBeNull();
    // The flag is still set, so a broken blob is not retried on every boot.
    expect(
      await repo.migrateLegacyAutosave(storage(JSON.stringify(modelWithGroups(1)))),
    ).toBeNull();
  });

  it('uses the documented legacy key', () => {
    expect(LEGACY_LOCALSTORAGE_KEY).toBe('aion-arch-studio-autosave');
  });
});
