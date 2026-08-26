import { z } from 'zod';

/**
 * The diagram-as-code document.
 *
 * The DSL deliberately does not mirror `DiagramModel`. That model carries the
 * boundary/group/container/item hierarchy and absolute geometry, none of which a
 * developer wants to hand-write. A document here declares intent — which
 * services exist and how they connect — and the engine's auto-layout derives the
 * geometry, with an optional `layout` block to pin anything positioned by hand.
 */

export const DSL_VERSION = 1;

/** Position as `[x, y]`, written by the canvas so manual placement survives. */
export const PositionSchema = z.tuple([z.number(), z.number()]);

export const NodeSpecSchema = z.object({
  /** Service key, with or without a cloud prefix (`lambda` or `aws-lambda`). */
  service: z.string(),
  label: z.string().optional(),
  subtitle: z.string().optional(),
  note: z.string().optional(),
  /** Id of the boundary this node sits inside. */
  in: z.string().optional(),
});

/** `fn: lambda` is shorthand for `fn: { service: lambda }`. */
export const NodeEntrySchema = z.union([z.string(), NodeSpecSchema]);

export const BoundarySpecSchema = z.object({
  label: z.string().optional(),
  variant: z.enum(['outer', 'sub']).default('outer'),
  service: z.string().optional(),
});

/**
 * An edge is a single-key map whose key is `from -> to` and whose value is the
 * label: `- api -> fn: invoke`. It reads like a sentence and stays valid YAML.
 * The long form `{ from, to, label, style }` is accepted for anything richer.
 */
export const EdgeLongSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  style: z.enum(['solid', 'dashed']).optional(),
});

export const DslDocumentSchema = z.object({
  version: z.number().default(DSL_VERSION),
  /** Default cloud used to resolve unprefixed service names. */
  cloud: z.enum(['aws', 'azure', 'gcp']).optional(),
  title: z.string().optional(),
  boundaries: z.record(z.string(), BoundarySpecSchema).optional(),
  nodes: z.record(z.string(), NodeEntrySchema),
  edges: z.array(z.union([EdgeLongSchema, z.record(z.string(), z.string())])).default([]),
  layout: z.record(z.string(), PositionSchema).optional(),
});

export type Position = z.infer<typeof PositionSchema>;
export type NodeSpec = z.infer<typeof NodeSpecSchema>;
export type BoundarySpec = z.infer<typeof BoundarySpecSchema>;
export type DslDocument = z.infer<typeof DslDocumentSchema>;

/** An edge after both notations have been reduced to one shape. */
export interface NormalisedEdge {
  from: string;
  to: string;
  label: string;
  style: 'solid' | 'dashed';
}

/** Matches `a -> b`, and tolerates `-->` and `→`. */
const ARROW = /^(.+?)\s*(?:->|-->|→)\s*(.+)$/;

export function normaliseEdges(edges: DslDocument['edges']): NormalisedEdge[] {
  const out: NormalisedEdge[] = [];
  for (const edge of edges) {
    if ('from' in edge && typeof edge.from === 'string' && 'to' in edge) {
      const long = edge as z.infer<typeof EdgeLongSchema>;
      out.push({
        from: long.from,
        to: long.to,
        label: long.label ?? '',
        style: long.style ?? 'solid',
      });
      continue;
    }
    for (const [key, value] of Object.entries(edge as Record<string, string>)) {
      const match = key.match(ARROW);
      if (!match) continue;
      out.push({
        from: match[1].trim(),
        to: match[2].trim(),
        label: typeof value === 'string' ? value : '',
        style: 'solid',
      });
    }
  }
  return out;
}

export function normaliseNode(entry: z.infer<typeof NodeEntrySchema>): NodeSpec {
  return typeof entry === 'string' ? { service: entry } : entry;
}
