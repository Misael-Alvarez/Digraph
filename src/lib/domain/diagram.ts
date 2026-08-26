/**
 * Domain schemas for the diagram model.
 *
 * These Zod schemas are the single source of truth: every TypeScript type in the
 * app is derived from them with `z.infer`. Anything read from persistence (local
 * IndexedDB today, a remote API later) is parsed through `parseDiagramModel`, so
 * a corrupt or outdated payload fails loudly at the boundary instead of leaking
 * malformed shapes into the editor.
 */
import { z } from 'zod';

/** Bumped whenever a stored model needs a migration. */
export const CURRENT_SCHEMA_VERSION = 1;

export const ShapeTypeSchema = z.enum(['boundary', 'group', 'container', 'item']);
export const BoundaryVariantSchema = z.enum(['outer', 'sub']);
export const ConnectorStyleSchema = z.enum(['solid', 'dashed']);
export const StackedGapSchema = z.enum(['tight', 'wide']);
export const CloudProviderSchema = z.enum(['aws', 'azure', 'gcp', 'oci', 'ibm', 'aion', 'generic']);

export const IconRefSchema = z.object({
  kind: z.enum(['symbol', 'logo']),
  key: z.string(),
});

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const BBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const ShapeSchema = z.object({
  id: z.string(),
  type: ShapeTypeSchema,
  parentId: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  note: z.string().optional(),
  fill: z.string().optional(),
  icon: IconRefSchema.optional(),
  variant: BoundaryVariantSchema.optional(),
  stacked_gap: StackedGapSchema.optional(),
  order: z.number().optional(),
  manualSize: z.boolean().optional(),
});

export const ConnectorSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().default(''),
  style: ConnectorStyleSchema.default('solid'),
  waypoints: z.array(PointSchema).default([]),
});

export const DiagramModelSchema = z.object({
  /** Absent in pre-versioned files written by the original editor. */
  schemaVersion: z.number().default(CURRENT_SCHEMA_VERSION),
  canvas: z.object({ w: z.number(), h: z.number() }),
  shapes: z.array(ShapeSchema),
  connectors: z.array(ConnectorSchema),
  showFooter: z.boolean().default(false),
});

export type ShapeType = z.infer<typeof ShapeTypeSchema>;
export type BoundaryVariant = z.infer<typeof BoundaryVariantSchema>;
export type ConnectorStyle = z.infer<typeof ConnectorStyleSchema>;
export type StackedGap = z.infer<typeof StackedGapSchema>;
export type CloudProvider = z.infer<typeof CloudProviderSchema>;
export type IconRef = z.infer<typeof IconRefSchema>;
export type Point = z.infer<typeof PointSchema>;
export type BBox = z.infer<typeof BBoxSchema>;
export type Shape = z.infer<typeof ShapeSchema>;
export type Connector = z.infer<typeof ConnectorSchema>;
export type DiagramModel = z.infer<typeof DiagramModelSchema>;

/** Throws a ZodError when the payload is not a usable diagram. */
export function parseDiagramModel(raw: unknown): DiagramModel {
  return DiagramModelSchema.parse(raw);
}

/** Non-throwing variant for untrusted input (file import, pasted JSON). */
export function safeParseDiagramModel(raw: unknown) {
  return DiagramModelSchema.safeParse(raw);
}
