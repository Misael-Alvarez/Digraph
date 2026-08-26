import { describe, expect, it } from 'vitest';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_ICONS,
} from './serviceIcons';
import {
  CLOUD_EQUIVALENCES,
  CLOUD_TARGETS,
  findEquivalent,
  getEquivalents,
} from './cloudEquivalents';
import { SVG_SYMBOLS, spriteFor } from '@/components/icons/svgIconDefs';

const KEYS = new Set(SERVICE_ICONS.map((s) => s.key));
const CATEGORY_IDS = new Set(SERVICE_CATEGORIES.map((c) => c.id));
const CLOUDS = ['aws', 'azure', 'gcp', 'oci', 'ibm', 'aion', 'generic'] as const;

describe('service catalogue', () => {
  it('covers every cloud', () => {
    const present = new Set(SERVICE_ICONS.map((s) => s.category));
    for (const cloud of CLOUDS) expect(present.has(cloud), cloud).toBe(true);
  });

  it('has no duplicate keys', () => {
    expect(KEYS.size).toBe(SERVICE_ICONS.length);
  });

  it('gives every service a label and a known cloud and area', () => {
    for (const service of SERVICE_ICONS) {
      expect(service.label.trim(), service.key).not.toBe('');
      expect(CLOUDS as readonly string[], service.key).toContain(service.category);
      expect(
        CATEGORY_IDS.has(service.subcategory ?? ''),
        `${service.key} → ${service.subcategory}`,
      ).toBe(true);
    }
  });

  it('keys every service to its cloud', () => {
    const prefixes: Record<string, string> = {
      aws: 'aws-',
      azure: 'az-',
      gcp: 'gcp-',
      oci: 'oci-',
      ibm: 'ibm-',
      aion: 'aion-',
      generic: 'gen-',
    };
    for (const service of SERVICE_ICONS) {
      expect(service.key.startsWith(prefixes[service.category]), service.key).toBe(true);
    }
  });

  it('names and colours every cloud', () => {
    for (const cloud of CLOUDS) {
      expect(CATEGORY_LABELS[cloud], cloud).toBeTruthy();
      expect(CATEGORY_SHORT_LABELS[cloud], cloud).toBeTruthy();
      expect(CATEGORY_COLORS[cloud], cloud).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('keeps the services the app shipped with, so stored diagrams still resolve', () => {
    // A handful of keys from every cloud the app originally had.
    for (const key of [
      'aws-ec2',
      'aws-s3',
      'aws-lambda',
      'aws-apigateway',
      'aws-dynamodb',
      'aws-sagemaker',
      'az-vm',
      'az-functions',
      'az-blob',
      'az-cosmosdb',
      'gcp-cloudrun',
      'gcp-bigquery',
      'gcp-cloudfunctions',
      'gen-redis',
      'gen-server',
      'aion-chatbot',
      'aion-pipeline',
    ]) {
      expect(KEYS.has(key), key).toBe(true);
    }
  });
});

describe('icons', () => {
  it('has a symbol for every service', () => {
    const missing = SERVICE_ICONS.filter((s) => !SVG_SYMBOLS[s.key]).map((s) => s.key);
    expect(missing).toEqual([]);
  });

  it('has no symbol without a service', () => {
    const orphans = Object.keys(SVG_SYMBOLS).filter((key) => !KEYS.has(key));
    expect(orphans).toEqual([]);
  });

  it('gives each symbol the right id and a viewBox', () => {
    for (const [key, symbol] of Object.entries(SVG_SYMBOLS)) {
      expect(symbol, key).toContain(`id="i-${key}"`);
      expect(symbol, key).toContain('viewBox=');
    }
  });

  it('builds a sprite holding only what was asked for', () => {
    const sprite = spriteFor(['aws-lambda', 'gcp-bigquery', 'aws-lambda', 'does-not-exist']);
    expect(sprite).toContain('id="i-aws-lambda"');
    expect(sprite).toContain('id="i-gcp-bigquery"');
    expect((sprite.match(/<symbol/g) ?? []).length).toBe(2);
  });

  it('keeps a diagram-sized sprite far smaller than the whole set', () => {
    // The full set is inlined nowhere; this is why.
    const everything = Object.values(SVG_SYMBOLS).join('').length;
    const five = spriteFor([
      'aws-lambda',
      'aws-s3',
      'aws-dynamodb',
      'az-functions',
      'gcp-bigquery',
    ]).length;
    expect(five).toBeLessThan(everything / 20);
  });
});

describe('cloud equivalences', () => {
  it('only references services that exist', () => {
    for (const row of CLOUD_EQUIVALENCES) {
      for (const cloud of CLOUD_TARGETS) {
        const key = row[cloud];
        if (key) expect(KEYS.has(key), `${row.role} → ${cloud} → ${key}`).toBe(true);
      }
    }
  });

  it('puts each key under its own cloud', () => {
    const prefixes = { aws: 'aws-', azure: 'az-', gcp: 'gcp-', oci: 'oci-', ibm: 'ibm-' };
    for (const row of CLOUD_EQUIVALENCES) {
      for (const cloud of CLOUD_TARGETS) {
        const key = row[cloud];
        if (key) expect(key.startsWith(prefixes[cloud]), `${row.role}: ${key}`).toBe(true);
      }
    }
  });

  it('never maps a service to itself', () => {
    for (const cloud of CLOUD_TARGETS) {
      for (const row of CLOUD_EQUIVALENCES) {
        if (row[cloud]) expect(findEquivalent(row[cloud], cloud)).toBeNull();
      }
    }
  });

  it('translates across all five clouds', () => {
    expect(findEquivalent('aws-lambda', 'gcp')).toBe('gcp-cloudfunctions');
    expect(findEquivalent('aws-lambda', 'azure')).toBe('az-functions');
    expect(findEquivalent('aws-lambda', 'oci')).toBe('oci-functions');
    expect(findEquivalent('aws-lambda', 'ibm')).toBeTruthy();
    expect(findEquivalent('aws-s3', 'oci')).toBeTruthy();
  });

  it('reports the role a service plays', () => {
    const role = getEquivalents('aws-s3');
    expect(role?.role).toBeTruthy();
    expect(role?.aws).toBe('aws-s3');
  });

  it('returns nothing for a service it does not know', () => {
    expect(findEquivalent('gen-redis', 'aws')).toBeNull();
    expect(getEquivalents('not-a-key')).toBeNull();
  });
});
