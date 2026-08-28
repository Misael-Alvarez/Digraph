import { fontSize, fontWeight, isColor, readableTextOn } from '@/lib/design/tokens';
import { paletteFor } from '@/lib/editor/providers';
import { handlersFor, type ShapeRenderProps } from './shapeProps';

const PAD = 10;
const ICON = 26;
const GAP = 10;

/**
 * A service card.
 *
 * Text is clipped geometrically rather than truncated by character count: the
 * old renderer guessed a character width (`title.slice(0, width / 7)`), which
 * cut correct labels short and left wrong ones overflowing.
 */
export function ItemShape({ shape, theme, lookup, interaction }: ShapeRenderProps) {
  const container = shape.parentId ? lookup(shape.parentId) : undefined;
  const group = container?.parentId ? lookup(container.parentId) : undefined;
  const palette = paletteFor(group?.icon?.key ?? container?.icon?.key);

  // A card the reader has coloured itself carries its own text colours: the
  // theme's near-black title on a navy card is not readable, and the theme has
  // no way to know what colour the card is.
  const tinted = isColor(shape.fill);
  const background = tinted ? shape.fill! : theme.itemFill;
  const titleColor = tinted ? readableTextOn(background, theme) : theme.titleText;

  const textX = shape.x + PAD + ICON + GAP;
  const textWidth = Math.max(shape.w - (PAD + ICON + GAP) - PAD, 0);
  const clipId = `clip-text-${shape.id}`;

  // Vertically centre the whole text block, whatever number of lines it has.
  const lines = 1 + (shape.subtitle ? 1 : 0) + (shape.note ? 1 : 0);
  const blockHeight = fontSize.xs * 1.35 + (lines - 1) * fontSize.sm * 1.25;
  let cursorY = shape.y + shape.h / 2 - blockHeight / 2 + fontSize.xs;

  const titleY = cursorY;
  cursorY += shape.subtitle ? fontSize.sm * 1.25 : 0;
  const subtitleY = cursorY;
  cursorY += shape.note ? fontSize.sm * 1.15 : 0;
  const noteY = cursorY;

  return (
    <g>
      <clipPath id={clipId}>
        <rect x={textX} y={shape.y} width={textWidth} height={shape.h} />
      </clipPath>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={8}
        fill={background}
        stroke={palette.border}
        strokeWidth={1}
        filter="url(#card-shadow)"
        {...handlersFor(shape.id, interaction)}
      />
      {shape.icon && (
        <use
          href={`#i-${shape.icon.key}`}
          x={shape.x + PAD}
          y={shape.y + (shape.h - ICON) / 2}
          width={ICON}
          height={ICON}
        />
      )}
      <g clipPath={`url(#${clipId})`} pointerEvents="none">
        <text
          x={textX}
          y={titleY}
          fontSize={fontSize.xs}
          fontWeight={fontWeight.semibold}
          fill={titleColor}
        >
          {shape.title}
        </text>
        {shape.subtitle && (
          <text
            x={textX}
            y={subtitleY}
            fontSize={fontSize.xs - 1}
            fill={tinted ? titleColor : theme.subtitleText}
            fillOpacity={tinted ? 0.75 : 1}
          >
            {shape.subtitle}
          </text>
        )}
        {shape.note && (
          <text
            x={textX}
            y={noteY}
            fontSize={fontSize.xs - 2}
            fill={tinted ? titleColor : theme.noteText}
            fillOpacity={tinted ? 0.6 : 1}
          >
            {shape.note}
          </text>
        )}
      </g>
    </g>
  );
}
