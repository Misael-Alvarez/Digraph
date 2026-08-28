'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Where the pointer is inside a surface, as CSS variables on it.
 *
 * The liquid panes catch the light where the hand is: `--mx` and `--my` place
 * the specular glow that the stylesheet paints. This is the one thing in that
 * material CSS cannot do on its own.
 *
 * Coalesced to one write per frame. A `pointermove` handler that writes a style
 * property on every event is the classic way to make a menu feel worse than the
 * one that had no effect at all.
 */
export function useLiquidPointer() {
  const frame = useRef<number | null>(null);
  const pending = useRef<{ element: HTMLElement; x: number; y: number } | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return useCallback((event: React.PointerEvent<HTMLElement>) => {
    // Read `currentTarget` now: React clears it once the handler returns, and
    // the write below happens a frame later.
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    pending.current = {
      element,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const next = pending.current;
      if (!next || !next.element.isConnected) return;
      // Pixels, not percentages: the glow is a layer that gets translated, and
      // a transform in percent would be relative to the glow's own size.
      next.element.style.setProperty('--gx', `${next.x.toFixed(0)}px`);
      next.element.style.setProperty('--gy', `${next.y.toFixed(0)}px`);
    });
  }, []);
}
