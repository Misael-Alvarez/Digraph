'use client';

import type { MessageKey } from '@/lib/i18n/messages';
import type { SaveStatus } from '@/components/app/useDiagramDocument';
import { useEditor } from '../EditorProvider';

const HINTS: Record<string, MessageKey> = {
  select: 'hint.select',
  boundary: 'hint.boundary',
  subboundary: 'hint.subboundary',
  group: 'hint.group',
  item: 'hint.item',
};

export function StatusBar({ status }: { status: SaveStatus }) {
  const { doc, ui, t } = useEditor();

  const hint =
    ui.tool === 'connector'
      ? ui.connectorSourceId
        ? t('hint.connectorTarget')
        : t('hint.connectorSource')
      : HINTS[ui.tool]
        ? t(HINTS[ui.tool])
        : '';

  return (
    <footer className="statusbar">
      <span className="statusbar-hint">{hint}</span>
      <span className="statusbar-meta">
        {t('status.shapes', { count: doc.model.shapes.length })}
      </span>
      <span className="statusbar-meta">
        {t('status.connectors', { count: doc.model.connectors.length })}
      </span>
      <span className={`statusbar-meta save-status is-${status}`}>
        {t(
          status === 'saving'
            ? 'status.saving'
            : status === 'error'
              ? 'status.error'
              : status === 'pending'
                ? 'status.pending'
                : 'status.saved',
        )}
      </span>
    </footer>
  );
}
