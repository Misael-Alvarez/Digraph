'use client';

import type { MessageKey } from '@/lib/i18n/messages';
import { useEditor } from '../EditorProvider';

const HINTS: Record<string, MessageKey> = {
  select: 'hint.select',
  boundary: 'hint.boundary',
  subboundary: 'hint.subboundary',
  group: 'hint.group',
  item: 'hint.item',
};

export function StatusBar() {
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
      <span className="statusbar-meta is-muted">{t('status.saved')}</span>
    </footer>
  );
}
