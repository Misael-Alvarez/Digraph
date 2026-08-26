'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AiError, requestDiagram, requestReview } from '@/lib/ai/requests';
import { useEditor } from '../EditorProvider';
import { CloseIcon } from '@/components/icons/ToolIcons';

type Mode = 'build' | 'review';

const BUILD_EXAMPLES = [
  'API serverless multi-región en AWS con caché y cola',
  'Pipeline de datos: ingesta, transformación y almacén analítico',
  'Aplicación de tres capas con alta disponibilidad',
];

const REVIEW_QUESTIONS = [
  '¿Qué le falta a esta arquitectura?',
  '¿Dónde está el punto único de fallo?',
  'Explícame el flujo de una petición',
];

/**
 * Generation and review.
 *
 * Generation replaces the diagram through the normal reducer, so it lands as a
 * single undo step: the user can try a prompt and take it back with Ctrl+Z like
 * any other edit. Review is a separate mode because its answer is prose, and it
 * streams for the same reason.
 */
export function AiDialog() {
  const { doc, ui, dispatch, dispatchUi, t } = useEditor();
  const [mode, setMode] = useState<Mode>('build');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [dropped, setDropped] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const abort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasDiagram = doc.model.shapes.length > 0;

  useEffect(() => {
    inputRef.current?.focus();
    return () => abort.current?.abort();
  }, []);

  const close = useCallback(() => {
    abort.current?.abort();
    dispatchUi({ type: 'setModal', modal: null });
  }, [dispatchUi]);

  const run = useCallback(async () => {
    const text = prompt.trim();
    if (!text || busy) return;

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;

    setBusy(true);
    setError(null);
    setSummary(null);
    setDropped([]);
    setAnswer('');

    try {
      if (mode === 'review') {
        await requestReview(
          text,
          doc.model,
          (chunk) => setAnswer((a) => a + chunk),
          controller.signal,
        );
      } else {
        const result = await requestDiagram(
          hasDiagram ? 'modify' : 'generate',
          text,
          hasDiagram ? doc.model : undefined,
          controller.signal,
        );
        dispatch({ type: 'replaceModel', model: result.model });
        dispatchUi({ type: 'clearSelection' });
        setSummary(result.summary);
        setDropped(result.dropped);
      }
    } catch (caught) {
      if (controller.signal.aborted) return;
      if (caught instanceof AiError) {
        setError(caught.retryAfter ? `${caught.message} (${caught.retryAfter}s)` : caught.message);
      } else {
        setError('The request failed.');
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, [prompt, busy, mode, doc.model, hasDiagram, dispatch, dispatchUi]);

  if (ui.modal !== 'ai') return null;

  const examples = mode === 'build' ? BUILD_EXAMPLES : REVIEW_QUESTIONS;
  const canRun = prompt.trim().length > 2 && !busy && (mode === 'build' || hasDiagram);

  return (
    <div className="dialog-backdrop" onPointerDown={close}>
      <div
        className="dialog is-wide"
        role="dialog"
        aria-modal="true"
        aria-label={t('ai.title')}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="dialog-header">
          <div className="segmented is-compact">
            {(['build', 'review'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`segmented-option${mode === option ? ' is-active' : ''}`}
                onClick={() => setMode(option)}
              >
                {t(option === 'build' ? 'ai.build' : 'ai.review')}
              </button>
            ))}
          </div>
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
          <p className="dialog-subtitle">
            {t(
              mode === 'review'
                ? 'ai.reviewHint'
                : hasDiagram
                  ? 'ai.modifyHint'
                  : 'ai.generateHint',
            )}
          </p>

          <textarea
            ref={inputRef}
            className="dialog-textarea"
            rows={3}
            value={prompt}
            placeholder={examples[0]}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void run();
              }
            }}
          />

          <div className="ai-examples">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                className="ai-chip"
                onClick={() => setPrompt(example)}
              >
                {example}
              </button>
            ))}
          </div>

          {mode === 'review' && !hasDiagram && <p className="ai-note">{t('ai.needsDiagram')}</p>}

          {error && (
            <p className="ai-error" role="alert">
              {error}
            </p>
          )}

          {summary && (
            <div className="ai-result">
              <p>{summary}</p>
              {dropped.length > 0 && (
                <p className="ai-note">{t('ai.dropped', { names: dropped.join(', ') })}</p>
              )}
              <p className="ai-note">{t('ai.undoHint')}</p>
            </div>
          )}

          {answer && <div className="ai-result ai-answer">{answer}</div>}

          <div className="dialog-actions">
            <span className="dialog-spacer" />
            {busy && (
              <button type="button" className="button" onClick={() => abort.current?.abort()}>
                {t('modal.cancel')}
              </button>
            )}
            <button
              type="button"
              className="button is-primary"
              disabled={!canRun}
              onClick={() => void run()}
            >
              {busy ? t('ai.working') : t(mode === 'review' ? 'ai.ask' : 'ai.generate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
