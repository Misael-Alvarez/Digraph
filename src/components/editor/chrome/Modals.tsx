'use client';

import { useEffect, useRef, useState } from 'react';
import { safeParseDiagramModel } from '@/lib/domain';
import { TEMPLATES } from '@/lib/editor/templates';
import { markdownToDiagram } from '@/lib/editor/markdownImport';
import type { CloudTarget } from '@/data/cloudEquivalents';
import { providerColors } from '@/lib/design/tokens';
import { useEditor } from '../EditorProvider';
import { SHORTCUT_GROUPS } from '../hooks/useKeyboard';
import type { MessageKey } from '@/lib/i18n/messages';
import { CloseIcon } from '@/components/icons/ToolIcons';

function Dialog({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="dialog-backdrop" onPointerDown={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`dialog${wide ? ' is-wide' : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="dialog-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}

export function Modals() {
  const { ui, dispatch, dispatchUi, t } = useEditor();
  const close = () => dispatchUi({ type: 'setModal', modal: null });

  if (ui.modal === 'templates') {
    return (
      <Dialog title={t('modal.templates.title')} onClose={close}>
        <p className="dialog-subtitle">{t('modal.templates.subtitle')}</p>
        <div className="template-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => {
                dispatch({ type: 'load', model: template.build() });
                dispatchUi({ type: 'clearSelection' });
                close();
              }}
            >
              <span className="template-icon">{template.icon}</span>
              <span>
                <b>{template.name}</b>
                <small>{template.description}</small>
              </span>
            </button>
          ))}
        </div>
      </Dialog>
    );
  }

  if (ui.modal === 'markdown') return <MarkdownDialog onClose={close} />;

  if (ui.modal === 'switchCloud') {
    const clouds: { target: CloudTarget; label: string; color: string }[] = [
      { target: 'aws', label: 'AWS', color: providerColors.aws },
      { target: 'azure', label: 'Azure', color: providerColors.azure },
      { target: 'gcp', label: 'GCP', color: providerColors.gcp },
    ];
    return (
      <Dialog title={t('action.switchCloud')} onClose={close}>
        <div className="cloud-grid">
          {clouds.map(({ target, label, color }) => (
            <button
              key={target}
              type="button"
              className="cloud-card"
              style={{ '--chip-color': color } as React.CSSProperties}
              onClick={() => {
                dispatch({ type: 'switchCloud', target });
                close();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Dialog>
    );
  }

  if (ui.modal === 'shortcuts') {
    return (
      <Dialog title={t('modal.shortcuts.title')} onClose={close} wide>
        <div className="shortcut-groups">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="shortcut-group-title">{group.title}</h3>
              {group.items.map(([keys, key]) => (
                <div key={keys} className="shortcut-row">
                  <kbd>{keys}</kbd>
                  <span>{t(key as MessageKey)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Dialog>
    );
  }

  return null;
}

function MarkdownDialog({ onClose }: { onClose: () => void }) {
  const { dispatch, dispatchUi, t } = useEditor();
  const [text, setText] = useState('');

  const example = `# Architecture

- CloudFront
- API Gateway
- Lambda
- DynamoDB

CloudFront -> API Gateway : HTTPS
API Gateway -> Lambda : invoke
Lambda -> DynamoDB : R/W`;

  return (
    <Dialog title={t('modal.markdown.title')} onClose={onClose} wide>
      <p className="dialog-subtitle">{t('modal.markdown.subtitle')}</p>
      <pre className="dialog-example">{example}</pre>
      <textarea
        className="dialog-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={example}
        rows={10}
      />
      <div className="dialog-actions">
        <label className="button">
          {t('modal.markdown.chooseFile')}
          <input
            type="file"
            accept=".md,.txt"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setText(String(reader.result));
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
        </label>
        <span className="dialog-spacer" />
        <button type="button" className="button" onClick={onClose}>
          {t('modal.cancel')}
        </button>
        <button
          type="button"
          className="button is-primary"
          disabled={!text.trim()}
          onClick={() => {
            const model = markdownToDiagram(text);
            const parsed = safeParseDiagramModel(model);
            if (!parsed.success) {
              dispatchUi({ type: 'toast', message: t('toast.invalidFile') });
              return;
            }
            dispatch({ type: 'load', model: parsed.data });
            dispatchUi({ type: 'clearSelection' });
            onClose();
          }}
        >
          {t('modal.markdown.import')}
        </button>
      </div>
    </Dialog>
  );
}
