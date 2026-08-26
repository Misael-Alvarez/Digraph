/**
 * Design tokens — the single source of truth for the visual system.
 *
 * Values live here in TypeScript because the SVG renderer needs literal colours:
 * an exported .svg carries no stylesheet, so `var(--surface)` would resolve to
 * nothing in the downloaded file. `globals.css` mirrors these same values as CSS
 * custom properties for the chrome, and `tokens.test.ts` fails if the two drift.
 */

/**
 * Type scale. The previous UI used 8, 9 and 10px text, which is below the
 * legible minimum and left no room for hierarchy. 11px is the floor now.
 */
export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 15,
  lg: 18,
  xl: 24,
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.45,
  relaxed: 1.6,
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** 4pt spacing scale. Every margin, padding and gap must come from here. */
export const space = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 10,
  xl: 16,
  full: 9999,
} as const;

/** Three elevation levels, no more. Level 0 is flat with a border. */
export const elevation = {
  1: '0 1px 2px rgba(15, 18, 23, 0.06), 0 1px 3px rgba(15, 18, 23, 0.04)',
  2: '0 2px 8px rgba(15, 18, 23, 0.08), 0 1px 3px rgba(15, 18, 23, 0.06)',
  3: '0 8px 28px rgba(15, 18, 23, 0.14), 0 2px 6px rgba(15, 18, 23, 0.08)',
} as const;

/** Panels and menus animate at `fast`; only page-level transitions use `slow`. */
export const duration = {
  instant: 80,
  fast: 120,
  base: 160,
  slow: 240,
} as const;

export const easing = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

export const zIndex = {
  canvas: 0,
  guides: 10,
  dock: 20,
  panel: 30,
  overlay: 40,
  menu: 50,
  toast: 60,
} as const;

/**
 * Semantic colours. Named by role, not by appearance, so a dark-mode value can
 * be lighter than its light-mode counterpart without the name turning into a lie.
 */
export interface ColorTokens {
  /** App chrome behind panels. */
  surface: string;
  /** Panels, menus, cards. */
  surfaceRaised: string;
  /** Hover/pressed wash on interactive surfaces. */
  surfaceHover: string;
  /** The area the canvas floats on. */
  canvasBackdrop: string;
  /** The canvas sheet itself. */
  canvasSheet: string;
  /** Grid dots on the canvas. */
  canvasGrid: string;
  textPrimary: string;
  textSecondary: string;
  /** Placeholder and disabled text. */
  textTertiary: string;
  /** Text on an accent-filled surface. */
  textOnAccent: string;
  borderSubtle: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  danger: string;
  dangerSubtle: string;
  success: string;
  warning: string;
  /** Selection outline on canvas shapes. */
  selection: string;
  /** Alignment guide lines. */
  guide: string;
}

export const lightColors: ColorTokens = {
  surface: '#f5f6f7',
  surfaceRaised: '#ffffff',
  surfaceHover: '#f1f3f4',
  canvasBackdrop: '#e9eaed',
  canvasSheet: '#ffffff',
  canvasGrid: '#d0d2d5',
  textPrimary: '#1f1f1f',
  textSecondary: '#5f6368',
  textTertiary: '#80868b',
  textOnAccent: '#ffffff',
  borderSubtle: '#e8eaed',
  borderStrong: '#dadce0',
  accent: '#6b2fa0',
  accentHover: '#8b4fc0',
  accentSubtle: '#f3e8fd',
  danger: '#d93025',
  dangerSubtle: '#fce8e6',
  success: '#188038',
  warning: '#f7941d',
  selection: '#6b2fa0',
  guide: '#6b2fa0',
};

export const darkColors: ColorTokens = {
  surface: '#12141a',
  surfaceRaised: '#1a1d26',
  surfaceHover: '#232733',
  canvasBackdrop: '#0b0d11',
  canvasSheet: '#161920',
  canvasGrid: '#282d3a',
  textPrimary: '#e8eaed',
  textSecondary: '#a2a9b5',
  textTertiary: '#6b7280',
  // Dark mode's accent is a light purple, so text on it must be dark to clear AA.
  textOnAccent: '#1a1024',
  borderSubtle: '#232733',
  borderStrong: '#333949',
  accent: '#a475e0',
  accentHover: '#bb95ec',
  accentSubtle: '#2a1f3d',
  danger: '#f28b82',
  dangerSubtle: '#3d2220',
  success: '#5bb974',
  warning: '#fbbc4a',
  selection: '#a475e0',
  guide: '#a475e0',
};

/** Brand colours of each cloud provider. Fixed by the vendors, not themeable. */
export const providerColors = {
  aws: '#ff9900',
  azure: '#0078d4',
  gcp: '#4285f4',
  oci: '#c74634',
  ibm: '#0f62fe',
  aion: '#6b2fa0',
  banorte: '#ce0032',
  generic: '#9aa0a6',
} as const;

/** Maps a token name to the CSS custom property that carries it. */
export function cssVar(token: keyof ColorTokens): string {
  return `var(--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)})`;
}

/**
 * Colours used to paint the diagram itself.
 *
 * Separate from the chrome tokens because these values are baked into exported
 * SVG files, where no stylesheet exists to resolve custom properties.
 */
export interface CanvasTheme {
  sheet: string;
  grid: string;
  /** Default fill of an item card. */
  itemFill: string;
  itemStroke: string;
  groupFill: string;
  groupStroke: string;
  containerStroke: string;
  titleText: string;
  subtitleText: string;
  noteText: string;
  connector: string;
  connectorLabelFill: string;
  connectorLabelStroke: string;
  connectorLabelText: string;
  divider: string;
  /** Drop shadow applied to cards. */
  shadow: string;
}

export const lightCanvas: CanvasTheme = {
  sheet: '#ffffff',
  grid: '#d0d2d5',
  itemFill: '#ffffff',
  itemStroke: '#dadce0',
  groupFill: '#fafbfc',
  groupStroke: '#dadce0',
  containerStroke: '#9aa0a6',
  titleText: '#202124',
  subtitleText: '#5f6368',
  noteText: '#80868b',
  connector: '#5f6368',
  connectorLabelFill: '#ffffff',
  connectorLabelStroke: '#dadce0',
  connectorLabelText: '#3c4043',
  divider: '#e8eaed',
  shadow: 'rgba(15, 18, 23, 0.10)',
};

export const darkCanvas: CanvasTheme = {
  sheet: '#161920',
  grid: '#282d3a',
  itemFill: '#1f232d',
  itemStroke: '#333949',
  groupFill: '#1a1d26',
  groupStroke: '#2c3242',
  containerStroke: '#4a5266',
  titleText: '#e8eaed',
  subtitleText: '#a2a9b5',
  noteText: '#78808e',
  connector: '#8b93a3',
  connectorLabelFill: '#1f232d',
  connectorLabelStroke: '#333949',
  connectorLabelText: '#c8cdd6',
  divider: '#282d3a',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export function canvasTheme(dark: boolean): CanvasTheme {
  return dark ? darkCanvas : lightCanvas;
}

/** WCAG relative luminance of a `#rrggbb` colour. */
export function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Picks legible text for an arbitrary background.
 *
 * Shapes can carry a user- or template-chosen `fill`, which the theme knows
 * nothing about. Without this, a group tinted with a pale provider colour got
 * the dark theme's near-white title and became invisible.
 */
export function readableTextOn(background: string, theme: CanvasTheme): string {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(background)) return theme.titleText;
  return contrastRatio(background, theme.titleText) >= 4.5
    ? theme.titleText
    : luminance(background) > 0.5
      ? '#1f1f1f'
      : '#f5f6f7';
}
