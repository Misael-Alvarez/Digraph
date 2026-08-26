import { fontSize, fontWeight } from '@/lib/design/tokens';
import { paletteFor } from '@/lib/editor/providers';
import { handlersFor, type ShapeRenderProps } from './shapeProps';

const HEADER_H = 34;
const RADIUS = 12;

/** A cloud boundary or a sub-boundary zone, drawn as a titled panel. */
export function BoundaryShape({ shape, interaction }: ShapeRenderProps) {
  const palette = paletteFor(shape.icon?.key);
  const isSub = shape.variant === 'sub';
  const headerFill = isSub ? palette.subHeader : palette.header;
  const clipId = `clip-header-${shape.id}`;

  return (
    <g>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={RADIUS}
        fill={palette.body}
        fillOpacity={0.55}
        stroke={palette.border}
        strokeWidth={1.25}
        {...handlersFor(shape.id, interaction)}
      />
      {/* Round only the top corners of the header by clipping it to the panel. */}
      <clipPath id={clipId}>
        <rect x={shape.x} y={shape.y} width={shape.w} height={HEADER_H} rx={RADIUS} />
        <rect x={shape.x} y={shape.y + RADIUS} width={shape.w} height={HEADER_H - RADIUS} />
      </clipPath>
      <g clipPath={`url(#${clipId})`} pointerEvents="none">
        <rect x={shape.x} y={shape.y} width={shape.w} height={HEADER_H} fill={headerFill} />
        {shape.icon && (
          <use
            href={`#i-${shape.icon.key}`}
            x={shape.x + 9}
            y={shape.y + 6}
            width={22}
            height={22}
          />
        )}
        <text
          x={shape.x + (shape.icon ? 38 : 12)}
          y={shape.y + HEADER_H / 2 + 4}
          fontSize={fontSize.sm}
          fontWeight={fontWeight.semibold}
          fill={palette.headerText}
        >
          {shape.title}
        </text>
      </g>
    </g>
  );
}
