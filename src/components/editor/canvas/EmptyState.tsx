'use client';

import { useEditor } from '../EditorProvider';
import { SearchIcon, TemplateIcon } from '@/components/icons/ToolIcons';

/** Shown on a blank canvas: three ways to start, each one clickable. */
export function EmptyState() {
  const { dispatchUi, t } = useEditor();
  const shortcut =
    typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K';

  return (
    <div className="empty-state">
      <h2 className="empty-state-title">{t('canvas.empty.title')}</h2>
      <div className="empty-state-actions">
        <button
          type="button"
          className="empty-state-action"
          onClick={() => dispatchUi({ type: 'setPaletteOpen', open: true })}
        >
          <SearchIcon size={16} />
          {t('canvas.empty.search', { key: shortcut })}
        </button>
        <button
          type="button"
          className="empty-state-action"
          onClick={() => dispatchUi({ type: 'setModal', modal: 'templates' })}
        >
          <TemplateIcon size={16} />
          {t('canvas.empty.template')}
        </button>
        <button
          type="button"
          className="empty-state-action"
          onClick={() => dispatchUi({ type: 'setModal', modal: 'markdown' })}
        >
          {t('canvas.empty.import')}
        </button>
      </div>
    </div>
  );
}
