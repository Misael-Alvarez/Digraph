'use client';

import { useMemo, useState } from 'react';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_ICONS,
} from '@/data/serviceIcons';
import { ALL_SYMBOLS } from '@/components/icons/svgIconDefs';
import { scoreMatch } from '@/lib/editor/search';
import type { ServiceIcon } from '@/lib/editor';
import { useEditor } from '../EditorProvider';
import { useCommands } from '../hooks/useCommands';
import { useReturnFocusToCanvas } from '@/lib/editor/returnFocus';
import { CloseIcon, SearchIcon } from '@/components/icons/ToolIcons';

/** Clouds in the order they are offered, with the count of services in each. */
const CLOUD_ORDER = ['aws', 'azure', 'gcp', 'oci', 'ibm', 'aion', 'generic'] as const;

/**
 * The service browser.
 *
 * The command palette answers "I know what I want"; this answers "show me what
 * there is". With 572 services across seven providers, one flat list is not a
 * browsable thing — so the cloud is a tab and the functional area is a section
 * inside it, which is the shape the catalogue actually has.
 */
export function ServiceBrowser() {
  const { dispatchUi, t } = useEditor();
  const commands = useCommands();
  useReturnFocusToCanvas();

  const [cloud, setCloud] = useState<string>('aws');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const countsByCloud = useMemo(() => {
    const counts = new Map<string, number>();
    for (const service of SERVICE_ICONS) {
      counts.set(service.category, (counts.get(service.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  const needle = query.trim().toLowerCase();

  /** Searching looks across every cloud; browsing stays within the chosen tab. */
  const visible = useMemo(() => {
    const pool = needle ? SERVICE_ICONS : SERVICE_ICONS.filter((s) => s.category === cloud);
    if (!needle) return pool;
    return pool
      .map((service) => ({
        service,
        rank: Math.max(
          scoreMatch(service.label, needle),
          scoreMatch(service.key, needle),
          scoreMatch(service.description ?? '', needle) * 0.5,
        ),
      }))
      .filter((entry) => entry.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .map((entry) => entry.service);
  }, [needle, cloud]);

  const sections = useMemo(() => {
    const grouped = new Map<string, ServiceIcon[]>();
    for (const service of visible) {
      const area = service.subcategory ?? 'other';
      const bucket = grouped.get(area);
      if (bucket) bucket.push(service);
      else grouped.set(area, [service]);
    }
    return SERVICE_CATEGORIES.map((category) => ({
      ...category,
      services: (grouped.get(category.id) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
    })).filter((section) => section.services.length > 0);
  }, [visible]);

  const toggleSection = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <aside className="side-panel is-left" aria-label={t('browser.title')}>
      <header className="code-panel-header">
        <strong className="side-panel-title">{t('browser.title')}</strong>
        <span className="code-panel-spacer" />
        <span className="browser-count">{t('browser.count', { count: visible.length })}</span>
        <button
          type="button"
          className="icon-button"
          aria-label={t('modal.close')}
          onClick={() => dispatchUi({ type: 'toggleBrowser' })}
        >
          <CloseIcon size={16} />
        </button>
      </header>

      <div className="browser-search">
        <SearchIcon size={14} />
        <input
          className="browser-search-input"
          placeholder={t('browser.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="icon-button"
            aria-label={t('modal.close')}
            onClick={() => setQuery('')}
          >
            <CloseIcon size={12} />
          </button>
        )}
      </div>

      {!needle && (
        <div className="browser-clouds" role="tablist" aria-label={t('browser.title')}>
          {CLOUD_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={cloud === id}
              className={`browser-cloud${cloud === id ? ' is-active' : ''}`}
              title={CATEGORY_LABELS[id]}
              style={{ '--cloud-color': CATEGORY_COLORS[id] } as React.CSSProperties}
              onClick={() => setCloud(id)}
            >
              <span className="browser-cloud-dot" />
              {CATEGORY_SHORT_LABELS[id] ?? CATEGORY_LABELS[id]}
              <span className="browser-cloud-count">{countsByCloud.get(id) ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className="browser-list">
        {sections.length === 0 && <p className="library-note">{t('browser.empty')}</p>}

        {sections.map((section) => {
          const isCollapsed = collapsed.has(section.id);
          return (
            <section key={section.id} className="browser-section">
              <button
                type="button"
                className="browser-section-header"
                aria-expanded={!isCollapsed}
                onClick={() => toggleSection(section.id)}
              >
                <span
                  className={`inspector-chevron${isCollapsed ? '' : ' is-open'}`}
                  aria-hidden="true"
                />
                {section.label}
                <span className="browser-section-count">{section.services.length}</span>
              </button>

              {!isCollapsed && (
                <ul className="browser-grid">
                  {section.services.map((service) => (
                    <li key={service.key}>
                      <button
                        type="button"
                        className="browser-tile"
                        title={service.description || service.label}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', service.key);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => commands.addService(service)}
                      >
                        <svg className="browser-tile-icon" viewBox="0 0 24 24" aria-hidden="true">
                          <use href={`#i-${service.key}`} width={24} height={24} />
                        </svg>
                        <span className="browser-tile-label">{service.label}</span>
                        {needle && (
                          <span className="browser-tile-cloud">
                            {CATEGORY_LABELS[service.category]}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <footer className="browser-footer">{t('browser.hint')}</footer>

      {/* The browser shows icons for every service, so it carries the whole
          sprite. Exports build a minimal one from the diagram instead. */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs dangerouslySetInnerHTML={{ __html: ALL_SYMBOLS }} />
      </svg>
    </aside>
  );
}
