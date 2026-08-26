import { createElement } from 'react';
import {
  DiagramDocument,
  type DiagramDocumentProps,
} from '@/components/editor/canvas/DiagramDocument';

/**
 * Serialises a diagram to a standalone SVG document, on the server.
 *
 * `react-dom/server` is imported at call time rather than at module scope: Next
 * rejects a static import of it from any module that also imports a component,
 * which this one has to do — mounting the same `DiagramDocument` the editor uses
 * is what keeps an embed identical to an export identical to the canvas. The
 * browser has its own path in `renderSvgClient.ts`.
 */
export async function diagramToSvgString(options: DiagramDocumentProps): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const markup = renderToStaticMarkup(createElement(DiagramDocument, options));
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${markup}`;
}

export type { DiagramDocumentProps };
