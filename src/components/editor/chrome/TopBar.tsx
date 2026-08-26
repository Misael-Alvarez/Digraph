'use client';

import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/messages';
import type { BrandMode } from '@/lib/editor';
import { useEditor } from '../EditorProvider';
import { useCommands } from '../hooks/useCommands';
import { MoonIcon, RedoIcon, SearchIcon, SunIcon, UndoIcon } from '../icons/ToolIcons';

const BRANDS: BrandMode[] = ['aion', 'banorte', 'dual', 'none'];
const BRAND_LABEL: Record<BrandMode, string> = {
  aion: 'AION',
  banorte: 'Banorte',
  dual: 'AION × Banorte',
  none: '—',
};

/** Minimal top bar: identity on the left, view controls on the right. */
export function TopBar() {
  const { ui, dispatchUi, canUndo, canRedo, t } = useEditor();
  const commands = useCommands();
  const run = (id: string) => commands.find((c) => c.id === id)?.run();

  return (
    <header className="topbar">
      <div className="topbar-identity">
        {ui.brand === 'aion' || ui.brand === 'dual' ? (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size brand mark, not content
          <img src="/aion_logo.png" alt="" className="topbar-logo" />
        ) : null}
        {ui.brand === 'banorte' || ui.brand === 'dual' ? (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size brand mark, not content
          <img src="/banorte_logo.png" alt="" className="topbar-logo is-wide" />
        ) : null}
        <span className="topbar-title">{t('app.title')}</span>
      </div>

      <button
        type="button"
        className="topbar-search"
        onClick={() => dispatchUi({ type: 'setPaletteOpen', open: true })}
      >
        <SearchIcon size={14} />
        <span>{t('palette.placeholder')}</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          disabled={!canUndo}
          title={t('action.undo')}
          aria-label={t('action.undo')}
          onClick={() => run('undo')}
        >
          <UndoIcon size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          disabled={!canRedo}
          title={t('action.redo')}
          aria-label={t('action.redo')}
          onClick={() => run('redo')}
        >
          <RedoIcon size={16} />
        </button>

        <span className="topbar-divider" />

        <select
          className="topbar-select"
          value={ui.brand}
          aria-label="Brand"
          onChange={(e) => dispatchUi({ type: 'setBrand', brand: e.target.value as BrandMode })}
        >
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {BRAND_LABEL[b]}
            </option>
          ))}
        </select>

        <select
          className="topbar-select"
          value={ui.locale}
          aria-label="Language"
          onChange={(e) =>
            dispatchUi({ type: 'setLocale', locale: e.target.value as (typeof LOCALES)[number] })
          }
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_LABELS[l]}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="icon-button"
          title={t('action.toggleTheme')}
          aria-label={t('action.toggleTheme')}
          aria-pressed={ui.dark}
          onClick={() => dispatchUi({ type: 'toggleDark' })}
        >
          {ui.dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
      </div>
    </header>
  );
}
