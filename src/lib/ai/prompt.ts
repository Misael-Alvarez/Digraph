import { SERVICE_ICONS } from '@/data/serviceIcons';
import { CLOUD_EQUIVALENCES } from '@/data/cloudEquivalents';
import { serializeDsl } from '@/lib/dsl';
import { analyzeArchitecture } from '@/lib/engine';
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
    .map(
      (row) => `${row.role}: aws=${row.aws ?? '—'} azure=${row.azure ?? '—'} gcp=${row.gcp ?? '—'}`,
    )
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
  const current =
    model && model.shapes.length ? serializeDsl(model, { includeLayout: false }) : null;

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

export const EXPLAIN_SYSTEM_PROMPT = `You review cloud architecture diagrams. You are given one as YAML, a list of facts already computed from it, and a question.

The facts are not opinions: cycles, articulation points, coupling and unauthenticated data flows were found by walking the graph. Trust them, use them, and say which ones matter and why — but do not stop there. The graph cannot see missing backups, a cost trap or a quota, and that is where you earn your keep.

Be concrete and brief. Refer to services by the name shown on the diagram. Do not restate the diagram back to the user; they can see it.

Answer in the language the user writes in. Use short paragraphs or a tight list, never more than roughly 200 words.`;

/**
 * What the graph already knows, in the model's own words.
 *
 * A reviewer that has to find a dependency cycle by reading YAML will sometimes
 * miss it and sometimes invent one. These are computed by
 * `analyzeArchitecture`, so the model spends its attention on judgement rather
 * than on arithmetic — which is the difference between advice about this
 * architecture and advice about architectures in general.
 */
function facts(model: DiagramModel): string {
  const { findings, score, nodes, edges } = analyzeArchitecture(model);
  if (!nodes) return '';

  const lines = findings.map((finding) => {
    const detail = Object.entries(finding.detail)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    return `- [${finding.severity}] ${finding.kind}: ${detail}`;
  });

  return [
    `\n# Facts computed from the graph`,
    `${nodes} services, ${edges} links, score ${score}/100.`,
    lines.length ? lines.join('\n') : 'No structural problems were found.',
  ].join('\n');
}

export function buildExplainPrompt(question: string, model: DiagramModel): string {
  return `\`\`\`yaml\n${serializeDsl(model, { includeLayout: false })}\`\`\`\n${facts(model)}\n\n${question}`;
}
