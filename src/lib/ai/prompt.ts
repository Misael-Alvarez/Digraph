import { SERVICE_ICONS } from '@/data/serviceIcons';
import { CLOUD_EQUIVALENCES } from '@/data/cloudEquivalents';
import { serializeDsl } from '@/lib/dsl';
import type { DiagramModel } from '@/lib/domain';

/**
 * The service catalogue, rendered once.
 *
 * This is the largest and most stable part of the prompt, which is exactly what
 * prompt caching is for: it goes first and gets a cache breakpoint, so repeat
 * requests pay a fraction of its cost.
 */
function catalogue(): string {
  const byCategory = new Map<string, string[]>();
  for (const service of SERVICE_ICONS) {
    const line = `${service.key} (${service.label}${service.description ? `: ${service.description}` : ''})`;
    const bucket = byCategory.get(service.category);
    if (bucket) bucket.push(line);
    else byCategory.set(service.category, [line]);
  }
  return [...byCategory.entries()]
    .map(([category, lines]) => `## ${category.toUpperCase()}\n${lines.join('\n')}`)
    .join('\n\n');
}

/** Cross-cloud roles, so the model can retarget an architecture sensibly. */
function equivalences(): string {
  return CLOUD_EQUIVALENCES.filter((row) => row.aws || row.azure || row.gcp)
    .map((row) => `${row.role}: aws=${row.aws ?? '—'} azure=${row.azure ?? '—'} gcp=${row.gcp ?? '—'}`)
    .join('\n');
}

export const SYSTEM_PROMPT = `You are a cloud architect working inside a diagram editor. You turn a description of a system into a diagram, using only services from the catalogue below.

# Rules

- Use service keys **exactly** as they appear in the catalogue. Never invent a key. If nothing fits, pick the closest generic service (a \`gen-\` key).
- Prefer the cloud the user names. If they name none, choose the one that fits their description best and say why in the summary.
- Model the real request path: an edge means one service actually calls or reads the other, and its label says what flows.
- Group services into a boundary when they share a trust or network zone (a VPC, an account, a region). Do not add boundaries that hold a single service.
- Keep node ids short and lowercase.
- Write \`label\` only when it says more than the service name would; otherwise leave it empty.
- The summary is read by a person: explain the design choices, not the diagram's contents.
- Answer in the language the user writes in.

# Service catalogue

${catalogue()}

# Equivalent services across clouds

${equivalences()}`;

export type AiOperation = 'generate' | 'modify' | 'retarget';

/** Builds the user turn for each kind of request. */
export function buildUserPrompt(
  operation: AiOperation,
  prompt: string,
  model?: DiagramModel,
): string {
  const current = model && model.shapes.length ? serializeDsl(model, { includeLayout: false }) : null;

  switch (operation) {
    case 'modify':
      return current
        ? `Here is the current architecture:\n\n\`\`\`yaml\n${current}\`\`\`\n\nChange it as follows, and return the complete architecture, not just the change:\n\n${prompt}`
        : `Design this architecture:\n\n${prompt}`;

    case 'retarget':
      return `Here is the current architecture:\n\n\`\`\`yaml\n${current ?? ''}\`\`\`\n\nRebuild it on ${prompt}, keeping the same roles and data flow. Where the target cloud has no equivalent, say so in the summary and use the closest option.`;

    default:
      return `Design this architecture:\n\n${prompt}`;
  }
}

export const EXPLAIN_SYSTEM_PROMPT = `You review cloud architecture diagrams. You are given one as YAML and asked about it.

Be concrete and brief. Refer to services by the name shown on the diagram. When you spot a gap — no backups, a single point of failure, an unencrypted hop, a missing quota or cost trap — say so plainly and say what you would add. Do not restate the diagram back to the user; they can see it.

Answer in the language the user writes in. Use short paragraphs or a tight list, never more than roughly 200 words.`;

export function buildExplainPrompt(question: string, model: DiagramModel): string {
  return `\`\`\`yaml\n${serializeDsl(model, { includeLayout: false })}\`\`\`\n\n${question}`;
}
