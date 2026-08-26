'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DiagramModel, DiagramVersion } from '@/lib/domain';
import { useParams } from 'next/navigation';
import { thumbnailDataUrl } from '@/lib/store/thumbnail';
import { renderThumbnail } from '@/lib/store/thumbnail';
import { useRepository } from '@/components/app/RepositoryProvider';
import { useEditor } from '../EditorProvider';
import { CloseIcon } from '@/components/icons/ToolIcons';
import { useReturnFocusToCanvas } from '@/lib/editor/returnFocus';

interface VersionPanelProps {
  onSnapshot: (model: DiagramModel) => void;
  onRestored: () => void;
}

/**
 * The version timeline.
 *
 * Restoring goes through the repository, which snapshots the current state first
 * — so restoring is itself undoable — and then the editor is reloaded from what
 * was written, rather than the panel guessing at the new state.
 */
export function VersionPanel({ onSnapshot, onRestored }: VersionPanelProps) {
  useReturnFocusToCanvas();
  const repository = useRepository();
  const { doc, dispatch, dispatchUi, ui, t } = useEditor();
  const params = useParams<{ id: string }>();
  const diagramId = params?.id ?? '';

  const [versions, setVersions] = useState<DiagramVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!diagramId) return;
    try {
      setVersions(await repository.listVersions(diagramId));
    } finally {
      setLoading(false);
    }
  }, [repository, diagramId]);

  useEffect(() => {
    void refresh();
  }, [refresh, doc.model]);

  const restore = async (version: DiagramVersion) => {
    setBusy(true);
    try {
      const restored = await repository.restoreVersion(diagramId, version.id);
      // Replace rather than load, so the user can undo the restore in the editor.
      dispatch({ type: 'replaceModel', model: restored.model });
      dispatchUi({ type: 'clearSelection' });
      onRestored();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="side-panel" aria-label={t('versions.title')}>
      <header className="code-panel-header">
        <strong className="side-panel-title">{t('versions.title')}</strong>
        <span className="code-panel-spacer" />
        <button
          type="button"
          className="button is-small"
          onClick={() => {
            onSnapshot(doc.model);
            dispatchUi({ type: 'toast', message: t('versions.saved') });
          }}
        >
          {t('versions.snapshot')}
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={t('modal.close')}
          onClick={() => dispatchUi({ type: 'toggleVersions' })}
        >
          <CloseIcon size={16} />
        </button>
      </header>

      <div className="version-list">
        <article className="version-row is-current">
          <span className="version-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL */}
            <img src={thumbnailDataUrl(renderThumbnail(doc.model, ui.dark))} alt="" />
          </span>
          <span className="version-meta">
            <b>{t('versions.current')}</b>
            <small>
              {doc.model.shapes.length} · {doc.model.connectors.length}
            </small>
          </span>
        </article>

        {loading && <p className="library-note">{t('library.loading')}</p>}
        {!loading && versions.length === 0 && <p className="library-note">{t('versions.empty')}</p>}

        {versions.map((version) => (
          <article key={version.id} className="version-row">
            <span className="version-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL */}
              <img src={thumbnailDataUrl(renderThumbnail(version.model, ui.dark))} alt="" />
            </span>
            <span className="version-meta">
              <b>
                {new Date(version.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </b>
              <small>
                {new Date(version.createdAt).toLocaleDateString()}
                {version.label ? ` · ${version.label}` : ''}
              </small>
            </span>
            <button
              type="button"
              className="button is-small"
              disabled={busy}
              onClick={() => void restore(version)}
            >
              {t('versions.restore')}
            </button>
          </article>
        ))}
      </div>
    </aside>
  );
}
