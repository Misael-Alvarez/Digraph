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
export const CURRENT_SCHEMA_VERSION = 2;

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

/**
 * The fills the engine used to write into every shape it created.
 *
 * They were theme colours, not choices: a group was born `#FAFBFC` whatever the
 * theme, so in dark mode a diagram came back as white cards on a dark canvas.
 * A shape carries no fill now — an absent fill means "whatever the theme says"
 * — and these are dropped on the way in so diagrams written by the old engine
 * follow the theme as well.
 *
 * Compared case-sensitively on purpose: the engine wrote them upper-case and a
 * colour input only ever produces lower-case, so a fill somebody deliberately
 * set to this exact grey is left alone.
 */
const LEGACY_THEME_FILLS: Record<string, string> = {
  boundary: '#F8F9FA',
  group: '#FAFBFC',
  container: '#9AA0A6',
  item: '#F1F3F4',
};

/**
 * What a node is, beyond where it sits.
 *
 * The diagram was a drawing: geometry and decoration, with nothing that says
 * what a box *is*. Everything worth building on top — who to call when it
 * breaks, what talks to it, whether it may hold customer data — needs the model
 * to carry that, so it lives here rather than in a note field nobody can query.
 *
 * Every field is optional on purpose. A form of twenty required boxes is a form
 * nobody fills, and a diagram is useful long before it is fully described.
 */
export const EnvironmentSchema = z.enum(['dev', 'qa', 'staging', 'prod']);
export const CriticalitySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const LifecycleSchema = z.enum(['planned', 'active', 'deprecated', 'retired']);

export const NodeMetaSchema = z.object({
  /** What it is built with: `FastAPI`, `PostgreSQL 16`, `Node 20`. */
  technology: z.string().optional(),
  /** The team that answers for it. */
  owner: z.string().optional(),
  repository: z.string().optional(),
  environment: EnvironmentSchema.optional(),
  criticality: CriticalitySchema.optional(),
  lifecycle: LifecycleSchema.optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * What an arrow means.
 *
 * `A -> B` says almost nothing. Whether the call is synchronous, what protocol
 * carries it and whether customer data travels along it are the difference
 * between a picture and something that can be checked.
 */
export const ProtocolSchema = z.enum([
  'http',
  'https',
  'grpc',
  'websocket',
  'kafka',
  'amqp',
  'sql',
  'redis',
  'file',
  'other',
]);
export const EdgeKindSchema = z.enum(['sync', 'async', 'event', 'data', 'dependency']);
export const DataClassSchema = z.enum(['public', 'internal', 'confidential', 'pii', 'pci', 'phi']);

export const EdgeMetaSchema = z.object({
  protocol: ProtocolSchema.optional(),
  kind: EdgeKindSchema.optional(),
  /** How the caller proves who it is: `OAuth2`, `mTLS`, `API key`. */
  auth: z.string().optional(),
  /** What travels along it, for data-flow and privacy questions. */
  dataClass: DataClassSchema.optional(),
});

export const ShapeSchema = z
  .object({
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
    meta: NodeMetaSchema.optional(),
  })
  .transform((shape) =>
    shape.fill && LEGACY_THEME_FILLS[shape.type] === shape.fill
      ? { ...shape, fill: undefined }
      : shape,
  );

export const ConnectorSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().default(''),
  style: ConnectorStyleSchema.default('solid'),
  waypoints: z.array(PointSchema).default([]),
  meta: EdgeMetaSchema.optional(),
});

export const DiagramModelSchema = z.object({
  /** Absent in pre-versioned files written by the original editor. */
  schemaVersion: z.number().default(CURRENT_SCHEMA_VERSION),
  canvas: z.object({ w: z.number(), h: z.number() }),
  shapes: z.array(ShapeSchema),
  connectors: z.array(ConnectorSchema),
  showFooter: z.boolean().default(false),
});

export type Environment = z.infer<typeof EnvironmentSchema>;
export type Criticality = z.infer<typeof CriticalitySchema>;
export type Lifecycle = z.infer<typeof LifecycleSchema>;
export type NodeMeta = z.infer<typeof NodeMetaSchema>;
export type Protocol = z.infer<typeof ProtocolSchema>;
export type EdgeKind = z.infer<typeof EdgeKindSchema>;
export type DataClass = z.infer<typeof DataClassSchema>;
export type EdgeMeta = z.infer<typeof EdgeMetaSchema>;
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
