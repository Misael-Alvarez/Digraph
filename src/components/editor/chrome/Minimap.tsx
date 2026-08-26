'use client';

import { useMemo } from 'react';
import { contentBBox } from '@/lib/engine';
import { canvasTheme, providerColors } from '@/lib/design/tokens';
import { visibleBox } from '@/lib/editor/viewport';
import { useEditor } from '../EditorProvider';
import { CloseIcon } from '../icons/ToolIcons';

const WIDTH = 190;
const HEIGHT = 128;

export function Minimap({ size }: { size: { width: number; height: number } }) {
  const { doc, ui, dispatchUi, t } = useEditor();
  const theme = canvasTheme(ui.dark);

  const box = useMemo(() => contentBBox(doc.model), [doc.model]);
  const viewBox = useMemo(() => {
    const pad = Math.max(box.w, box.h) * 0.06 + 40;
    return { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
  }, [box]);

  if (!ui.minimapOpen || !doc.model.shapes.length) return null;

  const view = size.width ? visibleBox(ui.viewport, size) : null;
  const strokeScale = viewBox.w / WIDTH;

  return (
    <div className="minimap" aria-label={t('action.toggleMinimap')}>
      <button
        type="button"
        className="minimap-close"
        aria-label={t('modal.close')}
        onClick={() => dispatchUi({ type: 'toggleMinimap' })}
      >
        <CloseIcon size={11} />
      </button>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      >
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill={theme.sheet} />
        {doc.model.shapes
          .filter((s) => s.type === 'boundary')
          .map((s) => (
            <rect
              key={s.id}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={6}
              fill={theme.groupFill}
              stroke={theme.groupStroke}
              strokeWidth={strokeScale}
            />
          ))}
        {doc.model.shapes
          .filter((s) => s.type === 'group')
          .map((s) => (
            <rect
              key={s.id}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={4}
              fill={theme.itemFill}
              stroke={theme.itemStroke}
              strokeWidth={strokeScale}
            />
          ))}
        {doc.model.shapes
          .filter((s) => s.type === 'item')
          .map((s) => (
            <rect
              key={s.id}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={3}
              fill={providerColors.aion}
              opacity={0.55}
            />
          ))}
        {view && (
          // Where the user currently is, in canvas coordinates.
          <rect
            x={view.x}
            y={view.y}
            width={view.w}
            height={view.h}
            fill="none"
            stroke={providerColors.aion}
            strokeWidth={strokeScale * 2}
          />
        )}
      </svg>
    </div>
  );
}
