import { describe, expect, it } from 'vitest';
import { addConnector, addGroup, children, createEmptyModel } from '@/lib/engine';
import { diagramToSvgString } from './export';

function sampleModel() {
  const m = createEmptyModel();
  const a = addGroup(m, 0, 0);
  a.title = 'Frontend';
  const b = addGroup(m, 800, 0);
  b.title = 'Backend';
  const items = m.shapes.filter((s) => s.type === 'item');
  items[0].title = 'CloudFront';
  items[0].icon = { kind: 'symbol', key: 'aws-cloudfront' };
  items[1].title = 'Lambda';
  items[1].icon = { kind: 'symbol', key: 'aws-lambda' };
  const c = addConnector(m, items[0].id, items[1].id);
  c.label = 'HTTPS';
  return m;
}

describe('diagramToSvgString', () => {
  it('produces a standalone SVG document', () => {
    const svg = diagramToSvgString({ model: sampleModel() });
    expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox=');
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('carries no editor chrome', () => {
    // The old exporter cloned the live DOM, so these came along and rendered as
    // solid black rectangles on top of the diagram.
    const svg = diagramToSvgString({ model: sampleModel() });
    for (const chrome of [
      'sel-outline',
      'collide-outline',
      'resize-handle',
      'conn-src-highlight',
      'canvas-bg',
    ]) {
      expect(svg, chrome).not.toContain(chrome);
    }
  });

  it('gives every painted rectangle an explicit fill', () => {
    // A rect with no fill attribute defaults to black in a standalone file, which
    // is exactly how the old export covered the diagram in black boxes.
    // Rects inside a <clipPath> describe geometry and are never painted.
    const svg = diagramToSvgString({ model: sampleModel() });
    const painted = svg.replace(/<clipPath[\s\S]*?<\/clipPath>/g, '');
    const rects = painted.match(/<rect[^>]*>/g) ?? [];
    expect(rects.length).toBeGreaterThan(0);
    for (const rect of rects) {
      expect(rect, rect).toMatch(/fill="/);
    }
  });

  it('defines exactly one arrowhead marker', () => {
    const svg = diagramToSvgString({ model: sampleModel() });
    const ids = svg.match(/<marker[^>]*id="([^"]+)"/g) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
    expect(svg.match(/id="arrow"/g)).toBeNull();
  });

  it('includes the icon sprite so services are visible offline', () => {
    const svg = diagramToSvgString({ model: sampleModel() });
    expect(svg).toContain('id="i-aws-lambda"');
    expect(svg).toContain('href="#i-aws-lambda"');
  });

  it('renders titles and connector labels', () => {
    const svg = diagramToSvgString({ model: sampleModel() });
    expect(svg).toContain('CloudFront');
    expect(svg).toContain('Lambda');
    expect(svg).toContain('HTTPS');
  });

  it('embeds brand logos as data URLs rather than app paths', () => {
    // `/aion_logo.png` resolves to nothing once the file leaves the app.
    const svg = diagramToSvgString({ model: sampleModel(), brand: 'dual' });
    expect(svg).not.toContain('/aion_logo.png');
    expect(svg).not.toContain('/banorte_logo.png');
    expect(svg).toContain('data:image/png;base64,');
    expect(svg).toContain('AION Cloud');
    expect(svg).toContain('Banorte');
  });

  it('omits the footer when no brand is selected', () => {
    const svg = diagramToSvgString({ model: sampleModel(), brand: 'none' });
    expect(svg).not.toContain('AION Cloud');
  });

  it('references no external resources at all', () => {
    const svg = diagramToSvgString({ model: sampleModel(), brand: 'dual' });
    const externals = svg.match(/(?:href|src)="(?!#|data:)[^"]*"/g) ?? [];
    // Only the two xmlns declarations may point outward, and those are namespaces.
    expect(externals).toEqual([]);
  });

  it('switches the whole document to the dark palette', () => {
    const light = diagramToSvgString({ model: sampleModel(), dark: false });
    const dark = diagramToSvgString({ model: sampleModel(), dark: true });
    expect(light).toContain('#ffffff');
    expect(dark).toContain('#161920');
    expect(dark).not.toBe(light);
  });

  it('scales pixel dimensions without changing the viewBox', () => {
    const model = sampleModel();
    const at1 = diagramToSvgString({ model, scale: 1 });
    const at2 = diagramToSvgString({ model, scale: 2 });
    const viewBox = (s: string) => s.match(/viewBox="([^"]+)"/)![1];
    const width = (s: string) => Number(s.match(/width="(\d+)"/)![1]);

    expect(viewBox(at1)).toBe(viewBox(at2));
    expect(width(at2)).toBe(width(at1) * 2);
  });

  it('handles an empty diagram without producing a degenerate viewBox', () => {
    const svg = diagramToSvgString({ model: createEmptyModel() });
    const [, , w, h] = svg
      .match(/viewBox="([^"]+)"/)![1]
      .split(' ')
      .map(Number);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });

  it('clips item text instead of guessing a character count', () => {
    const m = createEmptyModel();
    const g = addGroup(m, 0, 0);
    const item = children(m, children(m, g.id)[0].id)[0];
    item.title = 'An extremely long service name that will not fit inside the card';
    const svg = diagramToSvgString({ model: m });
    // The full string is present; overflow is handled geometrically by a clip.
    expect(svg).toContain('An extremely long service name that will not fit inside the card');
    expect(svg).toContain('clipPath');
  });
});
