'use client';

import { useState } from 'react';
import { SERVICE_ICONS } from '@/data/serviceIcons';
import { getEquivalents, type CloudTarget } from '@/data/cloudEquivalents';
import { providerColors } from '@/lib/design/tokens';
import { useEditor } from '../EditorProvider';
import { TrashIcon } from '../icons/ToolIcons';

const CLOUDS: { target: CloudTarget; label: string; color: string; prefix: string }[] = [
  { target: 'aws', label: 'AWS', color: providerColors.aws, prefix: 'aws-' },
  { target: 'azure', label: 'Azure', color: providerColors.azure, prefix: 'az-' },
  { target: 'gcp', label: 'GCP', color: providerColors.gcp, prefix: 'gcp-' },
];

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="inspector-section">
      <button
        type="button"
        className="inspector-section-header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className={`inspector-chevron${open ? ' is-open' : ''}`} aria-hidden="true" />
      </button>
      {open && <div className="inspector-section-body">{children}</div>}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="inspector-field">
      <span className="inspector-field-label">{label}</span>
      {children}
    </label>
  );
}

/**
 * Contextual properties panel.
 *
 * It only exists while something is selected: the previous editor kept a 280px
 * column permanently on screen showing "no selection" most of the time.
 */
export function InspectorPanel() {
  const { ui, doc, selectedShape, dispatch, dispatchUi, t } = useEditor();

  if (ui.selectedIds.size === 0 && !ui.selectedConnectorId) return null;

  if (ui.selectedConnectorId) {
    const connector = doc.model.connectors.find((c) => c.id === ui.selectedConnectorId);
    if (!connector) return null;
    return (
      <aside className="inspector" aria-label={t('inspector.title')}>
        <header className="inspector-header">{t('inspector.title')}</header>
        <Section title={t('inspector.content')}>
          <Field label={t('inspector.label')}>
            <input
              className="input"
              value={connector.label}
              onChange={(e) =>
                dispatch({
                  type: 'setConnectorProps',
                  id: connector.id,
                  patch: { label: e.target.value },
                })
              }
            />
          </Field>
          <div className="segmented">
            {(['solid', 'dashed'] as const).map((style) => (
              <button
                key={style}
                type="button"
                className={`segmented-option${connector.style === style ? ' is-active' : ''}`}
                onClick={() =>
                  dispatch({ type: 'setConnectorProps', id: connector.id, patch: { style } })
                }
              >
                {style}
              </button>
            ))}
          </div>
        </Section>
        <div className="inspector-actions">
          <button
            type="button"
            className="button is-danger"
            onClick={() => {
              dispatch({ type: 'deleteConnector', id: connector.id });
              dispatchUi({ type: 'clearSelection' });
            }}
          >
            <TrashIcon size={14} /> {t('action.delete')}
          </button>
        </div>
      </aside>
    );
  }

  if (!selectedShape) {
    return (
      <aside className="inspector" aria-label={t('inspector.title')}>
        <header className="inspector-header">{t('inspector.title')}</header>
        <p className="inspector-note">{t('inspector.multi', { count: ui.selectedIds.size })}</p>
        <div className="inspector-actions">
          <button
            type="button"
            className="button is-danger"
            onClick={() => {
              dispatch({ type: 'deleteShapes', ids: [...ui.selectedIds] });
              dispatchUi({ type: 'clearSelection' });
            }}
          >
            <TrashIcon size={14} /> {t('action.delete')}
          </button>
        </div>
      </aside>
    );
  }

  const shape = selectedShape;
  const iconKey = shape.icon?.key;
  const cloudSwitchable =
    shape.type === 'item' && iconKey && !iconKey.startsWith('gen-') && !iconKey.startsWith('aion-');
  const equivalents = iconKey ? getEquivalents(iconKey) : null;
  const patch = (values: Partial<typeof shape>) =>
    dispatch({ type: 'setShapeProps', id: shape.id, patch: values });

  return (
    <aside className="inspector" aria-label={t('inspector.title')}>
      <header className="inspector-header">
        {t('inspector.title')}
        <span className="inspector-type">{shape.type}</span>
      </header>

      <Section title={t('inspector.content')}>
        <Field label={t('inspector.label')}>
          <input
            className="input"
            value={shape.title ?? ''}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </Field>
        {shape.type === 'item' && (
          <>
            <Field label={t('inspector.subtitle')}>
              <input
                className="input"
                value={shape.subtitle ?? ''}
                onChange={(e) => patch({ subtitle: e.target.value })}
              />
            </Field>
            <Field label={t('inspector.note')}>
              <input
                className="input"
                value={shape.note ?? ''}
                onChange={(e) => patch({ note: e.target.value })}
              />
            </Field>
          </>
        )}
      </Section>

      {(shape.type === 'item' || shape.type === 'boundary') && (
        <Section title={t('inspector.appearance')}>
          <Field label={t('inspector.icon')}>
            <select
              className="input"
              value={iconKey ?? ''}
              onChange={(e) => patch({ icon: { kind: 'symbol', key: e.target.value } })}
            >
              {SERVICE_ICONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} · {s.category.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('inspector.fill')}>
            <div className="color-field">
              <input
                type="color"
                value={shape.fill ?? '#f1f3f4'}
                onChange={(e) => patch({ fill: e.target.value })}
                aria-label={t('inspector.fill')}
              />
              <input
                className="input"
                value={shape.fill ?? ''}
                onChange={(e) => patch({ fill: e.target.value })}
              />
            </div>
          </Field>
        </Section>
      )}

      {cloudSwitchable && (
        <Section title={t('inspector.cloud')}>
          <div className="cloud-switch">
            {CLOUDS.map(({ target, label, color, prefix }) => (
              <button
                key={target}
                type="button"
                className={`cloud-chip${iconKey!.startsWith(prefix) ? ' is-active' : ''}`}
                style={{ '--chip-color': color } as React.CSSProperties}
                onClick={() => dispatch({ type: 'switchShapeCloud', id: shape.id, target })}
              >
                {label}
              </button>
            ))}
          </div>
          {equivalents && (
            <dl className="equivalents">
              <dt>{t('inspector.equivalents')}</dt>
              {(['aws', 'azure', 'gcp'] as const).map((cloud) => {
                const key = equivalents[cloud];
                if (!key) return null;
                const svc = SERVICE_ICONS.find((s) => s.key === key);
                return (
                  <dd key={cloud}>
                    <span style={{ color: providerColors[cloud === 'azure' ? 'azure' : cloud] }}>
                      {cloud.toUpperCase()}
                    </span>
                    {svc?.label ?? key}
                  </dd>
                );
              })}
            </dl>
          )}
        </Section>
      )}

      <Section title={t('inspector.position')} defaultOpen={false}>
        <div className="position-grid">
          <span>X</span>
          <b>{Math.round(shape.x)}</b>
          <span>Y</span>
          <b>{Math.round(shape.y)}</b>
          <span>W</span>
          <b>{Math.round(shape.w)}</b>
          <span>H</span>
          <b>{Math.round(shape.h)}</b>
        </div>
        {shape.type === 'item' && (
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() => dispatch({ type: 'reorderItem', id: shape.id, dir: -1 })}
            >
              {t('inspector.moveUp')}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => dispatch({ type: 'reorderItem', id: shape.id, dir: 1 })}
            >
              {t('inspector.moveDown')}
            </button>
          </div>
        )}
      </Section>

      <div className="inspector-actions">
        <button
          type="button"
          className="button is-danger"
          onClick={() => {
            dispatch({ type: 'deleteShapes', ids: [...ui.selectedIds] });
            dispatchUi({ type: 'clearSelection' });
          }}
        >
          <TrashIcon size={14} /> {t('action.delete')}
        </button>
      </div>
    </aside>
  );
}
