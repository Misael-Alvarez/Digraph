'use client';

import { contentBBox } from '@/lib/engine';
import { DEFAULT_VIEWPORT, fitToBox, zoomByAtCenter } from '@/lib/editor/viewport';
import { useEditor } from '../EditorProvider';
import { FitIcon, ZoomInIcon, ZoomOutIcon } from '../icons/ToolIcons';

export function ZoomControls({ size }: { size: { width: number; height: number } }) {
  const { doc, ui, dispatchUi, t } = useEditor();
  const percent = Math.round(ui.viewport.zoom * 100);

  const setViewport = (viewport: typeof ui.viewport) =>
    dispatchUi({ type: 'setViewport', viewport });

  return (
    <div className="zoom-controls" role="group" aria-label={t('action.zoomFit')}>
      <button
        type="button"
        className="icon-button"
        title={t('action.zoomOut')}
        aria-label={t('action.zoomOut')}
        onClick={() => setViewport(zoomByAtCenter(ui.viewport, 1 / 1.2, size))}
      >
        <ZoomOutIcon size={16} />
      </button>
      <button
        type="button"
        className="zoom-value"
        title={t('action.zoomReset')}
        onClick={() => setViewport(DEFAULT_VIEWPORT)}
      >
        {percent}%
      </button>
      <button
        type="button"
        className="icon-button"
        title={t('action.zoomIn')}
        aria-label={t('action.zoomIn')}
        onClick={() => setViewport(zoomByAtCenter(ui.viewport, 1.2, size))}
      >
        <ZoomInIcon size={16} />
      </button>
      <span className="zoom-divider" />
      <button
        type="button"
        className="icon-button"
        title={t('action.zoomFit')}
        aria-label={t('action.zoomFit')}
        onClick={() => {
          const inspector = document.querySelector('.inspector')?.getBoundingClientRect();
          const dock = document.querySelector('.tool-dock')?.getBoundingClientRect();
          setViewport(
            fitToBox(contentBBox(doc.model), size, 48, {
              right: inspector ? inspector.width + 32 : 0,
              left: dock ? dock.width + 32 : 0,
            }),
          );
        }}
      >
        <FitIcon size={16} />
      </button>
    </div>
  );
}
