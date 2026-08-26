import type { DiagramModel, Shape } from '@/lib/domain';
import type { CanvasTheme } from '@/lib/design/tokens';
import { ConnectorLayer } from './ConnectorLayer';
import {
  BoundaryShape,
  ContainerShape,
  GroupShape,
  ItemShape,
  type ShapeInteraction,
} from './shapes';

/** Paint order: boundaries sit behind groups, which sit behind their items. */
const PAINT_ORDER: Shape['type'][] = ['boundary', 'group', 'container', 'item'];

const RENDERERS = {
  boundary: BoundaryShape,
  group: GroupShape,
  container: ContainerShape,
  item: ItemShape,
} as const;

export interface DiagramSceneProps {
  model: DiagramModel;
  theme: CanvasTheme;
  /** Omitted when rendering for export or an embed, which is what keeps
   *  selection outlines and resize handles out of the produced file. */
  interactionFor?: (shape: Shape) => ShapeInteraction | undefined;
  connectorInteraction?: {
    selectedId?: string | null;
    onContextMenu?: (e: React.MouseEvent, id: string) => void;
    onClick?: (e: React.MouseEvent, id: string) => void;
  };
}

/**
 * The diagram itself, with no editor chrome.
 *
 * Both the interactive canvas and the exporter render this same component, so an
 * exported file cannot drift from what the user sees on screen.
 */
export function DiagramScene({
  model,
  theme,
  interactionFor,
  connectorInteraction,
}: DiagramSceneProps) {
  const lookup = (id: string) => model.shapes.find((s) => s.id === id);

  return (
    <>
      <g>
        {PAINT_ORDER.map((type) => (
          <g key={type}>
            {model.shapes
              .filter((s) => s.type === type)
              .map((shape) => {
                const Renderer = RENDERERS[type];
                const rendered = (
                  <Renderer
                    shape={shape}
                    theme={theme}
                    lookup={lookup}
                    interaction={interactionFor?.(shape)}
                  />
                );
                // Only the interactive canvas animates: an export or an embed is
                // a still image, and a half-played animation would bake into it.
                return interactionFor ? (
                  <g key={shape.id} className="shape-enter">
                    {rendered}
                  </g>
                ) : (
                  <g key={shape.id}>{rendered}</g>
                );
              })}
          </g>
        ))}
      </g>
      <ConnectorLayer connectors={model.connectors} theme={theme} {...connectorInteraction} />
    </>
  );
}
