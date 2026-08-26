import { describe, expect, it } from 'vitest';
import { labelAnchor, waypointsToPath } from './connectorPath';

describe('waypointsToPath', () => {
  it('returns nothing for a degenerate path', () => {
    expect(waypointsToPath([])).toBe('');
    expect(waypointsToPath([{ x: 0, y: 0 }])).toBe('');
  });

  it('draws a straight line between two points', () => {
    expect(
      waypointsToPath([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]),
    ).toBe('M0,0 L100,0');
  });

  it('rounds an elbow with a quadratic curve', () => {
    const path = waypointsToPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      10,
    );
    expect(path).toBe('M0,0 L90,0 Q100,0 100,10 L100,100');
  });

  it('shrinks the radius so short segments cannot overshoot', () => {
    const path = waypointsToPath(
      [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 6, y: 6 },
      ],
      20,
    );
    // Radius clamps to half of the 6px segments.
    expect(path).toBe('M0,0 L3,0 Q6,0 6,3 L6,6');
  });

  it('handles several bends', () => {
    const path = waypointsToPath([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 50 },
    ]);
    expect(path.match(/Q/g)).toHaveLength(2);
    expect(path.startsWith('M0,0')).toBe(true);
    expect(path.endsWith('L100,50')).toBe(true);
  });

  it('skips the curve when the radius collapses to zero', () => {
    const path = waypointsToPath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 50 },
      ],
      8,
    );
    expect(path).not.toContain('Q');
  });
});

describe('labelAnchor', () => {
  it('returns null for a degenerate path', () => {
    expect(labelAnchor([{ x: 0, y: 0 }])).toBeNull();
  });

  it('uses the midpoint of a straight run', () => {
    expect(
      labelAnchor([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]),
    ).toEqual({ x: 50, y: 0 });
  });

  it('picks the midpoint of the longest segment, not a bend', () => {
    const anchor = labelAnchor([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 400 },
      { x: 40, y: 400 },
    ]);
    expect(anchor).toEqual({ x: 20, y: 200 });
  });
});
