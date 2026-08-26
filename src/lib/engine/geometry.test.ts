import { describe, expect, it } from 'vitest';
import {
  bbox,
  contentBBox,
  geometricallyContains,
  inflate,
  ports,
  rectsOverlap,
  snapToGrid,
} from './geometry';
import { createEmptyModel } from './model';
import { modelWith } from './testUtils';

describe('rectsOverlap', () => {
  const a = { x: 0, y: 0, w: 100, h: 100 };

  it('detects a genuine overlap', () => {
    expect(rectsOverlap(a, { x: 50, y: 50, w: 100, h: 100 })).toBe(true);
  });

  it('treats touching edges as not overlapping', () => {
    expect(rectsOverlap(a, { x: 100, y: 0, w: 50, h: 50 })).toBe(false);
  });

  it('rejects disjoint rectangles', () => {
    expect(rectsOverlap(a, { x: 200, y: 200, w: 10, h: 10 })).toBe(false);
  });

  it('is symmetric', () => {
    const b = { x: 20, y: 20, w: 500, h: 5 };
    expect(rectsOverlap(a, b)).toBe(rectsOverlap(b, a));
  });
});

describe('geometricallyContains', () => {
  const outer = { x: 0, y: 0, w: 100, h: 100 };

  it('accepts a fully enclosed rectangle', () => {
    expect(geometricallyContains(outer, { x: 10, y: 10, w: 10, h: 10 })).toBe(true);
  });

  it('accepts an exact fit within tolerance', () => {
    expect(geometricallyContains(outer, { x: 0, y: 0, w: 100, h: 100 })).toBe(true);
  });

  it('rejects one that pokes out', () => {
    expect(geometricallyContains(outer, { x: 90, y: 0, w: 20, h: 10 })).toBe(false);
  });
});

describe('inflate', () => {
  it('grows on every side', () => {
    expect(inflate({ x: 10, y: 10, w: 10, h: 10 }, 5)).toEqual({ x: 5, y: 5, w: 20, h: 20 });
  });
});

describe('ports', () => {
  it('places the four anchors at edge midpoints', () => {
    const s = { id: 'a', type: 'item' as const, parentId: null, x: 0, y: 0, w: 100, h: 50 };
    expect(ports(s)).toEqual({
      N: { x: 50, y: 0 },
      S: { x: 50, y: 50 },
      E: { x: 100, y: 25 },
      W: { x: 0, y: 25 },
    });
  });
});

describe('snapToGrid', () => {
  it('rounds to the nearest multiple', () => {
    expect(snapToGrid(0)).toBe(0);
    expect(snapToGrid(8)).toBe(0);
    expect(snapToGrid(10)).toBe(18);
    expect(snapToGrid(-10)).toBe(-18);
  });

  it('honours a custom grid size', () => {
    expect(snapToGrid(13, 10)).toBe(10);
    expect(snapToGrid(16, 10)).toBe(20);
  });
});

describe('contentBBox', () => {
  it('returns a placeholder for an empty diagram', () => {
    expect(contentBBox(createEmptyModel())).toEqual({ x: 20, y: 20, w: 600, h: 400 });
  });

  it('spans every shape', () => {
    const m = modelWith([
      { x: 10, y: 20, w: 100, h: 50 },
      { x: 200, y: 300, w: 40, h: 40 },
    ]);
    expect(contentBBox(m)).toEqual({ x: 10, y: 20, w: 230, h: 320 });
  });

  it('includes connector waypoints that stray outside the shapes', () => {
    const m = modelWith([{ id: 'a', x: 0, y: 0, w: 10, h: 10 }]);
    m.connectors = [
      {
        id: 'c',
        sourceId: 'a',
        targetId: 'a',
        label: '',
        style: 'solid',
        waypoints: [
          { x: -50, y: -50 },
          { x: 60, y: 60 },
        ],
      },
    ];
    expect(contentBBox(m)).toEqual({ x: -50, y: -50, w: 110, h: 110 });
  });
});

describe('bbox', () => {
  it('projects a shape onto its rectangle', () => {
    const s = { id: 'a', type: 'item' as const, parentId: null, x: 1, y: 2, w: 3, h: 4 };
    expect(bbox(s)).toEqual({ x: 1, y: 2, w: 3, h: 4 });
  });
});
