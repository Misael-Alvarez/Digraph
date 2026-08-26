import { SERVICE_ICONS } from '@/data/serviceIcons';

export type CloudPrefix = 'aws' | 'azure' | 'gcp';

const PREFIX: Record<CloudPrefix, string> = { aws: 'aws-', azure: 'az-', gcp: 'gcp-' };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Every way a service can be written, mapped to its canonical key. */
const BY_ALIAS = new Map<string, string>();
for (const service of SERVICE_ICONS) {
  BY_ALIAS.set(service.key, service.key);
  BY_ALIAS.set(slug(service.key), service.key);
  BY_ALIAS.set(slug(service.label), service.key);
  // Bare name without the cloud prefix, e.g. `lambda` for `aws-lambda`.
  const bare = service.key.replace(/^(aws|az|gcp|gen|aion)-/, '');
  if (!BY_ALIAS.has(bare)) BY_ALIAS.set(bare, service.key);
}

/**
 * Resolves a service name written in the DSL to a catalogue key.
 *
 * A document may say `lambda`, `aws-lambda` or `Lambda`; with `cloud: aws` set,
 * an unprefixed name resolves inside that cloud first, so the same document can
 * be retargeted by changing one line.
 */
export function resolveService(name: string, cloud?: CloudPrefix): string | null {
  const raw = name.trim();
  if (!raw) return null;

  if (cloud) {
    const prefixed = BY_ALIAS.get(slug(PREFIX[cloud] + raw));
    if (prefixed) return prefixed;
  }
  return BY_ALIAS.get(raw) ?? BY_ALIAS.get(slug(raw)) ?? null;
}

/** Shortest unambiguous way to write a key, given the document's default cloud. */
export function shortenService(key: string, cloud?: CloudPrefix): string {
  if (!cloud) return key;
  return key.startsWith(PREFIX[cloud]) ? key.slice(PREFIX[cloud].length) : key;
}

/** The cloud every service belongs to, or undefined when they are mixed. */
export function dominantCloud(keys: string[]): CloudPrefix | undefined {
  const clouds = new Set<CloudPrefix>();
  for (const key of keys) {
    if (key.startsWith('aws-')) clouds.add('aws');
    else if (key.startsWith('az-')) clouds.add('azure');
    else if (key.startsWith('gcp-')) clouds.add('gcp');
    // Cloud-neutral services do not vote.
  }
  return clouds.size === 1 ? [...clouds][0] : undefined;
}

const TOKENS = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

/** Every service's label reduced to tokens, longest label first. */
const LABEL_TOKENS = SERVICE_ICONS.map((service) => ({
  key: service.key,
  tokens: TOKENS(service.label),
  weight: service.label.length,
})).sort((a, b) => b.weight - a.weight);

/**
 * Loose match of a human-written label to a service.
 *
 * Deliberately separate from `resolveService`, which stays strict: a DSL
 * document naming an unknown service must fail loudly. Mermaid labels are prose
 * written for a reader — "S3 Bucket", "RDS Database" — so importing them needs
 * to look past the extra words. A service matches when every token of its label
 * appears in the text; the longest such label wins.
 */
export function matchServiceLabel(text: string, cloud?: CloudPrefix): string | null {
  const strict = resolveService(text, cloud);
  if (strict) return strict;

  const words = new Set(TOKENS(text));
  if (!words.size) return null;

  const matches = LABEL_TOKENS.filter(
    (candidate) => candidate.tokens.length > 0 && candidate.tokens.every((t) => words.has(t)),
  );
  if (!matches.length) return null;

  // Several clouds can offer the same role under the same label; honour the hint.
  if (cloud) {
    const preferred = matches.find((m) => m.key.startsWith(PREFIX[cloud]));
    if (preferred) return preferred.key;
  }
  return matches[0].key;
}

/** Completion candidates for the code editor. */
export function serviceCompletions(cloud?: CloudPrefix) {
  return SERVICE_ICONS.map((service) => ({
    label: shortenService(service.key, cloud),
    detail: service.label,
    info: service.description,
    category: service.category,
  }));
}
