'use client';

import { useEffect, useRef, useState } from 'react';
import { createEmptyModel } from '@/lib/engine';
import { safeParseDiagramModel } from '@/lib/domain';
import { EditorProvider, useEditor } from './EditorProvider';
import { Canvas } from './canvas/Canvas';
import { CommandPalette } from './chrome/CommandPalette';
import { InspectorPanel } from './chrome/InspectorPanel';
import { Minimap } from './chrome/Minimap';
import { Modals } from './chrome/Modals';
import { StatusBar } from './chrome/StatusBar';
import { ToolDock } from './chrome/ToolDock';
import { TopBar } from './chrome/TopBar';
import { ZoomControls } from './chrome/ZoomControls';
import { useKeyboard } from './hooks/useKeyboard';

/** Tracks the canvas element size for fit-to-view and the minimap viewport box. */
function useCanvasSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = document.querySelector('.canvas-surface');
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return size;
}

function Toast() {
  const { ui } = useEditor();
  if (!ui.toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {ui.toast}
    </div>
  );
}

/** Turns a completed cloud switch into a status message. */
function CloudSwitchAnnouncer() {
  const { doc, dispatchUi, t } = useEditor();
  const lastReported = useRef<unknown>(null);

  useEffect(() => {
    const result = doc.lastCloudSwitch;
    if (!result || result === lastReported.current) return;
    lastReported.current = result;

    let message = t('toast.switched', { count: result.switched, cloud: '' }).trim();
    if (result.skipped.length) {
      message += ` · ${t('toast.noEquivalent', {
        count: result.skipped.length,
        names: result.skipped.slice(0, 3).join(', '),
      })}`;
    }
    dispatchUi({ type: 'toast', message });
  }, [doc.lastCloudSwitch, dispatchUi, t]);

  return null;
}

function EditorShell() {
  useKeyboard();
  const { dispatch, dispatchUi, t } = useEditor();
  const size = useCanvasSize();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="editor-root">
      <TopBar />
      <main className="editor-stage">
        <Canvas />
        <ToolDock />
        <InspectorPanel />
        <ZoomControls size={size} />
        <Minimap size={size} />
      </main>
      <StatusBar />

      <CommandPalette />
      <Modals />
      <Toast />
      <CloudSwitchAnnouncer />

      <input
        ref={fileInput}
        data-open-project
        type="file"
        accept=".json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const parsed = safeParseDiagramModel(JSON.parse(String(reader.result) || 'null'));
            if (!parsed.success) {
              dispatchUi({ type: 'toast', message: t('toast.invalidFile') });
              return;
            }
            dispatch({ type: 'load', model: parsed.data });
          };
          reader.readAsText(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function DiagramEditor() {
  return (
    <EditorProvider initialModel={createEmptyModel()}>
      <EditorShell />
    </EditorProvider>
  );
}
