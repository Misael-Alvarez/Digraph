import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  DiagramDocument,
  type DiagramDocumentProps,
} from '@/components/editor/canvas/DiagramDocument';

/**
 * Serialises a diagram to SVG in the browser.
 *
 * Next forbids importing `react-dom/server` from client code, and duplicating
 * the renderer would let exports drift from what the editor draws. So the same
 * component is mounted into a detached node and serialised from the DOM. Nothing
 * of the editor's chrome exists in `DiagramDocument`, which is what keeps
 * selection outlines out of exported files.
 */
export function diagramToSvgStringClient(options: DiagramDocumentProps): string {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    // Synchronous, so the node exists by the time it is serialised.
    flushSync(() => root.render(createElement(DiagramDocument, options)));
    const svg = host.querySelector('svg');
    if (!svg) throw new Error('The diagram could not be rendered.');
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${new XMLSerializer().serializeToString(svg)}`;
  } finally {
    root.unmount();
    host.remove();
  }
}
