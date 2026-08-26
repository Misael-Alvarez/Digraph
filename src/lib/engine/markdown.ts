import type { DiagramModel } from '@/lib/domain';
import { getShape } from './model';

/** Renders the diagram as a Markdown outline: boundaries, services by group, connections. */
export function exportToMarkdown(model: DiagramModel): string {
  const lines: string[] = ['# Architecture Diagram\n'];

  const boundaries = model.shapes.filter((s) => s.type === 'boundary');
  const groups = model.shapes.filter((s) => s.type === 'group');
  const items = model.shapes.filter((s) => s.type === 'item');

  for (const b of boundaries) lines.push(`## ${b.title || 'Cloud Environment'}\n`);

  lines.push('## Services\n');
  for (const g of groups) {
    const grpItems = items.filter((it) => {
      const container = it.parentId ? getShape(model, it.parentId) : undefined;
      return container?.parentId === g.id;
    });
    if (!grpItems.length) continue;
    lines.push(`### ${g.title || 'Group'}\n`);
    for (const it of grpItems) {
      lines.push(`- ${it.title || 'Item'}${it.subtitle ? ` — ${it.subtitle}` : ''}`);
    }
    lines.push('');
  }

  if (model.connectors.length) {
    lines.push('## Connections\n');
    for (const c of model.connectors) {
      const src = getShape(model, c.sourceId);
      const tgt = getShape(model, c.targetId);
      if (!src || !tgt) continue;
      lines.push(
        `${src.title || src.id} -> ${tgt.title || tgt.id}${c.label ? ` : ${c.label}` : ''}`,
      );
    }
  }

  return lines.join('\n');
}
