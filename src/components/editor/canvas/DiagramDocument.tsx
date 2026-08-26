import type { DiagramModel } from '@/lib/domain';
import { canvasTheme, fontSize, fontWeight, providerColors } from '@/lib/design/tokens';
import { contentBBox } from '@/lib/engine';
import { AION_LOGO } from '@/data/aionLogo';
import { BANORTE_LOGO } from '@/data/banorteLogo';
import type { BrandMode } from '@/lib/editor';
import { Defs } from './Defs';
import { DiagramScene } from './DiagramScene';

export interface DiagramDocumentProps {
  model: DiagramModel;
  dark?: boolean;
  brand?: BrandMode;
  padding?: number;
  /** Multiplies the pixel dimensions; the viewBox is unchanged. */
  scale?: number;
}

const FOOTER_H = 56;

/**
 * A complete, self-contained `<svg>` document.
 *
 * Used for file export and, later, for server-rendered embeds. Everything it
 * needs is inline — icon symbols, logos as data URLs, literal colours — because
 * a downloaded .svg has no stylesheet and no access to the app's /public folder.
 */
export function DiagramDocument({
  model,
  dark = false,
  brand = 'none',
  padding = 48,
  scale = 1,
}: DiagramDocumentProps) {
  const theme = canvasTheme(dark);
  const box = contentBBox(model);
  const showFooter = brand !== 'none';
  const width = box.w + padding * 2;
  const height = box.h + padding * 2 + (showFooter ? FOOTER_H : 0);
  const originX = box.x - padding;
  const originY = box.y - padding;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`${originX} ${originY} ${width} ${height}`}
      width={Math.round(width * scale)}
      height={Math.round(height * scale)}
      fontFamily="-apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    >
      <Defs theme={theme} />
      <rect x={originX} y={originY} width={width} height={height} fill={theme.sheet} />
      <DiagramScene model={model} theme={theme} />
      {showFooter && (
        <BrandFooter
          brand={brand}
          x={originX}
          y={originY + height - FOOTER_H}
          width={width}
          divider={theme.divider}
          textFill={theme.subtitleText}
        />
      )}
    </svg>
  );
}

function BrandFooter({
  brand,
  x,
  y,
  width,
  divider,
  textFill,
}: {
  brand: BrandMode;
  x: number;
  y: number;
  width: number;
  divider: string;
  textFill: string;
}) {
  const showAion = brand === 'aion' || brand === 'dual';
  const showBanorte = brand === 'banorte' || brand === 'dual';
  const centre = x + width / 2;
  const logoY = y + 16;

  return (
    <g pointerEvents="none">
      <line x1={x + 40} y1={y} x2={x + width - 40} y2={y} stroke={divider} strokeWidth={1} />
      {showAion && (
        <>
          <image
            href={AION_LOGO}
            x={brand === 'dual' ? centre - 170 : centre - 96}
            y={logoY}
            width={24}
            height={24}
            preserveAspectRatio="xMidYMid meet"
          />
          <text
            x={brand === 'dual' ? centre - 138 : centre - 64}
            y={logoY + 17}
            fontSize={fontSize.xs}
            fontWeight={fontWeight.medium}
            fill={providerColors.aion}
          >
            AION Cloud
          </text>
        </>
      )}
      {brand === 'dual' && (
        <text x={centre} y={logoY + 17} fontSize={fontSize.xs} fill={textFill} textAnchor="middle">
          ×
        </text>
      )}
      {showBanorte && (
        <>
          <image
            href={BANORTE_LOGO}
            x={brand === 'dual' ? centre + 44 : centre - 96}
            y={logoY}
            width={62}
            height={24}
            preserveAspectRatio="xMidYMid meet"
          />
          <text
            x={brand === 'dual' ? centre + 114 : centre - 26}
            y={logoY + 17}
            fontSize={fontSize.xs}
            fontWeight={fontWeight.medium}
            fill={providerColors.banorte}
          >
            Banorte
          </text>
        </>
      )}
    </g>
  );
}
