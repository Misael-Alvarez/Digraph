import type { DiagramModel, Shape } from '@/lib/domain';
import { bbox } from './geometry';
import { collectDescendantIds, getShape } from './model';

/**
 * Aligning and distributing a selection.
 *
 * These work on the outermost selected shapes only. Selecting a group and one of
 * its items and then aligning would otherwise move the item twice — once on its
 * own and once with its parent — and leave it somewhere nobody asked for.
 */

export type AlignEdge = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';

export interface Move {
  id: string;
  dx: number;
  dy: number;
}

/** Selected shapes with any selected descendant removed. */
export function outermost(model: DiagramModel, ids: Iterable<string>): Shape[] {
  const selected = [...new Set(ids)];
  const contained = new Set<string>();
  for (const id of selected) {
    for (const descendantId of collectDescendantIds(model, id)) {
      if (descendantId !== id) contained.add(descendantId);
    }
  }
  return selected
    .filter((id) => !contained.has(id))
    .map((id) => getShape(model, id))
    .filter((shape): shape is Shape => Boolean(shape));
}

/** How far each shape must move to line up on `edge`. */
export function alignMoves(model: DiagramModel, ids: Iterable<string>, edge: AlignEdge): Move[] {
  const shapes = outermost(model, ids);
  if (shapes.length < 2) return [];

  const boxes = shapes.map(bbox);
  const left = Math.min(...boxes.map((b) => b.x));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const top = Math.min(...boxes.map((b) => b.y));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));

  return shapes.map((shape, i) => {
    const box = boxes[i];
    switch (edge) {
      case 'left':
        return { id: shape.id, dx: left - box.x, dy: 0 };
      case 'right':
        return { id: shape.id, dx: right - (box.x + box.w), dy: 0 };
      case 'centerX':
        return { id: shape.id, dx: (left + right) / 2 - (box.x + box.w / 2), dy: 0 };
      case 'top':
        return { id: shape.id, dx: 0, dy: top - box.y };
      case 'bottom':
        return { id: shape.id, dx: 0, dy: bottom - (box.y + box.h) };
      case 'centerY':
        return { id: shape.id, dx: 0, dy: (top + bottom) / 2 - (box.y + box.h / 2) };
      default:
        return { id: shape.id, dx: 0, dy: 0 };
    }
  });
}

/**
 * How far each shape must move for even gaps along `axis`.
 *
 * The two outermost shapes stay put and everything between them is spaced so the
 * gaps are equal — which is what "distribute" means to someone looking at a
 * diagram, rather than equal centre-to-centre spacing between differently sized
 * boxes.
 */
export function distributeMoves(
  model: DiagramModel,
  ids: Iterable<string>,
  axis: DistributeAxis,
): Move[] {
  const shapes = outermost(model, ids);
  if (shapes.length < 3) return [];

  const horizontal = axis === 'horizontal';
  const sorted = [...shapes].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));

  const start = horizontal ? sorted[0].x + sorted[0].w : sorted[0].y + sorted[0].h;
  const last = sorted[sorted.length - 1];
  const end = horizontal ? last.x : last.y;

  const occupied = sorted
    .slice(1, -1)
    .reduce((total, shape) => total + (horizontal ? shape.w : shape.h), 0);
  const gap = (end - start - occupied) / (sorted.length - 1);

  const moves: Move[] = [];
  let cursor = start + gap;
  for (const shape of sorted.slice(1, -1)) {
    moves.push({
      id: shape.id,
      dx: horizontal ? cursor - shape.x : 0,
      dy: horizontal ? 0 : cursor - shape.y,
    });
    cursor += (horizontal ? shape.w : shape.h) + gap;
  }
  return moves;
}

/** Applies moves to a model, carrying each shape's descendants along. */
export function applyMoves(model: DiagramModel, moves: Move[]): void {
  for (const move of moves) {
    if (move.dx === 0 && move.dy === 0) continue;
    for (const id of collectDescendantIds(model, move.id)) {
      const shape = getShape(model, id);
      if (!shape) continue;
      shape.x += move.dx;
      shape.y += move.dy;
    }
  }
}
