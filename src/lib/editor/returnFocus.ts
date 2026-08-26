'use client';

import { useEffect } from 'react';

/**
 * Hands focus back to the canvas when a side panel unmounts.
 *
 * Without this the browser leaves `document.activeElement` on the removed node,
 * and since that node is a text field the global shortcut handler treats every
 * later keystroke as typing — the whole keyboard stops working until the user
 * clicks the canvas.
 */
export function useReturnFocusToCanvas(): void {
  useEffect(
    () => () => {
      const active = document.activeElement as HTMLElement | null;
      if (active && active.isConnected) return;
      const canvas = document.querySelector<SVGSVGElement>('.canvas-surface');
      canvas?.focus?.();
      if (document.activeElement === active) active?.blur?.();
    },
    [],
  );
}
