'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SERVICE_ICONS, CATEGORY_LABELS } from '@/data/serviceIcons';
import { SVG_ICON_DEFS } from '@/components/icons/svgIconDefs';
import { useEditor } from '../EditorProvider';
import { useCommands, type Command } from '../hooks/useCommands';
import { SearchIcon } from '../icons/ToolIcons';

type Row =
  | { kind: 'command'; command: Command }
  | { kind: 'service'; key: string; label: string; description?: string; category: string };

const MAX_SERVICES = 40;

function score(haystack: string, needle: string): number {
  const text = haystack.toLowerCase();
  if (!needle) return 1;
  const index = text.indexOf(needle);
  if (index === -1) return 0;
  // Prefix matches rank above substring matches.
  return index === 0 ? 3 : 2;
}

/**
 * Command palette.
 *
 * Searches commands and the 189-service catalogue in one field, which is what
 * lets the permanent sidebar go away and give the canvas its width back.
 */
/** Mounts the palette only while it is open, so each open starts blank. */
export function CommandPalette() {
  const { ui } = useEditor();
  if (!ui.paletteOpen) return null;
  return <PaletteContents />;
}

function PaletteContents() {
  const { dispatchUi, t } = useEditor();
  const commands = useCommands();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The palette is remounted on each open (see the `key` in PaletteHost), so
    // the only thing left to do here is take focus.
    inputRef.current?.focus();
  }, []);

  const rows = useMemo<Row[]>(() => {
    const needle = query.trim().toLowerCase();

    const matchedCommands = commands
      .filter((c) => c.enabled !== false)
      .map((c) => ({ command: c, rank: score(c.label, needle) }))
      .filter((r) => r.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .map<Row>((r) => ({ kind: 'command', command: r.command }));

    const matchedServices = SERVICE_ICONS.map((s) => ({
      service: s,
      rank: Math.max(
        score(s.label, needle),
        score(s.key, needle),
        score(s.description ?? '', needle) * 0.5,
      ),
    }))
      .filter((r) => r.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, needle ? MAX_SERVICES : 12)
      .map<Row>((r) => ({
        kind: 'service',
        key: r.service.key,
        label: r.service.label,
        description: r.service.description,
        category: r.service.category,
      }));

    return [...matchedCommands, ...matchedServices];
  }, [commands, query]);

  // Clamped during render: a shrinking result list must never point past the end.
  const active = Math.min(activeIndex, Math.max(rows.length - 1, 0));

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const close = () => dispatchUi({ type: 'setPaletteOpen', open: false });

  const run = (row: Row) => {
    if (row.kind === 'command') row.command.run();
    else {
      const service = SERVICE_ICONS.find((s) => s.key === row.key);
      if (service) commands.addService(service);
    }
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(rows.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + rows.length) % Math.max(rows.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = rows[active];
      if (row) run(row);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const firstServiceIndex = rows.findIndex((r) => r.kind === 'service');

  return (
    <div className="palette-backdrop" onPointerDown={close}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.placeholder')}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="palette-search">
          <SearchIcon size={16} />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder={t('palette.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={`palette-row-${active}`}
          />
        </div>

        <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
          {rows.length === 0 && <p className="palette-empty">{t('palette.empty')}</p>}
          {rows.map((row, index) => (
            <div key={row.kind === 'command' ? row.command.id : row.key}>
              {index === 0 && row.kind === 'command' && (
                <p className="palette-group">{t('palette.commands')}</p>
              )}
              {index === firstServiceIndex && (
                <p className="palette-group">{t('palette.services')}</p>
              )}
              <button
                type="button"
                id={`palette-row-${index}`}
                data-index={index}
                role="option"
                aria-selected={index === active}
                className={`palette-row${index === active ? ' is-active' : ''}`}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => run(row)}
              >
                {row.kind === 'service' ? (
                  <>
                    <svg className="palette-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <use href={`#i-${row.key}`} width={24} height={24} />
                    </svg>
                    <span className="palette-label">{row.label}</span>
                    <span className="palette-meta">
                      {CATEGORY_LABELS[row.category as keyof typeof CATEGORY_LABELS] ??
                        row.category}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="palette-icon" aria-hidden="true">
                      {row.command.icon}
                    </span>
                    <span className="palette-label">{row.command.label}</span>
                    {row.command.shortcut && (
                      <kbd className="palette-meta">{row.command.shortcut}</kbd>
                    )}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* The palette renders above the canvas in a portal-like overlay, so it
          needs its own copy of the sprite for <use href="#i-..."> to resolve. */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs dangerouslySetInnerHTML={{ __html: SVG_ICON_DEFS }} />
      </svg>
    </div>
  );
}
