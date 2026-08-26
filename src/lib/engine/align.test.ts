import { describe, expect, it } from 'vitest';
import { alignMoves, applyMoves, distributeMoves, outermost } from './align';
import { addGroup, children, createEmptyModel, getShape } from './model';
import { modelWith } from './testUtils';

const three = () =>
  modelWith([
    { id: 'a', x: 0, y: 0, w: 100, h: 40 },
    { id: 'b', x: 200, y: 100, w: 60, h: 80 },
    { id: 'c', x: 400, y: 300, w: 140, h: 20 },
  ]);

const after = (edge: Parameters<typeof alignMoves>[2]) => {
  const model = three();
  applyMoves(model, alignMoves(model, ['a', 'b', 'c'], edge));
  return ['a', 'b', 'c'].map((id) => getShape(model, id)!);
};

describe('alignMoves', () => {
  it('lines up left edges on the leftmost shape', () => {
    expect(after('left').map((s) => s.x)).toEqual([0, 0, 0]);
  });

  it('lines up right edges on the rightmost shape', () => {
    expect(after('right').map((s) => s.x + s.w)).toEqual([540, 540, 540]);
  });

  it('centres horizontally between the outer edges', () => {
    const centres = after('centerX').map((s) => s.x + s.w / 2);
    expect(new Set(centres).size).toBe(1);
    expect(centres[0]).toBe(270);
  });

  it('lines up top, bottom and middle', () => {
    expect(after('top').map((s) => s.y)).toEqual([0, 0, 0]);
    expect(after('bottom').map((s) => s.y + s.h)).toEqual([320, 320, 320]);
    expect(new Set(after('centerY').map((s) => s.y + s.h / 2)).size).toBe(1);
  });

  it('only touches the axis it is asked about', () => {
    expect(after('left').map((s) => s.y)).toEqual([0, 100, 300]);
    expect(after('top').map((s) => s.x)).toEqual([0, 200, 400]);
  });

  it('needs at least two shapes', () => {
    const model = three();
    expect(alignMoves(model, ['a'], 'left')).toEqual([]);
    expect(alignMoves(model, [], 'left')).toEqual([]);
  });
});

describe('distributeMoves', () => {
  it('leaves equal gaps between shapes of different sizes', () => {
    const model = three();
    applyMoves(model, distributeMoves(model, ['a', 'b', 'c'], 'horizontal'));
    const [a, b, c] = ['a', 'b', 'c'].map((id) => getShape(model, id)!);

    const firstGap = b.x - (a.x + a.w);
    const secondGap = c.x - (b.x + b.w);
    expect(firstGap).toBeCloseTo(secondGap);
  });

  it('leaves the outermost shapes where they are', () => {
    const model = three();
    applyMoves(model, distributeMoves(model, ['a', 'b', 'c'], 'horizontal'));
    expect(getShape(model, 'a')!.x).toBe(0);
    expect(getShape(model, 'c')!.x).toBe(400);
  });

  it('distributes vertically too', () => {
    const model = three();
    applyMoves(model, distributeMoves(model, ['a', 'b', 'c'], 'vertical'));
    const [a, b, c] = ['a', 'b', 'c'].map((id) => getShape(model, id)!);
    expect(b.y - (a.y + a.h)).toBeCloseTo(c.y - (b.y + b.h));
  });

  it('needs at least three shapes to mean anything', () => {
    const model = three();
    expect(distributeMoves(model, ['a', 'b'], 'horizontal')).toEqual([]);
  });

  it('works regardless of the order the shapes were selected in', () => {
    const model = three();
    const forwards = distributeMoves(model, ['a', 'b', 'c'], 'horizontal');
    const backwards = distributeMoves(model, ['c', 'b', 'a'], 'horizontal');
    expect(backwards).toEqual(forwards);
  });
});

describe('outermost', () => {
  it('drops a selected shape that sits inside another selected one', () => {
    const model = createEmptyModel();
    const group = addGroup(model, 0, 0);
    const container = children(model, group.id)[0];
    const item = children(model, container.id)[0];

    const kept = outermost(model, [group.id, container.id, item.id]);
    expect(kept.map((s) => s.id)).toEqual([group.id]);
  });

  it('keeps unrelated shapes', () => {
    const model = createEmptyModel();
    const a = addGroup(model, 0, 0);
    const b = addGroup(model, 900, 0);
    expect(outermost(model, [a.id, b.id])).toHaveLength(2);
  });

  it('ignores ids that are not in the model', () => {
    expect(outermost(three(), ['a', 'ghost'])).toHaveLength(1);
  });
});

describe('applyMoves', () => {
  it('carries descendants along', () => {
    const model = createEmptyModel();
    const group = addGroup(model, 0, 0);
    const item = model.shapes.find((s) => s.type === 'item')!;
    const before = item.x;

    applyMoves(model, [{ id: group.id, dx: 50, dy: 0 }]);
    expect(getShape(model, item.id)!.x).toBe(before + 50);
  });

  it('does nothing for a zero move', () => {
    const model = three();
    applyMoves(model, [{ id: 'a', dx: 0, dy: 0 }]);
    expect(getShape(model, 'a')!.x).toBe(0);
  });

  it('aligning a group moves it as a whole, not its parts separately', () => {
    const model = createEmptyModel();
    const a = addGroup(model, 0, 0);
    const b = addGroup(model, 400, 200);
    const bItem = children(model, children(model, b.id)[0].id)[0];
    const offset = { x: bItem.x - b.x, y: bItem.y - b.y };

    applyMoves(model, alignMoves(model, [a.id, b.id], 'left'));

    const movedB = getShape(model, b.id)!;
    const movedItem = getShape(model, bItem.id)!;
    expect(movedItem.x - movedB.x).toBe(offset.x);
    expect(movedItem.y - movedB.y).toBe(offset.y);
  });
});
