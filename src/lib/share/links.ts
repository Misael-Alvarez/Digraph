import type { DiagramModel } from '@/lib/domain';
import { toMermaid } from '@/lib/dsl';
import { encodeDiagram } from './codec';

export type ShareTheme = 'light' | 'dark';

export interface ShareLinks {
  /** Read-only interactive page. */
  view: string;
  /** Server-rendered SVG, for an <img> or an iframe. */
  image: string;
  /** Markdown that renders on GitHub without any image hosting. */
  readme: string;
  /** Markdown for platforms that render remote SVG. */
  markdownImage: string;
  html: string;
  payloadLength: number;
}

/**
 * Everything needed to share a diagram.
 *
 * The diagram travels inside the link, because there is no server storing it
 * yet. The README snippet is a Mermaid block rather than an image: GitHub
 * renders Mermaid natively and strips remote SVG, so a picture link would
 * silently show nothing in the one place people paste these most.
 */
export async function buildShareLinks(
  model: DiagramModel,
  origin: string,
  theme: ShareTheme = 'light',
): Promise<ShareLinks> {
  const payload = await encodeDiagram(model);
  const base = origin.replace(/\/$/, '');
  const themeParam = theme === 'dark' ? '&theme=dark' : '';

  const view = `${base}/share?d=${payload}${themeParam}`;
  const image = `${base}/api/embed?d=${payload}${themeParam}`;

  return {
    view,
    image,
    readme: ['```mermaid', toMermaid(model), '```'].join('\n'),
    markdownImage: `[![Architecture diagram](${image})](${view})`,
    html: `<a href="${view}"><img src="${image}" alt="Architecture diagram" /></a>`,
    payloadLength: payload.length,
  };
}

/** Reads the diagram payload out of a URL's query string. */
export function payloadFromSearch(search: string | URLSearchParams): string | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  return params.get('d');
}

export function themeFromSearch(search: string | URLSearchParams): ShareTheme {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  return params.get('theme') === 'dark' ? 'dark' : 'light';
}
