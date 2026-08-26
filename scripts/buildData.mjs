import { writeFileSync } from 'node:fs';
import { buildCatalog } from './buildCatalog.mjs';
import { CATEGORIES, canonicalCategory } from './categories.mjs';

/** Generates the service catalogue and the cross-cloud equivalence table. */

const CLOUD_ORDER = ['aws', 'azure', 'gcp', 'oci', 'ibm', 'aion', 'generic'];

const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const { services, equivalences, stats } = buildCatalog(process.argv[2]);

services.sort((a, b) => {
  const cloud = CLOUD_ORDER.indexOf(a.cloud) - CLOUD_ORDER.indexOf(b.cloud);
  if (cloud !== 0) return cloud;
  const category = canonicalCategory(a.category).localeCompare(canonicalCategory(b.category));
  if (category !== 0) return category;
  return a.label.localeCompare(b.label);
});

const serviceLines = services.map((service) => {
  const fields = [
    `key: ${quote(service.key)}`,
    `label: ${quote(service.label)}`,
    `category: ${quote(service.cloud)}`,
    `subcategory: ${quote(canonicalCategory(service.category))}`,
  ];
  if (service.description) fields.push(`description: ${quote(service.description)}`);
  return `  { ${fields.join(', ')} },`;
});

const catalogue = `// Auto-generated — do not edit manually.
// Run: node scripts/buildData.mjs <path-to-cloud-services-master-list.md>
//
// \`category\` is the cloud the service belongs to and \`subcategory\` is its
// functional area. The names are historical: the app shipped with them and
// stored diagrams depend on the keys, so they were kept rather than renamed.
import type { ServiceIcon } from '@/lib/editor';

export const SERVICE_ICONS: ServiceIcon[] = [
${serviceLines.join('\n')}
];

/** Display name for each cloud, in the order the browser shows them. */
export const CATEGORY_LABELS: Record<string, string> = {
  aws: 'AWS',
  azure: 'Microsoft Azure',
  gcp: 'Google Cloud',
  oci: 'Oracle Cloud',
  ibm: 'IBM Cloud',
  aion: 'AION',
  generic: 'Generic',
};

/** Compact names, so all seven tabs fit without scrolling. */
export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  oci: 'OCI',
  ibm: 'IBM',
  aion: 'AION',
  generic: 'Otros',
};

export const CATEGORY_COLORS: Record<string, string> = {
  aws: '#ff9900',
  azure: '#0078d4',
  gcp: '#4285f4',
  oci: '#c74634',
  ibm: '#0f62fe',
  aion: '#6b2fa0',
  generic: '#5f6368',
};

/** Functional areas, in the order the browser shows them. */
export const SERVICE_CATEGORIES: { id: string; label: string }[] = [
${CATEGORIES.map((c) => `  { id: ${quote(c.id)}, label: ${quote(c.label)} },`).join('\n')}
];

export const SERVICE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_CATEGORIES.map((category) => [category.id, category.label]),
);
`;

writeFileSync('src/data/serviceIcons.ts', catalogue);

const equivalenceLines = equivalences.map((row) => {
  const fields = [
    `role: ${quote(row.role)}`,
    `area: ${quote(canonicalCategory(row.section))}`,
    ...CLOUD_ORDER.slice(0, 5).map(
      (cloud) => `${cloud}: ${row.services[cloud] ? quote(row.services[cloud]) : 'null'}`,
    ),
  ];
  return `  { ${fields.join(', ')} },`;
});

const equivalenceFile = `// Auto-generated — do not edit manually.
// Run: node scripts/buildData.mjs <path-to-cloud-services-master-list.md>
//
// Which service plays the same part in each cloud. This is what lets a diagram
// be retargeted from one provider to another, and what the inspector shows as
// "equivalent services".

export type CloudTarget = 'aws' | 'azure' | 'gcp' | 'oci' | 'ibm';

export const CLOUD_TARGETS: CloudTarget[] = ['aws', 'azure', 'gcp', 'oci', 'ibm'];

export interface Equivalence {
  /** What this row is for, e.g. "Object Storage". */
  role: string;
  /** Functional area, matching the service catalogue's subcategory. */
  area: string;
  aws: string | null;
  azure: string | null;
  gcp: string | null;
  oci: string | null;
  ibm: string | null;
}

export const CLOUD_EQUIVALENCES: Equivalence[] = [
${equivalenceLines.join('\n')}
];

const PREFIX: Record<CloudTarget, string> = {
  aws: 'aws-',
  azure: 'az-',
  gcp: 'gcp-',
  oci: 'oci-',
  ibm: 'ibm-',
};

function cloudOf(key: string): CloudTarget | null {
  for (const [cloud, prefix] of Object.entries(PREFIX)) {
    if (key.startsWith(prefix)) return cloud as CloudTarget;
  }
  return null;
}

/** The service playing the same role in \`targetCloud\`, or null if there is none. */
export function findEquivalent(sourceKey: string, targetCloud: CloudTarget): string | null {
  const sourceCloud = cloudOf(sourceKey);
  if (!sourceCloud || sourceCloud === targetCloud) return null;
  for (const row of CLOUD_EQUIVALENCES) {
    if (row[sourceCloud] === sourceKey) return row[targetCloud];
  }
  return null;
}

/** Every cloud's take on the role a service plays. */
export function getEquivalents(sourceKey: string): Equivalence | null {
  const sourceCloud = cloudOf(sourceKey);
  if (!sourceCloud) return null;
  return CLOUD_EQUIVALENCES.find((row) => row[sourceCloud] === sourceKey) ?? null;
}
`;

writeFileSync('src/data/cloudEquivalents.ts', equivalenceFile);

console.log('services:', services.length, JSON.stringify(stats));
console.log('equivalence rows:', equivalences.length);
