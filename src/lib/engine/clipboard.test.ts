import { describe, expect, it } from 'vitest';
import { cloneShapes, pasteShapes } from './clipboard';
import { addGroup, children, createEmptyModel, getShape } from './model';
import { addConnector } from './routing';

describe('cloneShapes', () => {
  it('includes descendants of the selected shape', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const payload = cloneShapes(m, new Set([g.id]));
    expect(payload.shapes).toHaveLength(3);
  });

  it('keeps only connectors whose endpoints are both copied', () => {
    const m = createEmptyModel();
    const a = addGroup(m, 0, 0);
    const b = addGroup(m, 900, 0);
    const aItem = children(m, children(m, a.id)[0].id)[0];
    const bItem = children(m, children(m, b.id)[0].id)[0];
    addConnector(m, aItem.id, bItem.id);

    expect(cloneShapes(m, new Set([a.id])).connectors).toHaveLength(0);
    expect(cloneShapes(m, new Set([a.id, b.id])).connectors).toHaveLength(1);
  });

  it('produces a detached copy', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const payload = cloneShapes(m, new Set([g.id]));
    payload.shapes[0].title = 'mutated';
    expect(g.title).toBe('New Group');
  });
});

describe('pasteShapes', () => {
  it('offsets the copy and gives every shape a fresh id', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 100, 100);
    const payload = cloneShapes(m, new Set([g.id]));
    const originalIds = new Set(m.shapes.map((s) => s.id));

    const newIds = pasteShapes(m, payload, 40, 40);

    expect(m.shapes).toHaveLength(6);
    for (const id of newIds) expect(originalIds.has(id)).toBe(false);
    const pasted = getShape(
      m,
      [...newIds].find((id) => id.startsWith('grp'))!,
    )!;
    expect(pasted.x).toBe(140);
    expect(pasted.y).toBe(140);
  });

  it('rewires parent links to the pasted copies', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const payload = cloneShapes(m, new Set([g.id]));
    const newIds = pasteShapes(m, payload, 40, 40);

    const newGroupId = [...newIds].find((id) => id.startsWith('grp'))!;
    const newContainer = children(m, newGroupId);
    expect(newContainer).toHaveLength(1);
    expect(children(m, newContainer[0].id)).toHaveLength(1);
  });

  it('rewires internal connectors and offsets their waypoints', () => {
    const m = createEmptyModel();
    const a = addGroup(m, 0, 0);
    const b = addGroup(m, 900, 0);
    const aItem = children(m, children(m, a.id)[0].id)[0];
    const bItem = children(m, children(m, b.id)[0].id)[0];
    const conn = addConnector(m, aItem.id, bItem.id);
    const originalStart = { ...conn.waypoints[0] };

    const payload = cloneShapes(m, new Set([a.id, b.id]));
    pasteShapes(m, payload, 40, 40);

    expect(m.connectors).toHaveLength(2);
    const copy = m.connectors[1];
    expect(copy.sourceId).not.toBe(conn.sourceId);
    expect(getShape(m, copy.sourceId)).toBeDefined();
    expect(getShape(m, copy.targetId)).toBeDefined();
    expect(copy.waypoints[0].x).toBe(originalStart.x + 40);
  });

  it('survives repeated pastes without colliding', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const payload = cloneShapes(m, new Set([g.id]));
    for (let i = 0; i < 25; i++) pasteShapes(m, payload, 10 * i, 10 * i);
    expect(new Set(m.shapes.map((s) => s.id)).size).toBe(m.shapes.length);
  });

  it('preserves the id prefix so shape kinds stay recognisable', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const payload = cloneShapes(m, new Set([g.id]));
    const newIds = [...pasteShapes(m, payload, 0, 0)];
    expect(newIds.filter((id) => id.startsWith('grp_'))).toHaveLength(1);
    expect(newIds.filter((id) => id.startsWith('ctr_'))).toHaveLength(1);
    expect(newIds.filter((id) => id.startsWith('itm_'))).toHaveLength(1);
  });
});
