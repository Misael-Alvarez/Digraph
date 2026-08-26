import { describe, expect, it } from 'vitest';
import { exportToMarkdown } from '@/lib/engine';
import { markdownToDiagram, parseMarkdown } from './markdownImport';

describe('parseMarkdown', () => {
  it('reads bullet and numbered lists as nodes', () => {
    const { nodes } = parseMarkdown('- Lambda\n* S3\n1. DynamoDB\n2) Redshift');
    expect(nodes.map((n) => n.label)).toEqual(['Lambda', 'S3', 'DynamoDB', 'Redshift']);
  });

  it('ignores headings and blank lines', () => {
    const { nodes } = parseMarkdown('# Title\n\n## Services\n\n- Lambda\n');
    expect(nodes).toHaveLength(1);
  });

  it('accepts the three arrow spellings', () => {
    const { edges } = parseMarkdown('A -> B\nC --> D\nE → F');
    expect(edges).toEqual([
      ['A', 'B', ''],
      ['C', 'D', ''],
      ['E', 'F', ''],
    ]);
  });

  it('reads the connection label after a colon', () => {
    expect(parseMarkdown('API -> Lambda : invoke').edges).toEqual([['API', 'Lambda', 'invoke']]);
  });

  it('deduplicates repeated node names', () => {
    expect(parseMarkdown('- Lambda\n- lambda\n- LAMBDA').nodes).toHaveLength(1);
  });

  it('matches known services and falls back to a generic server', () => {
    const { nodes } = parseMarkdown('- Lambda\n- Some bespoke thing');
    expect(nodes[0].serviceKey).toBe('aws-lambda');
    expect(nodes[1].serviceKey).toBe('gen-server');
  });

  it('returns nothing for empty input', () => {
    expect(parseMarkdown('')).toEqual({ nodes: [], edges: [] });
  });
});

describe('markdownToDiagram', () => {
  const source = `# Architecture

- CloudFront
- API Gateway
- Lambda
- DynamoDB

CloudFront -> API Gateway : HTTPS
API Gateway -> Lambda : invoke
Lambda -> DynamoDB : R/W
`;

  it('creates one group per node and one connector per edge', () => {
    const model = markdownToDiagram(source);
    expect(model.shapes.filter((s) => s.type === 'group')).toHaveLength(4);
    expect(model.connectors).toHaveLength(3);
  });

  it('stacks the flow into layers', () => {
    const model = markdownToDiagram(source);
    const yOf = (title: string) =>
      model.shapes.find((s) => s.type === 'group' && s.title === title)!.y;
    expect(yOf('CloudFront')).toBeLessThan(yOf('API Gateway'));
    expect(yOf('API Gateway')).toBeLessThan(yOf('Lambda'));
    expect(yOf('Lambda')).toBeLessThan(yOf('DynamoDB'));
  });

  it('assigns recognised service icons', () => {
    const model = markdownToDiagram(source);
    const keys = model.shapes.filter((s) => s.type === 'item').map((s) => s.icon?.key);
    expect(keys).toContain('aws-lambda');
    expect(keys).toContain('aws-dynamodb');
  });

  it('keeps connector labels', () => {
    const model = markdownToDiagram(source);
    expect(model.connectors.map((c) => c.label).sort()).toEqual(['HTTPS', 'R/W', 'invoke']);
  });

  it('routes every connector', () => {
    const model = markdownToDiagram(source);
    for (const c of model.connectors) expect(c.waypoints.length).toBeGreaterThanOrEqual(2);
  });

  it('survives a cycle without hanging', () => {
    const model = markdownToDiagram('- A\n- B\nA -> B\nB -> A');
    expect(model.shapes.filter((s) => s.type === 'group')).toHaveLength(2);
    expect(model.connectors).toHaveLength(2);
  });

  it('ignores edges naming unknown nodes', () => {
    const model = markdownToDiagram('- Lambda\nLambda -> Ghost');
    expect(model.connectors).toHaveLength(0);
  });

  it('returns an empty model for empty input', () => {
    expect(markdownToDiagram('   ').shapes).toHaveLength(0);
  });

  it('round-trips through the Markdown exporter', () => {
    const imported = markdownToDiagram(source);
    const reimported = markdownToDiagram(exportToMarkdown(imported));
    expect(reimported.shapes.filter((s) => s.type === 'group')).toHaveLength(4);
    expect(reimported.connectors).toHaveLength(3);
  });
});
