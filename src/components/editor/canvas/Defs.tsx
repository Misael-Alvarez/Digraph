import { SVG_ICON_DEFS } from '@/components/icons/svgIconDefs';
import type { CanvasTheme } from '@/lib/design/tokens';

/**
 * Shared SVG definitions: the service icon sprite, the arrowhead marker and the
 * card shadow.
 *
 * The sprite string already carries its own `arrow` marker, so nothing else may
 * define one — the previous editor appended a second marker with the same id,
 * leaving which arrowhead won up to document order.
 */
export function Defs({ theme, idPrefix = '' }: { theme: CanvasTheme; idPrefix?: string }) {
  return (
    <defs>
      <g dangerouslySetInnerHTML={{ __html: SVG_ICON_DEFS }} />
      <marker
        id={`${idPrefix}arrowhead`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,1 L10,5 L0,9 z" fill={theme.connector} />
      </marker>
      <filter id={`${idPrefix}card-shadow`} x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={theme.shadow} />
      </filter>
    </defs>
  );
}
