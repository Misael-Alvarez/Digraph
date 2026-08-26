import { describe, expect, it } from 'vitest';
import {
  addConnector,
  deleteConnector,
  connectorsTouching,
  routeAllConnectors,
  routeConnector,
  routeConnectorsFor,
} from './routing';
import { addGroup, addItemToContainer, children, createEmptyModel } from './model';
import { modelWith } from './testUtils';

const isOrthogonal = (pts: { x: number; y: number }[]) =>
  pts.every(
    (p, i) => i === 0 || Math.abs(p.x - pts[i - 1].x) < 1e-6 || Math.abs(p.y - pts[i - 1].y) < 1e-6,
  );

describe('routeConnector', () => {
  it('produces an orthogonal path anchored on both shapes', () => {
    const m = modelWith([
      { id: 'a', x: 0, y: 0, w: 100, h: 100 },
      { id: 'b', x: 400, y: 0, w: 100, h: 100 },
    ]);
    const c = addConnector(m, 'a', 'b');
    expect(c.waypoints.length).toBeGreaterThanOrEqual(2);
    expect(isOrthogonal(c.waypoints)).toBe(true);
    // Side-by-side shapes leave the east face and arrive on the west face.
    expect(c.waypoints[0]).toEqual({ x: 100, y: 50 });
    expect(c.waypoints.at(-1)).toEqual({ x: 400, y: 50 });
  });

  it('picks vertical ports for stacked shapes', () => {
    const m = modelWith([
      { id: 'a', x: 0, y: 0, w: 100, h: 100 },
      { id: 'b', x: 0, y: 400, w: 100, h: 100 },
    ]);
    const c = addConnector(m, 'a', 'b');
    expect(c.waypoints[0]).toEqual({ x: 50, y: 100 });
    expect(c.waypoints.at(-1)).toEqual({ x: 50, y: 400 });
  });

  it('reverses ports when the target is to the west', () => {
    const m = modelWith([
      { id: 'a', x: 400, y: 0, w: 100, h: 100 },
      { id: 'b', x: 0, y: 0, w: 100, h: 100 },
    ]);
    const c = addConnector(m, 'a', 'b');
    expect(c.waypoints[0]).toEqual({ x: 400, y: 50 });
    expect(c.waypoints.at(-1)).toEqual({ x: 100, y: 50 });
  });

  it('routes adjacent stacked items as a straight drop', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const ct = children(m, g.id).find((s) => s.type === 'container')!;
    addItemToContainer(m, ct.id);
    const items = children(m, ct.id)
      .filter((s) => s.type === 'item')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const c = addConnector(m, items[0].id, items[1].id);
    expect(c.waypoints).toHaveLength(2);
    expect(c.waypoints[0].x).toBe(c.waypoints[1].x);
    expect(c.waypoints[0].y).toBeLessThan(c.waypoints[1].y);
  });

  it('orders the straight drop by geometry, not by connector direction', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const ct = children(m, g.id).find((s) => s.type === 'container')!;
    addItemToContainer(m, ct.id);
    const items = children(m, ct.id)
      .filter((s) => s.type === 'item')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const c = addConnector(m, items[1].id, items[0].id);
    // Drawn bottom-to-top, so the first waypoint is the lower item's top edge.
    expect(c.waypoints[0].y).toBeGreaterThan(c.waypoints[1].y);
  });

  it('picks the elbow that clears an obstacle', () => {
    const m = modelWith([
      { id: 'a', type: 'item', x: 0, y: 0, w: 100, h: 100 },
      { id: 'b', type: 'item', x: 600, y: 300, w: 100, h: 100 },
      // Blocks the preferred "across then down" elbow but not "down then across".
      { id: 'wall', type: 'item', x: 200, y: 20, w: 300, h: 60 },
    ]);
    const c = addConnector(m, 'a', 'b');
    expect(isOrthogonal(c.waypoints)).toBe(true);
    expect(c.waypoints).toEqual([
      { x: 100, y: 50 },
      { x: 100, y: 350 },
      { x: 600, y: 350 },
    ]);
  });

  it('falls back to a dogleg when every candidate is blocked', () => {
    // Known limitation: the router only tries four fixed elbow shapes. When a wall
    // spans all of them it emits the mid-X dogleg, which still crosses the wall.
    // Documented here so the routing rework has a baseline to improve on.
    const m = modelWith([
      { id: 'a', type: 'item', x: 0, y: 0, w: 100, h: 100 },
      { id: 'b', type: 'item', x: 600, y: 300, w: 100, h: 100 },
      { id: 'wall', type: 'item', x: 300, y: -200, w: 60, h: 700 },
    ]);
    const c = addConnector(m, 'a', 'b');
    expect(isOrthogonal(c.waypoints)).toBe(true);
    expect(c.waypoints).toEqual([
      { x: 100, y: 50 },
      { x: 350, y: 50 },
      { x: 350, y: 350 },
      { x: 600, y: 350 },
    ]);
  });

  it('cannot avoid an obstacle between perfectly aligned shapes', () => {
    // Aligned centres collapse every candidate to the same straight line.
    const m = modelWith([
      { id: 'a', type: 'item', x: 0, y: 0, w: 100, h: 100 },
      { id: 'b', type: 'item', x: 600, y: 0, w: 100, h: 100 },
      { id: 'wall', type: 'item', x: 300, y: -200, w: 60, h: 500 },
    ]);
    const c = addConnector(m, 'a', 'b');
    expect(c.waypoints).toHaveLength(2);
  });

  it('leaves waypoints untouched when an endpoint is missing', () => {
    const m = modelWith([{ id: 'a' }]);
    const c = {
      id: 'c',
      sourceId: 'a',
      targetId: 'ghost',
      label: '',
      style: 'solid' as const,
      waypoints: [],
    };
    m.connectors = [c];
    routeConnector(m, c);
    expect(c.waypoints).toEqual([]);
  });

  it('collapses collinear points', () => {
    const m = modelWith([
      { id: 'a', x: 0, y: 0, w: 100, h: 100 },
      { id: 'b', x: 400, y: 0, w: 100, h: 100 },
    ]);
    const c = addConnector(m, 'a', 'b');
    // Perfectly aligned centres need no intermediate bend.
    expect(c.waypoints).toHaveLength(2);
  });
});

describe('connector collection helpers', () => {
  it('re-routes only the connectors touching the moved shapes', () => {
    const m = modelWith([
      { id: 'a', x: 0, y: 0, w: 100, h: 100 },
      { id: 'b', x: 400, y: 0, w: 100, h: 100 },
      { id: 'c', x: 0, y: 600, w: 100, h: 100 },
      { id: 'd', x: 400, y: 600, w: 100, h: 100 },
    ]);
    const ab = addConnector(m, 'a', 'b');
    const cd = addConnector(m, 'c', 'd');
    const cdBefore = structuredClone(cd.waypoints);

    m.shapes[0].y = 200;
    routeConnectorsFor(m, new Set(['a']));

    expect(ab.waypoints[0].y).toBe(250);
    expect(cd.waypoints).toEqual(cdBefore);
  });

  it('lists connectors attached to a set of shapes', () => {
    const m = modelWith([{ id: 'a' }, { id: 'b', x: 400 }, { id: 'c', x: 800 }]);
    addConnector(m, 'a', 'b');
    addConnector(m, 'b', 'c');
    expect(connectorsTouching(m, new Set(['a']))).toHaveLength(1);
    expect(connectorsTouching(m, new Set(['b']))).toHaveLength(2);
    expect(connectorsTouching(m, new Set(['zzz']))).toHaveLength(0);
  });

  it('deletes by id', () => {
    const m = modelWith([{ id: 'a' }, { id: 'b', x: 400 }]);
    const c = addConnector(m, 'a', 'b');
    deleteConnector(m, c.id);
    expect(m.connectors).toHaveLength(0);
  });

  it('routes every connector at once', () => {
    const m = modelWith([{ id: 'a' }, { id: 'b', x: 400 }]);
    m.connectors = [
      { id: 'c', sourceId: 'a', targetId: 'b', label: '', style: 'solid', waypoints: [] },
    ];
    routeAllConnectors(m);
    expect(m.connectors[0].waypoints.length).toBeGreaterThanOrEqual(2);
  });
});
