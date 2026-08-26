'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DiagramMeta } from '@/lib/domain';
import { createEmptyModel } from '@/lib/engine';
import { TEMPLATES } from '@/lib/editor/templates';
import { thumbnailDataUrl } from '@/lib/store/thumbnail';
import { useLocale } from '@/lib/i18n/useLocale';
import { useRepository, useRepositoryReady } from '../app/RepositoryProvider';
import { useUser } from '../app/AuthProvider';
import { CopyIcon, SearchIcon, TemplateIcon, TrashIcon } from '@/components/icons/ToolIcons';
import { WorkspaceActions } from './WorkspaceActions';
import { NewDiagramDialog } from './NewDiagramDialog';

const NO_FOLDER = '__none__';

/** The diagram library: everything stored, with a way into each one. */
export function Library() {
  const repository = useRepository();
  const ready = useRepositoryReady();
  const router = useRouter();
  const { user } = useUser();

  const [items, setItems] = useState<DiagramMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const { t } = useLocale();

  // `loading` starts true, so nothing needs setting before the read; a refresh
  // leaves the current list on screen rather than flashing a spinner.
  const refresh = useCallback(async () => {
    try {
      setItems(await repository.list());
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, refresh]);

  const folders = useMemo(() => {
    const names = new Set<string>();
    for (const item of items) if (item.folder) names.add(item.folder);
    return [...names].sort();
  }, [items]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (folder === NO_FOLDER && item.folder) return false;
      if (folder && folder !== NO_FOLDER && item.folder !== folder) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle)
      );
    });
  }, [items, query, folder]);

  const create = useCallback(
    async (title: string, model = createEmptyModel()) => {
      const created = await repository.create({ title, model });
      router.push(`/d/${created.id}`);
    },
    [repository, router],
  );

  return (
    <div className="library">
      <header className="library-header">
        <div className="library-identity">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size brand mark */}
          <img src="/aion_logo.png" alt="" className="topbar-logo" />
          <span className="topbar-title">{t('app.title')}</span>
        </div>
        <span className="topbar-divider" />
        <span className="library-user">{user.name}</span>
        <span className="library-spacer" />
        <WorkspaceActions onChanged={refresh} t={t} />
        <button type="button" className="button is-primary" onClick={() => setPicking(true)}>
          {t('library.new')}
        </button>
      </header>

      <div className="library-toolbar">
        <div className="library-search">
          <SearchIcon size={15} />
          <input
            className="library-search-input"
            placeholder={t('library.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {folders.length > 0 && (
          <div className="library-folders">
            <button
              type="button"
              className={`library-folder${folder === null ? ' is-active' : ''}`}
              onClick={() => setFolder(null)}
            >
              {t('library.all')}
            </button>
            {folders.map((name) => (
              <button
                key={name}
                type="button"
                className={`library-folder${folder === name ? ' is-active' : ''}`}
                onClick={() => setFolder(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <main className="library-body">
        {loading && <p className="library-note">{t('library.loading')}</p>}

        {!loading && items.length === 0 && (
          <section className="library-start">
            <h2>{t('library.emptyTitle')}</h2>
            <p>{t('library.emptyHint')}</p>
            <div className="library-templates">
              <button
                type="button"
                className="template-card"
                onClick={() => void create(t('app.untitled'))}
              >
                <span className="template-icon">＋</span>
                <span>
                  <b>{t('library.blank')}</b>
                  <small>{t('library.blankHint')}</small>
                </span>
              </button>
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="template-card"
                  onClick={() => void create(template.name, template.build())}
                >
                  <span className="template-icon">{template.icon}</span>
                  <span>
                    <b>{template.name}</b>
                    <small>{template.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {!loading && items.length > 0 && visible.length === 0 && (
          <p className="library-note">{t('library.noMatches')}</p>
        )}

        {visible.length > 0 && (
          <ul className="library-grid">
            {visible.map((item) => (
              <li key={item.id} className="library-card">
                <button
                  type="button"
                  className="library-card-open"
                  onClick={() => router.push(`/d/${item.id}`)}
                >
                  <span className="library-thumb">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL
                      <img src={thumbnailDataUrl(item.thumbnail)} alt="" />
                    ) : (
                      <TemplateIcon size={22} />
                    )}
                  </span>
                  <span className="library-card-title">{item.title}</span>
                  <span className="library-card-meta">
                    {new Date(item.updatedAt).toLocaleDateString()}
                    {item.folder ? ` · ${item.folder}` : ''}
                  </span>
                </button>
                <div className="library-card-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title={t('action.duplicate')}
                    aria-label={`${t('action.duplicate')}: ${item.title}`}
                    onClick={() => void repository.duplicate(item.id).then(refresh)}
                  >
                    <CopyIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-button is-danger"
                    title={t('action.delete')}
                    aria-label={`${t('action.delete')}: ${item.title}`}
                    onClick={() => {
                      if (!window.confirm(t('library.confirmDelete', { title: item.title })))
                        return;
                      void repository.delete(item.id).then(refresh);
                    }}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {picking && (
        <NewDiagramDialog
          t={t}
          onClose={() => setPicking(false)}
          onPick={(title, model) => {
            setPicking(false);
            void create(title, model);
          }}
        />
      )}
    </div>
  );
}
