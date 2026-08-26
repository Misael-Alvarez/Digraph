/**
 * Workspace-level domain: the objects that will live in DynamoDB once the app
 * moves to AWS. They are defined now so the local IndexedDB store and the future
 * API speak exactly the same language.
 */
import { z } from 'zod';
import { DiagramModelSchema } from './diagram';

/** ISO-8601 timestamp. Stored as a string so it round-trips through JSON. */
const TimestampSchema = z.string();

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const DiagramMetaSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().default(''),
  folder: z.string().nullable().default(null),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  /** Inline SVG preview used by the library grid. */
  thumbnail: z.string().nullable().default(null),
});

export const DiagramRecordSchema = DiagramMetaSchema.extend({
  model: DiagramModelSchema,
});

export const DiagramVersionSchema = z.object({
  id: z.string(),
  diagramId: z.string(),
  createdAt: TimestampSchema,
  /** Optional human label, e.g. "before switching to GCP". */
  label: z.string().nullable().default(null),
  model: DiagramModelSchema,
});

export const ShareSchema = z.object({
  id: z.string(),
  diagramId: z.string(),
  createdAt: TimestampSchema,
  /** Immutable snapshot: a share never changes when the diagram is edited. */
  model: DiagramModelSchema,
  theme: z.enum(['light', 'dark']).default('light'),
});

export type User = z.infer<typeof UserSchema>;
export type DiagramMeta = z.infer<typeof DiagramMetaSchema>;
export type DiagramRecord = z.infer<typeof DiagramRecordSchema>;
export type DiagramVersion = z.infer<typeof DiagramVersionSchema>;
export type Share = z.infer<typeof ShareSchema>;
