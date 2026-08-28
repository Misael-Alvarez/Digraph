'use client';

import { useRouter } from 'next/navigation';
import { AcMark } from '@/components/brand/AcGraphLogo';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/messages';
import type { SaveStatus } from '@/components/app/useDiagramDocument';
import type { BrandMode } from '@/lib/editor';
import { shortcut } from '@/lib/editor/platform';
import { useEditor } from '../EditorProvider';
import { useCommands } from '../hooks/useCommands';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  MoonIcon,
  RedoIcon,
  SearchIcon,
  ShareIcon,
  SparkleIcon,
  SunIcon,
  UndoIcon,
} from '@/components/icons/ToolIcons';

const BRANDS: BrandMode[] = ['aion', 'banorte', 'dual', 'none'];
const BRAND_LABEL: Record<BrandMode, string> = {
  aion: 'AION',
  banorte: 'Banorte',
  dual: 'AION × Banorte',
  none: '—',
};

interface TopBarProps {
  title: string;
  status: SaveStatus;
  onRename: (title: string) => void;
}

const STATUS_KEY = {
  saved: 'status.saved',
  pending: 'status.pending',
  saving: 'status.saving',
  error: 'status.error',
} as const;

/**
 * A native `<select>` with the platform chrome taken off it.
 *
 * The two selectors used to be the only OS-drawn controls in the app and stood
 * out against everything around them. Keeping the real element — rather than
 * building a menu — keeps the keyboard behaviour and the mobile picker for free.
 */
function Select({
  value,
  label,
  name,
  onChange,
  children,
}: {
  value: string;
  label: string;
  /** Which control this is, so the narrow-screen rules can drop one and
      keep the other rather than guessing by document order. */
  name: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="select-wrap" data-select={name}>
      <select
        className="topbar-select"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <ChevronDownIcon size={13} className="select-chevron" />
    </span>
  );
}

/** Minimal top bar: identity on the left, view controls on the right. */
export function TopBar({ title, status, onRename }: TopBarProps) {
  const { ui, dispatchUi, canUndo, canRedo, t } = useEditor();
  const commands = useCommands();
  const router = useRouter();
  const run = (id: string) => commands.find((c) => c.id === id)?.run();

  return (
    <header className="topbar">
      <div className="topbar-identity">
        <button
          type="button"
          className="topbar-back"
          title={t('library.back')}
          aria-label={t('library.back')}
          onClick={() => router.push('/')}
        >
          {/* The app's own mark doubles as the way out: it is where every
              product of this shape puts the way back to the file list. */}
          <AcMark size={18} className="topbar-back-mark" />
          <ArrowLeftIcon size={16} className="topbar-back-arrow" />
        </button>

        <input
          className="topbar-name"
          value={title}
          aria-label={t('inspector.label')}
          onChange={(e) => onRename(e.target.value)}
        />
        <span className={`save-status is-${status}`}>
          <span className="save-dot" aria-hidden="true" />
          {t(STATUS_KEY[status])}
        </span>
      </div>

      <button
        type="button"
        className="topbar-search"
        onClick={() => dispatchUi({ type: 'setPaletteOpen', open: true })}
      >
        <SearchIcon size={14} />
        <span>{t('palette.placeholder')}</span>
        <kbd>{shortcut('K')}</kbd>
      </button>

      <div className="topbar-actions">
        <div className="icon-cluster">
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
        </div>

        <span className="topbar-divider" />

        <Select
          value={ui.brand}
          label="Brand"
          name="brand"
          onChange={(brand) => dispatchUi({ type: 'setBrand', brand: brand as BrandMode })}
        >
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {BRAND_LABEL[b]}
            </option>
          ))}
        </Select>

        <Select
          value={ui.locale}
          label="Language"
          name="locale"
          onChange={(locale) =>
            dispatchUi({ type: 'setLocale', locale: locale as (typeof LOCALES)[number] })
          }
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_LABELS[l]}
            </option>
          ))}
        </Select>

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

        <span className="topbar-divider" />

        {/* Generating a diagram and handing it to someone were reachable only
            through the palette. The AI button is labelled with the short form:
            the full phrase lives in its tooltip, and a button reading
            "Generate" beside the assistant's own Generate button would name
            two different actions the same thing. */}
        <button type="button" className="button" title={t('action.ai')} onClick={() => run('ai')}>
          <SparkleIcon size={15} />
          <span className="button-label">{t('topbar.ai')}</span>
        </button>
        <button
          type="button"
          className="button is-primary"
          title={t('action.share')}
          onClick={() => run('share')}
        >
          <ShareIcon size={15} />
          <span className="button-label">{t('topbar.share')}</span>
        </button>
      </div>
    </header>
  );
}
