import { z } from 'zod';
import type { DslDocument } from '@/lib/dsl';
import { matchServiceLabel, resolveService, type CloudPrefix } from '@/lib/dsl';

/**
 * The shape the model is asked to produce.
 *
 * Flat arrays with every field required, rather than the DSL's records, unions
 * and optionals: structured outputs constrain generation against this schema, so
 * the simpler and stricter it is, the less room there is for a malformed answer.
 * Absent values are empty strings instead of missing keys for the same reason.
 */

export const AiBoundarySchema = z.object({
  id: z.string().describe('Short identifier, referenced by nodes.'),
  label: z.string().describe('Human name shown on the boundary header.'),
  variant: z
    .enum(['outer', 'sub'])
    .describe('"outer" for a cloud or VPC, "sub" for a zone inside one.'),
});

export const AiNodeSchema = z.object({
  id: z.string().describe('Short identifier, referenced by edges.'),
  service: z
    .string()
    .describe('A service key from the provided catalogue, e.g. "aws-lambda". Never invent one.'),
  label: z.string().describe('Name shown on the card. Empty string to use the service name.'),
  note: z.string().describe('One short clarifying line, or an empty string.'),
  boundary: z.string().describe('Id of the boundary this sits inside, or an empty string.'),
});

export const AiEdgeSchema = z.object({
  from: z.string().describe('Source node id.'),
  to: z.string().describe('Target node id.'),
  label: z.string().describe('What flows along this edge, e.g. "invoke" or "R/W". May be empty.'),
});

export const AiDiagramSchema = z.object({
  title: z.string().describe('Short name for the architecture.'),
  summary: z
    .string()
    .describe('Two or three sentences explaining the design decisions, for the user to read.'),
  cloud: z.enum(['aws', 'azure', 'gcp']).describe('The primary cloud this architecture targets.'),
  boundaries: z.array(AiBoundarySchema).describe('Zero or more grouping zones.'),
  nodes: z.array(AiNodeSchema).describe('Every service in the architecture.'),
  edges: z.array(AiEdgeSchema).describe('How the services talk to each other.'),
});

export type AiDiagram = z.infer<typeof AiDiagramSchema>;

export interface ConversionResult {
  document: DslDocument;
  /** Services the model named that do not exist; those nodes were dropped. */
  dropped: string[];
}

/**
 * Converts a model answer into a DSL document.
 *
 * The system prompt lists the exact catalogue, but a generated key can still be
 * wrong. Rather than failing the whole request, an unresolvable node is dropped
 * along with its edges and reported, so the user gets the rest of the diagram
 * and an honest note about what was missing.
 */
export function aiToDsl(ai: AiDiagram): ConversionResult {
  const cloud = ai.cloud as CloudPrefix;
  const dropped: string[] = [];

  const nodes: DslDocument['nodes'] = {};
  const resolvedIds = new Set<string>();

  for (const node of ai.nodes) {
    const key =
      resolveService(node.service, cloud) ?? matchServiceLabel(node.label || node.service, cloud);
    if (!key) {
      dropped.push(node.service);
      continue;
    }
    resolvedIds.add(node.id);
    nodes[node.id] = {
      service: key,
      ...(node.label ? { label: node.label } : {}),
      ...(node.note ? { note: node.note } : {}),
      ...(node.boundary ? { in: node.boundary } : {}),
    };
  }

  const usedBoundaries = new Set(
    Object.values(nodes)
      .map((n) => (typeof n === 'string' ? undefined : n.in))
      .filter((id): id is string => Boolean(id)),
  );

  const boundaries: NonNullable<DslDocument['boundaries']> = {};
  for (const boundary of ai.boundaries) {
    // A boundary nobody is inside would only render as an empty box.
    if (!usedBoundaries.has(boundary.id)) continue;
    boundaries[boundary.id] = { label: boundary.label, variant: boundary.variant };
  }

  const edges = ai.edges
    .filter((edge) => resolvedIds.has(edge.from) && resolvedIds.has(edge.to))
    .map((edge) => ({ [`${edge.from} -> ${edge.to}`]: edge.label }));

  return {
    document: {
      version: 1,
      cloud,
      title: ai.title,
      ...(Object.keys(boundaries).length ? { boundaries } : {}),
      nodes,
      edges,
    },
    dropped,
  };
}
