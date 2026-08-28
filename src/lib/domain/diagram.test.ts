import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, parseDiagramModel, safeParseDiagramModel } from './diagram';

const FIXTURES = ['public/aion-agents-arch.json', 'public/aion-agents-aws.json'];

describe('parseDiagramModel', () => {
  it('accepts the diagrams shipped with the app', () => {
    for (const path of FIXTURES) {
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      const model = parseDiagramModel(raw);
      expect(model.shapes.length).toBeGreaterThan(0);
      expect(model.canvas.w).toBeGreaterThan(0);
    }
  });

  it('stamps a schema version on pre-versioned files', () => {
    const raw = JSON.parse(readFileSync(FIXTURES[0], 'utf8'));
    expect(raw.schemaVersion).toBeUndefined();
    expect(parseDiagramModel(raw).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('fills in connector defaults', () => {
    const model = parseDiagramModel({
      canvas: { w: 100, h: 100 },
      shapes: [],
      connectors: [{ id: 'c', sourceId: 'a', targetId: 'b' }],
    });
    expect(model.connectors[0]).toMatchObject({ label: '', style: 'solid', waypoints: [] });
    expect(model.showFooter).toBe(false);
  });

  it('rejects a shape with a bad type', () => {
    const r = safeParseDiagramModel({
      canvas: { w: 1, h: 1 },
      shapes: [{ id: 'a', type: 'nonsense', parentId: null, x: 0, y: 0, w: 1, h: 1 }],
      connectors: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects a missing canvas', () => {
    expect(safeParseDiagramModel({ shapes: [], connectors: [] }).success).toBe(false);
  });

  it('rejects non-numeric coordinates', () => {
    const r = safeParseDiagramModel({
      canvas: { w: 1, h: 1 },
      shapes: [{ id: 'a', type: 'item', parentId: null, x: '0', y: 0, w: 1, h: 1 }],
      connectors: [],
    });
    expect(r.success).toBe(false);
  });

  it('drops the fills the old engine baked into every shape', () => {
    // Those colours were the light theme's, written into the model at creation,
    // so a stored diagram opened in dark mode came back as white cards.
    const model = parseDiagramModel({
      canvas: { w: 100, h: 100 },
      shapes: [
        { id: 'g', type: 'group', parentId: null, x: 0, y: 0, w: 1, h: 1, fill: '#FAFBFC' },
        { id: 'i', type: 'item', parentId: null, x: 0, y: 0, w: 1, h: 1, fill: '#F1F3F4' },
      ],
      connectors: [],
    });
    expect(model.shapes.map((s) => s.fill)).toEqual([undefined, undefined]);
  });

  it('keeps a fill somebody chose, including the same grey in lower case', () => {
    const model = parseDiagramModel({
      canvas: { w: 100, h: 100 },
      shapes: [
        { id: 'a', type: 'item', parentId: null, x: 0, y: 0, w: 1, h: 1, fill: '#f1f3f4' },
        { id: 'b', type: 'group', parentId: null, x: 0, y: 0, w: 1, h: 1, fill: '#123456' },
        // The old default for an item, on a shape that is not an item.
        { id: 'c', type: 'group', parentId: null, x: 0, y: 0, w: 1, h: 1, fill: '#F1F3F4' },
      ],
      connectors: [],
    });
    expect(model.shapes.map((s) => s.fill)).toEqual(['#f1f3f4', '#123456', '#F1F3F4']);
  });

  it('throws rather than returning junk', () => {
    expect(() => parseDiagramModel(null)).toThrow();
    expect(() => parseDiagramModel('{}')).toThrow();
  });
});
