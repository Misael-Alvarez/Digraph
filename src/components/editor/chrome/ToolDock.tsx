'use client';

import type { ToolMode } from '@/lib/editor';
import type { MessageKey } from '@/lib/i18n/messages';
import { useEditor } from '../EditorProvider';
import {
  LayoutIcon,
  BoundaryIcon,
  ConnectorIcon,
  GroupIcon,
  ItemIcon,
  SelectIcon,
  SubBoundaryIcon,
} from '@/components/icons/ToolIcons';

interface ToolDefinition {
  mode: ToolMode;
  labelKey: MessageKey;
  shortcut: string;
  Icon: (props: { size?: number }) => React.ReactElement;
}

export const TOOLS: ToolDefinition[] = [
  { mode: 'select', labelKey: 'tool.select', shortcut: 'V', Icon: SelectIcon },
  { mode: 'boundary', labelKey: 'tool.boundary', shortcut: 'B', Icon: BoundaryIcon },
  { mode: 'subboundary', labelKey: 'tool.subboundary', shortcut: 'U', Icon: SubBoundaryIcon },
  { mode: 'group', labelKey: 'tool.group', shortcut: 'G', Icon: GroupIcon },
  { mode: 'item', labelKey: 'tool.item', shortcut: 'I', Icon: ItemIcon },
  { mode: 'connector', labelKey: 'tool.connector', shortcut: 'C', Icon: ConnectorIcon },
];

/** Floating vertical tool dock. */
export function ToolDock() {
  const { ui, dispatchUi, t } = useEditor();

  return (
    <div
      className="tool-dock"
      role="toolbar"
      aria-orientation="vertical"
      aria-label={t('app.title')}
    >
      <button
        type="button"
        data-tool="browser"
        className={`tool-button${ui.browserOpen ? ' is-active' : ''}`}
        aria-pressed={ui.browserOpen}
        onClick={() => dispatchUi({ type: 'toggleBrowser' })}
      >
        <LayoutIcon size={18} />
        <span className="tool-tooltip" role="tooltip">
          {t('action.browser')}
          <kbd>⌘B</kbd>
        </span>
      </button>
      <span className="tool-dock-divider" />
      {TOOLS.map(({ mode, labelKey, shortcut, Icon }) => {
        const active = ui.tool === mode;
        return (
          <button
            key={mode}
            type="button"
            data-tool={mode}
            className={`tool-button${active ? ' is-active' : ''}`}
            aria-pressed={active}
            aria-keyshortcuts={shortcut}
            onClick={() => dispatchUi({ type: 'setTool', tool: mode })}
          >
            <Icon size={18} />
            <span className="tool-tooltip" role="tooltip">
              {t(labelKey)}
              <kbd>{shortcut}</kbd>
            </span>
          </button>
        );
      })}
    </div>
  );
}
