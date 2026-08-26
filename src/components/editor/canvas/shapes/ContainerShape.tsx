import { handlersFor, type ShapeRenderProps } from './shapeProps';

/** The dashed well inside a group that the item stack sits in. */
export function ContainerShape({ shape, theme, interaction }: ShapeRenderProps) {
  const stroke = shape.fill ?? theme.containerStroke;
  return (
    <rect
      x={shape.x}
      y={shape.y}
      width={shape.w}
      height={shape.h}
      rx={8}
      fill={stroke}
      fillOpacity={0.06}
      stroke={stroke}
      strokeWidth={1.2}
      strokeDasharray="6 4"
      {...handlersFor(shape.id, interaction)}
    />
  );
}
