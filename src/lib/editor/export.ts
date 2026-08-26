import type { DiagramModel } from '@/lib/domain';
import { exportToMarkdown } from '@/lib/engine';
import { diagramToSvgStringClient } from './renderSvgClient';
import type { DiagramDocumentProps } from '@/components/editor/canvas/DiagramDocument';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadSvg(options: DiagramDocumentProps, filename = 'diagram.svg'): void {
  triggerDownload(
    new Blob([diagramToSvgStringClient(options)], { type: 'image/svg+xml' }),
    filename,
  );
}

export interface PngOptions extends DiagramDocumentProps {
  /** Device-pixel multiplier; 2 gives a crisp result on retina displays. */
  pixelRatio?: number;
}

/** Rasterises the SVG document to a PNG via an offscreen canvas. */
export async function downloadPng(
  { pixelRatio = 2, ...options }: PngOptions,
  filename = 'diagram.png',
): Promise<void> {
  const svg = diagramToSvgStringClient({ ...options, scale: pixelRatio });
  // A data URL keeps the image same-origin, so the canvas is never tainted.
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not rasterise the diagram'));
    image.src = encoded;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(image, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode the PNG');
  triggerDownload(blob, filename);
}

export function downloadMarkdown(model: DiagramModel, filename = 'architecture.md'): void {
  triggerDownload(new Blob([exportToMarkdown(model)], { type: 'text/markdown' }), filename);
}

export function downloadProject(model: DiagramModel, filename = 'diagram.json'): void {
  triggerDownload(
    new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' }),
    filename,
  );
}
