import { providerColors } from '@/lib/design/tokens';

export interface ProviderPalette {
  /** Outline of the zone and of items inside it. */
  border: string;
  /** Group background. */
  fill: string;
  /** Boundary header bar. */
  header: string;
  /** Sub-boundary header bar, one step lighter. */
  subHeader: string;
  /** Boundary body. */
  body: string;
  /** Text on the header bar. */
  headerText: string;
}

/**
 * Per-provider palettes for canvas shapes.
 *
 * Vendor brand colours are fixed, so these are not theme tokens. The tints are
 * derived from `providerColors` so a brand update only has to happen in one place.
 */
export const PROVIDER_COLORS: Record<string, ProviderPalette> = {
  aws: {
    border: providerColors.aws,
    fill: '#fff8f0',
    header: providerColors.aws,
    subHeader: '#ffb84d',
    body: '#fffaf3',
    headerText: '#ffffff',
  },
  azure: {
    border: providerColors.azure,
    fill: '#f0f6ff',
    header: providerColors.azure,
    subHeader: '#4a9fe8',
    body: '#eef4fd',
    headerText: '#ffffff',
  },
  gcp: {
    border: providerColors.gcp,
    fill: '#f0f4ff',
    header: providerColors.gcp,
    subHeader: '#7baaf7',
    body: '#eef3fd',
    headerText: '#ffffff',
  },
  aion: {
    border: providerColors.aion,
    fill: '#f8f0ff',
    header: providerColors.aion,
    subHeader: '#9b59c5',
    body: '#f5ecfd',
    headerText: '#ffffff',
  },
  generic: {
    border: providerColors.generic,
    fill: '#f8f9fa',
    header: '#e8eaed',
    subHeader: '#f1f3f4',
    body: '#fbfbfc',
    headerText: '#202124',
  },
};

/** Reads the provider out of a service key such as `aws-lambda`. */
export function providerOf(iconKey: string | undefined): string {
  if (!iconKey) return 'generic';
  const prefix = iconKey.split('-')[0];
  if (prefix === 'az') return 'azure';
  return prefix in PROVIDER_COLORS ? prefix : 'generic';
}

export function paletteFor(iconKey: string | undefined): ProviderPalette {
  return PROVIDER_COLORS[providerOf(iconKey)];
}
