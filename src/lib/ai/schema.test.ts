import { describe, expect, it } from 'vitest';
import { compile, normaliseEdges, normaliseNode } from '@/lib/dsl';
import { AiDiagramSchema, aiToDsl, type AiDiagram } from './schema';

const base: AiDiagram = {
  title: 'Serverless API',
  summary: 'A serverless request path.',
  cloud: 'aws',
  boundaries: [{ id: 'vpc', label: 'Production VPC', variant: 'outer' }],
  nodes: [
    { id: 'api', service: 'aws-apigateway', label: 'Public API', note: '', boundary: 'vpc' },
    { id: 'fn', service: 'aws-lambda', label: '', note: 'handles auth', boundary: 'vpc' },
    { id: 'db', service: 'aws-dynamodb', label: '', note: '', boundary: '' },
  ],
  edges: [
    { from: 'api', to: 'fn', label: 'invoke' },
    { from: 'fn', to: 'db', label: 'R/W' },
  ],
};

describe('AiDiagramSchema', () => {
  it('accepts a well-formed answer', () => {
    expect(AiDiagramSchema.safeParse(base).success).toBe(true);
  });

  it('requires every field, so the model cannot omit one', () => {
    for (const field of ['title', 'summary', 'cloud', 'nodes', 'edges'] as const) {
      const missing: Record<string, unknown> = { ...base };
      delete missing[field];
      expect(AiDiagramSchema.safeParse(missing).success, field).toBe(false);
    }
  });

  it('rejects a cloud outside the three it supports', () => {
    expect(AiDiagramSchema.safeParse({ ...base, cloud: 'oracle' }).success).toBe(false);
  });
});

describe('aiToDsl', () => {
  it('produces a document that compiles', () => {
    const { document, dropped } = aiToDsl(base);
    expect(dropped).toEqual([]);
    const { model, diagnostics } = compile(document);
    expect(model.shapes.filter((s) => s.type === 'group')).toHaveLength(3);
    expect(model.connectors).toHaveLength(2);
    expect(diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });

  it('keeps labels and notes, and omits the empty ones', () => {
    const { document } = aiToDsl(base);
    expect(normaliseNode(document.nodes.api)).toMatchObject({ label: 'Public API' });
    expect(normaliseNode(document.nodes.fn).label).toBeUndefined();
    expect(normaliseNode(document.nodes.fn).note).toBe('handles auth');
  });

  it('carries boundary membership through', () => {
    const { document } = aiToDsl(base);
    expect(normaliseNode(document.nodes.api).in).toBe('vpc');
    expect(normaliseNode(document.nodes.db).in).toBeUndefined();
    expect(document.boundaries?.vpc.label).toBe('Production VPC');
  });

  it('drops a boundary nobody is inside', () => {
    const { document } = aiToDsl({
      ...base,
      boundaries: [...base.boundaries, { id: 'ghost', label: 'Unused', variant: 'sub' }],
    });
    expect(Object.keys(document.boundaries ?? {})).toEqual(['vpc']);
  });

  it('resolves an unprefixed service against the chosen cloud', () => {
    const { document, dropped } = aiToDsl({
      ...base,
      nodes: [{ id: 'fn', service: 'lambda', label: '', note: '', boundary: '' }],
      edges: [],
    });
    expect(dropped).toEqual([]);
    expect(normaliseNode(document.nodes.fn).service).toBe('aws-lambda');
  });

  it('falls back to the label when the service key is wrong', () => {
    const { document, dropped } = aiToDsl({
      ...base,
      nodes: [{ id: 'q', service: 'aws-simplequeue', label: 'SQS', note: '', boundary: '' }],
      edges: [],
    });
    expect(dropped).toEqual([]);
    expect(normaliseNode(document.nodes.q).service).toBe('aws-sqs');
  });

  it('drops an unresolvable node and reports it', () => {
    const { document, dropped } = aiToDsl({
      ...base,
      nodes: [
        ...base.nodes,
        {
          id: 'made-up',
          service: 'aws-quantumflux',
          label: 'Quantum Flux',
          note: '',
          boundary: '',
        },
      ],
      edges: [...base.edges, { from: 'db', to: 'made-up', label: 'x' }],
    });
    expect(dropped).toEqual(['aws-quantumflux']);
    expect(document.nodes['made-up']).toBeUndefined();
  });

  it('drops the edges of a dropped node rather than leaving them dangling', () => {
    const { document } = aiToDsl({
      ...base,
      nodes: [
        ...base.nodes,
        { id: 'made-up', service: 'nonsense', label: 'Nonsense Widget', note: '', boundary: '' },
      ],
      edges: [...base.edges, { from: 'db', to: 'made-up', label: 'x' }],
    });
    const edges = normaliseEdges(document.edges);
    expect(edges).toHaveLength(2);
    expect(edges.some((e) => e.to === 'made-up')).toBe(false);
  });

  it('emits edges in the compact arrow form the DSL reads', () => {
    const { document } = aiToDsl(base);
    expect(normaliseEdges(document.edges)).toEqual([
      { from: 'api', to: 'fn', label: 'invoke', style: 'solid' },
      { from: 'fn', to: 'db', label: 'R/W', style: 'solid' },
    ]);
  });

  it('handles an empty answer without throwing', () => {
    const { document, dropped } = aiToDsl({
      ...base,
      boundaries: [],
      nodes: [],
      edges: [],
    });
    expect(dropped).toEqual([]);
    expect(compile(document).model.shapes).toHaveLength(0);
  });

  it('works for every supported cloud', () => {
    for (const cloud of ['aws', 'azure', 'gcp'] as const) {
      const { document, dropped } = aiToDsl({
        ...base,
        cloud,
        boundaries: [],
        nodes: [{ id: 'fn', service: 'functions', label: '', note: '', boundary: '' }],
        edges: [],
      });
      expect(dropped, cloud).toEqual([]);
      expect(document.cloud).toBe(cloud);
    }
  });
});
