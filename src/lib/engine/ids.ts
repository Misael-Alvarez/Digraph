import { nanoid } from 'nanoid';

/**
 * Collision-free IDs.
 *
 * The original editor used a module-level counter, which reset to 1 on every
 * page load and silently produced duplicate IDs against restored diagrams.
 * Random IDs also make client- and server-generated shapes safe to merge, which
 * the future sync layer depends on.
 */
export function uid(prefix: string): string {
  return `${prefix}_${nanoid(10)}`;
}

/** Extracts the semantic prefix of an ID (`grp_a1b2c3` -> `grp`). */
export function idPrefix(id: string): string {
  const i = id.indexOf('_');
  return i === -1 ? id : id.slice(0, i);
}
