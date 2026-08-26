import type { DiagramModel, Shape } from '@/lib/domain';
import { createEmptyModel } from './model';

/** Builds a bare model from partial shape descriptions. Test-only helper. */
export function modelWith(shapes: Partial<Shape>[]): DiagramModel {
  const m = createEmptyModel();
  m.shapes = shapes.map((s, i) => ({
    id: s.id ?? `s${i}`,
    type: s.type ?? 'item',
    parentId: s.parentId ?? null,
    x: s.x ?? 0,
    y: s.y ?? 0,
    w: s.w ?? 100,
    h: s.h ?? 50,
    ...s,
  })) as Shape[];
  return m;
}

/** Deterministic pseudo-random generator so failures are reproducible. */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
