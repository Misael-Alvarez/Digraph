'use client';

import { useEffect } from 'react';
import { cloneShapes } from '@/lib/engine';
import type { ToolMode } from '@/lib/editor';
import { isTextEntryTarget } from '@/lib/editor/domFocus';
import { useEditor } from '../EditorProvider';
import { useCommands } from './useCommands';

const TOOL_KEYS: Record<string, ToolMode> = {
  v: 'select',
  b: 'boundary',
  u: 'subboundary',
  g: 'group',
  i: 'item',
  c: 'connector',
  h: 'pan',
};

/**
 * Global shortcuts.
 *
 * Every binding advertised in the menus and the shortcut sheet is implemented
 * here — the previous editor showed `Ctrl+S` next to "Save project" and
 * `Ctrl+Shift+A` next to "Deselect" while handling neither, so both fell through
 * to the browser.
 */
export function useKeyboard() {
  const { ui, doc, dispatch, dispatchUi, t } = useEditor();
  const commands = useCommands();

  useEffect(() => {
    const runCommand = (id: string) => commands.find((c) => c.id === id)?.run();

    const onKeyDown = (e: KeyboardEvent) => {
      const modifier = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // The palette must open from anywhere, including a focused text field.
      if (modifier && key === 'k') {
        e.preventDefault();
        dispatchUi({ type: 'setPaletteOpen', open: !ui.paletteOpen });
        return;
      }

      if (e.key === 'Escape') {
        if (ui.paletteOpen) dispatchUi({ type: 'setPaletteOpen', open: false });
        else if (ui.modal) dispatchUi({ type: 'setModal', modal: null });
        else {
          dispatchUi({ type: 'clearSelection' });
          dispatchUi({ type: 'setTool', tool: 'select' });
        }
        return;
      }

      if (isTextEntryTarget(e.target)) return;

      if (modifier) {
        switch (key) {
          case 'z':
            e.preventDefault();
            runCommand(e.shiftKey ? 'redo' : 'undo');
            return;
          case 'y':
            e.preventDefault();
            runCommand('redo');
            return;
          case 'a':
            e.preventDefault();
            runCommand(e.shiftKey ? 'deselect' : 'selectAll');
            return;
          case 's':
            // Without this the browser's own save dialog opens.
            e.preventDefault();
            runCommand('saveProject');
            return;
          case 'e':
            e.preventDefault();
            runCommand('exportMarkdown');
            return;
          case 'd':
            e.preventDefault();
            runCommand('duplicate');
            return;
          case '/':
            e.preventDefault();
            runCommand('toggleCode');
            return;
          case '0':
            e.preventDefault();
            runCommand('zoomReset');
            return;
          case '1':
            e.preventDefault();
            runCommand('zoomFit');
            return;
          case 'c':
            if (ui.selectedIds.size) {
              e.preventDefault();
              const payload = cloneShapes(doc.model, ui.selectedIds);
              void navigator.clipboard
                ?.writeText(JSON.stringify({ kind: 'aion-studio/shapes', payload }))
                .catch(() => undefined);
            }
            return;
          case 'v':
            navigator.clipboard
              ?.readText()
              .then((text) => {
                const parsed = JSON.parse(text) as { kind?: string; payload?: unknown };
                if (parsed.kind !== 'aion-studio/shapes' || !parsed.payload) return;
                dispatch({
                  type: 'paste',
                  payload: parsed.payload as ReturnType<typeof cloneShapes>,
                  offsetX: 40,
                  offsetY: 40,
                });
              })
              .catch(() => undefined);
            return;
          default:
            return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (ui.selectedIds.size) {
          e.preventDefault();
          runCommand('delete');
        } else if (ui.selectedConnectorId) {
          e.preventDefault();
          dispatch({ type: 'deleteConnector', id: ui.selectedConnectorId });
          dispatchUi({ type: 'clearSelection' });
        }
        return;
      }

      if (e.key === '?') {
        dispatchUi({ type: 'setModal', modal: 'shortcuts' });
        return;
      }

      // Nudge the selection with the arrow keys; Shift moves a full grid step.
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      if (e.key in nudge && ui.selectedIds.size) {
        e.preventDefault();
        const step = e.shiftKey ? 18 : 1;
        const [dx, dy] = nudge[e.key];
        dispatch({ type: 'moveShapes', ids: [...ui.selectedIds], dx: dx * step, dy: dy * step });
        return;
      }

      const tool = TOOL_KEYS[key];
      if (tool) dispatchUi({ type: 'setTool', tool });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    commands,
    ui.paletteOpen,
    ui.modal,
    ui.selectedIds,
    ui.selectedConnectorId,
    doc.model,
    dispatch,
    dispatchUi,
    t,
  ]);
}

/** Bindings shown in the shortcut sheet, kept next to the handler above. */
export const SHORTCUT_GROUPS: { title: string; items: [keys: string, description: string][] }[] = [
  {
    title: 'Tools',
    items: [
      ['V', 'tool.select'],
      ['B', 'tool.boundary'],
      ['U', 'tool.subboundary'],
      ['G', 'tool.group'],
      ['I', 'tool.item'],
      ['C', 'tool.connector'],
      ['Space', 'action.zoomFit'],
    ],
  },
  {
    title: 'Edit',
    items: [
      ['Mod+Z', 'action.undo'],
      ['Mod+Shift+Z', 'action.redo'],
      ['Mod+A', 'action.selectAll'],
      ['Mod+Shift+A', 'action.deselect'],
      ['Mod+D', 'action.duplicate'],
      ['Del', 'action.delete'],
      ['Arrows', 'action.autoLayout'],
    ],
  },
  {
    title: 'File & view',
    items: [
      ['Mod+K', 'palette.placeholder'],
      ['Mod+/', 'action.toggleCode'],
      ['Mod+S', 'action.save'],
      ['Mod+E', 'action.exportMarkdown'],
      ['Mod+0', 'action.zoomReset'],
      ['Mod+1', 'action.zoomFit'],
      ['?', 'action.shortcuts'],
    ],
  },
];
