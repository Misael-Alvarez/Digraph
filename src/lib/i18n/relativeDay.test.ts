import { describe, expect, it } from 'vitest';
import { relativeDay } from './relativeDay';
import { MESSAGES, type MessageKey } from './messages';

const t = (key: MessageKey, values?: Record<string, string | number>) =>
  MESSAGES.en[key].replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? `{${name}}`));

const now = new Date('2026-08-27T12:00:00Z').getTime();
const ago = (hours: number) => new Date(now - hours * 3_600_000).toISOString();

describe('relativeDay', () => {
  it('phrases the first week', () => {
    expect(relativeDay(ago(1), t, now)).toBe('today');
    expect(relativeDay(ago(30), t, now)).toBe('yesterday');
    expect(relativeDay(ago(24 * 3), t, now)).toBe('3 days ago');
  });

  it('falls back to a date once the phrasing stops helping', () => {
    // A week out, "6 days ago" would be worse than the date itself.
    expect(relativeDay(ago(24 * 9), t, now)).toMatch(/\d/);
    expect(relativeDay(ago(24 * 9), t, now)).not.toContain('days ago');
  });

  it('says nothing rather than "Invalid Date"', () => {
    expect(relativeDay('not a date', t, now)).toBe('');
  });
});
