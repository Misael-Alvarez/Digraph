import type { Connector } from '@/lib/domain';
import type { CanvasTheme } from '@/lib/design/tokens';
import { fontSize, fontWeight } from '@/lib/design/tokens';
import { labelAnchor, waypointsToPath } from '@/lib/editor/connectorPath';

interface ConnectorLayerProps {
  connectors: Connector[];
  theme: CanvasTheme;
  selectedId?: string | null;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onClick?: (e: React.MouseEvent, id: string) => void;
}

const LABEL_H = 20;
const LABEL_PAD = 10;

export function ConnectorLayer({
  connectors,
  theme,
  selectedId,
  onContextMenu,
  onClick,
}: ConnectorLayerProps) {
  return (
    <g>
      {connectors.map((c) => {
        const d = waypointsToPath(c.waypoints);
        if (!d) return null;
        const anchor = c.label ? labelAnchor(c.waypoints) : null;
        const selected = selectedId === c.id;
        // Rough advance width; the label chip only has to look balanced.
        const labelWidth = c.label.length * 6.2 + LABEL_PAD * 2;

        return (
          <g key={c.id}>
            <path
              d={d}
              fill="none"
              stroke={selected ? theme.titleText : theme.connector}
              strokeWidth={selected ? 2.4 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={c.style === 'dashed' ? '7 5' : undefined}
              markerEnd="url(#arrowhead)"
            />
            {(onContextMenu || onClick) && (
              // Invisible fat path so the connector is easy to hit with a pointer.
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: 'pointer' }}
                onContextMenu={(e) => onContextMenu?.(e, c.id)}
                onClick={(e) => onClick?.(e, c.id)}
              />
            )}
            {anchor && (
              <g pointerEvents="none">
                <rect
                  x={anchor.x - labelWidth / 2}
                  y={anchor.y - LABEL_H / 2}
                  width={labelWidth}
                  height={LABEL_H}
                  rx={LABEL_H / 2}
                  fill={theme.connectorLabelFill}
                  stroke={theme.connectorLabelStroke}
                  strokeWidth={1}
                />
                <text
                  x={anchor.x}
                  y={anchor.y + 4}
                  fontSize={fontSize.xs}
                  fontWeight={fontWeight.medium}
                  fill={theme.connectorLabelText}
                  textAnchor="middle"
                >
                  {c.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
