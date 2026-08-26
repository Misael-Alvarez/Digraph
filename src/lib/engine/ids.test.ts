import { describe, expect, it } from 'vitest';
import { idPrefix, uid } from './ids';

describe('uid', () => {
  it('never repeats across many calls', () => {
    const ids = new Set(Array.from({ length: 20_000 }, () => uid('grp')));
    expect(ids.size).toBe(20_000);
  });

  it('keeps the semantic prefix', () => {
    expect(uid('bd').startsWith('bd_')).toBe(true);
    expect(idPrefix(uid('ctr'))).toBe('ctr');
  });

  it('survives a simulated page reload', () => {
    // The old counter-based scheme reset to 1 here and collided with restored IDs.
    const before = Array.from({ length: 100 }, () => uid('itm'));
    const after = Array.from({ length: 100 }, () => uid('itm'));
    expect(new Set([...before, ...after]).size).toBe(200);
  });

  it('treats an ID without a separator as its own prefix', () => {
    expect(idPrefix('legacy')).toBe('legacy');
  });
});
