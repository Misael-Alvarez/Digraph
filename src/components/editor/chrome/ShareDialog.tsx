'use client';

import { useEffect, useState } from 'react';
import { PayloadTooLargeError } from '@/lib/share/codec';
import { buildShareLinks, type ShareLinks } from '@/lib/share/links';
import { useEditor } from '../EditorProvider';
import { CloseIcon } from '@/components/icons/ToolIcons';

function CopyField({
  label,
  hint,
  value,
  copiedLabel,
  multiline,
}: {
  label: string;
  hint?: string;
  value: string;
  copiedLabel: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="share-field">
      <header className="share-field-header">
        <span className="inspector-field-label">{label}</span>
        <button
          type="button"
          className="button is-small"
          onClick={() => {
            void navigator.clipboard?.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
          }}
        >
          {copied ? `✓ ${copiedLabel}` : 'Copiar'}
        </button>
      </header>
      {hint && <p className="ai-note">{hint}</p>}
      {multiline ? (
        <pre className="share-value is-block">{value}</pre>
      ) : (
        <input
          className="input share-value"
          value={value}
          readOnly
          onFocus={(e) => e.target.select()}
        />
      )}
    </section>
  );
}

/**
 * Share links for the current diagram.
 *
 * There is no server holding diagrams yet, so the diagram travels compressed
 * inside the link. That has a size ceiling, and this says so plainly rather than
 * handing out a link that will be truncated somewhere downstream.
 */
export function ShareDialog() {
  const { doc, ui, dispatchUi, t } = useEditor();
  const [links, setLinks] = useState<ShareLinks | null>(null);
  const [tooLarge, setTooLarge] = useState(false);

  const open = ui.modal === 'share';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Every state update happens in a promise callback, never synchronously in
    // the effect body, so opening the dialog costs one render rather than three.
    buildShareLinks(doc.model, window.location.origin, ui.dark ? 'dark' : 'light')
      .then((built) => {
        if (cancelled) return;
        setLinks(built);
        setTooLarge(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLinks(null);
        setTooLarge(error instanceof PayloadTooLargeError);
      });

    return () => {
      cancelled = true;
    };
  }, [open, doc.model, ui.dark]);

  if (!open) return null;
  const close = () => dispatchUi({ type: 'setModal', modal: null });

  return (
    <div className="dialog-backdrop" onPointerDown={close}>
      <div
        className="dialog is-wide"
        role="dialog"
        aria-modal="true"
        aria-label={t('share.dialogTitle')}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="dialog-header">
          <h2>{t('share.dialogTitle')}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label={t('modal.close')}
            onClick={close}
          >
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="dialog-body">
          {tooLarge && <p className="ai-error">{t('share.tooLarge')}</p>}
          {!tooLarge && !links && <p className="library-note">{t('library.loading')}</p>}

          {links && (
            <>
              <CopyField
                label={t('share.link')}
                value={links.view}
                copiedLabel={t('share.copied')}
              />
              <CopyField
                label={t('share.readme')}
                hint={t('share.readmeHint')}
                value={links.readme}
                copiedLabel={t('share.copied')}
                multiline
              />
              <CopyField
                label={t('share.image')}
                hint={t('share.imageHint')}
                value={links.markdownImage}
                copiedLabel={t('share.copied')}
              />
              <div className="dialog-actions">
                <span className="dialog-spacer" />
                <a className="button is-primary" href={links.view} target="_blank" rel="noreferrer">
                  {t('share.open')}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
