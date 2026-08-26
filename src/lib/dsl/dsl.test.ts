import { describe, expect, it } from 'vitest';
import type { DiagramModel } from '@/lib/domain';
import * as E from '@/lib/engine';
import { TEMPLATES } from '@/lib/editor/templates';
import { parseDsl } from './parse';
import { serializeDsl } from './serialize';
import { dominantCloud, matchServiceLabel, resolveService, shortenService } from './services';
import { normaliseEdges } from './schema';

const SAMPLE = `version: 1
cloud: aws
nodes:
  api:
    service: apigateway
    label: API pública
  fn: lambda
  db: dynamodb
edges:
  - api -> fn: invoke
  - fn -> db: R/W
`;

const nodesOf = (model: DiagramModel | null) =>
  (model?.shapes ?? []).filter((s) => s.type === 'group');
const itemsOf = (model: DiagramModel | null) =>
  (model?.shapes ?? []).filter((s) => s.type === 'item');

describe('resolveService', () => {
  it('accepts a fully qualified key', () => {
    expect(resolveService('aws-lambda')).toBe('aws-lambda');
  });

  it('resolves a bare name inside the document cloud', () => {
    expect(resolveService('lambda', 'aws')).toBe('aws-lambda');
    expect(resolveService('functions', 'azure')).toBe('az-functions');
    expect(resolveService('cloudrun', 'gcp')).toBe('gcp-cloudrun');
  });

  it('matches a human label', () => {
    expect(resolveService('API Gateway', 'aws')).toBe('aws-apigateway');
  });

  it('returns null for something it does not know', () => {
    expect(resolveService('definitely-not-a-service')).toBeNull();
    expect(resolveService('  ')).toBeNull();
  });

  it('shortens a key back to its bare form', () => {
    expect(shortenService('aws-lambda', 'aws')).toBe('lambda');
    expect(shortenService('gen-redis', 'aws')).toBe('gen-redis');
    expect(shortenService('aws-lambda')).toBe('aws-lambda');
  });

  it('reports a single cloud only when the services agree', () => {
    expect(dominantCloud(['aws-lambda', 'aws-s3'])).toBe('aws');
    expect(dominantCloud(['aws-lambda', 'gcp-bigquery'])).toBeUndefined();
    expect(dominantCloud(['gen-redis'])).toBeUndefined();
  });
});

describe('normaliseEdges', () => {
  it('reads the compact arrow form', () => {
    expect(normaliseEdges([{ 'a -> b': 'label' }])).toEqual([
      { from: 'a', to: 'b', label: 'label', style: 'solid' },
    ]);
  });

  it('accepts the other arrow spellings', () => {
    expect(normaliseEdges([{ 'a --> b': '' }, { 'c → d': '' }]).map((e) => e.from)).toEqual([
      'a',
      'c',
    ]);
  });

  it('reads the long form with a style', () => {
    expect(normaliseEdges([{ from: 'a', to: 'b', style: 'dashed' }])).toEqual([
      { from: 'a', to: 'b', label: '', style: 'dashed' },
    ]);
  });

  it('skips a key with no arrow in it', () => {
    expect(normaliseEdges([{ nonsense: 'x' }])).toEqual([]);
  });
});

describe('parseDsl', () => {
  it('builds one group per node and one connector per edge', () => {
    const { model, diagnostics } = parseDsl(SAMPLE);
    expect(diagnostics).toEqual([]);
    expect(nodesOf(model)).toHaveLength(3);
    expect(model!.connectors).toHaveLength(2);
  });

  it('resolves services against the document cloud', () => {
    const { model } = parseDsl(SAMPLE);
    expect(itemsOf(model).map((s) => s.icon?.key)).toEqual([
      'aws-apigateway',
      'aws-lambda',
      'aws-dynamodb',
    ]);
  });

  it('honours an explicit label and falls back to the service name', () => {
    const { model } = parseDsl(SAMPLE);
    const titles = itemsOf(model).map((s) => s.title);
    expect(titles[0]).toBe('API pública');
    expect(titles[1]).toBe('Lambda');
  });

  it('lays nodes out in the direction of the edges', () => {
    const { model } = parseDsl(SAMPLE);
    const [api, fn, db] = nodesOf(model);
    expect(api.y).toBeLessThan(fn.y);
    expect(fn.y).toBeLessThan(db.y);
  });

  it('pins positions given in the layout block', () => {
    const { model } = parseDsl(`${SAMPLE}layout:\n  api: [1000, 2000]\n`);
    const api = nodesOf(model).find((g) => g.title === 'API pública')!;
    expect({ x: api.x, y: api.y }).toEqual({ x: 1000, y: 2000 });
  });

  it('mixes pinned and automatic positions', () => {
    const { model } = parseDsl(`${SAMPLE}layout:\n  db: [50, 60]\n`);
    const groups = nodesOf(model);
    const db = groups.find((g) => g.title === 'DynamoDB')!;
    expect({ x: db.x, y: db.y }).toEqual({ x: 50, y: 60 });
    expect(groups.find((g) => g.title === 'Lambda')!.x).not.toBe(50);
  });

  it('carries the connector label and style', () => {
    const { model } = parseDsl(
      `${SAMPLE}  - from: api\n    to: db\n    label: direct\n    style: dashed\n`,
    );
    const dashed = model!.connectors.find((c) => c.style === 'dashed');
    expect(dashed?.label).toBe('direct');
  });

  it('routes every connector it creates', () => {
    const { model } = parseDsl(SAMPLE);
    for (const c of model!.connectors) expect(c.waypoints.length).toBeGreaterThanOrEqual(2);
  });

  it('groups nodes inside the boundary they declare', () => {
    const { model, diagnostics } = parseDsl(`version: 1
cloud: aws
boundaries:
  vpc:
    label: Production VPC
nodes:
  fn:
    service: lambda
    in: vpc
  db:
    service: dynamodb
    in: vpc
edges: []
`);
    expect(diagnostics).toEqual([]);
    const boundary = model!.shapes.find((s) => s.type === 'boundary')!;
    expect(boundary.title).toBe('Production VPC');
    for (const group of nodesOf(model)) {
      expect(E.geometricallyContains(E.bbox(boundary), E.bbox(group))).toBe(true);
    }
  });

  it('returns an empty model for empty source', () => {
    const { model, diagnostics } = parseDsl('   ');
    expect(model!.shapes).toHaveLength(0);
    expect(diagnostics).toEqual([]);
  });
});

describe('parseDsl diagnostics', () => {
  it('reports a YAML syntax error with a position', () => {
    const { model, diagnostics } = parseDsl('nodes:\n  a: [unclosed\n');
    expect(model).toBeNull();
    expect(diagnostics[0].severity).toBe('error');
    expect(diagnostics[0].to).toBeGreaterThan(0);
  });

  it('reports a missing required field', () => {
    const { model, diagnostics } = parseDsl('version: 1\n');
    expect(model).toBeNull();
    expect(diagnostics.some((d) => d.message.includes('nodes'))).toBe(true);
  });

  it('reports an unknown service and anchors it to the node', () => {
    const { diagnostics } = parseDsl('nodes:\n  broken: not-a-real-service\nedges: []\n');
    const issue = diagnostics.find((d) => d.message.includes('Unknown service'));
    expect(issue?.severity).toBe('error');
    expect(issue!.to).toBeGreaterThan(issue!.from);
  });

  it('still produces a diagram when one service is unknown', () => {
    const { model } = parseDsl('nodes:\n  ok: lambda\n  broken: nope\nedges: []\n');
    expect(nodesOf(model)).toHaveLength(2);
  });

  it('warns about an edge naming a node that does not exist', () => {
    const { model, diagnostics } = parseDsl(
      'cloud: aws\nnodes:\n  a: lambda\nedges:\n  - a -> ghost: x\n',
    );
    expect(model!.connectors).toHaveLength(0);
    expect(diagnostics.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('warns about an empty boundary', () => {
    const { diagnostics } = parseDsl(
      'cloud: aws\nboundaries:\n  vpc: {}\nnodes:\n  a: lambda\nedges: []\n',
    );
    expect(diagnostics.some((d) => d.message.includes('no nodes'))).toBe(true);
  });
});

describe('serializeDsl', () => {
  it('emits source that parses back to the same diagram', () => {
    const original = parseDsl(SAMPLE).model!;
    const round = parseDsl(serializeDsl(original)).model!;

    expect(nodesOf(round)).toHaveLength(nodesOf(original).length);
    expect(round.connectors).toHaveLength(original.connectors.length);
    expect(itemsOf(round).map((s) => s.icon?.key)).toEqual(
      itemsOf(original).map((s) => s.icon?.key),
    );
    expect(itemsOf(round).map((s) => s.title)).toEqual(itemsOf(original).map((s) => s.title));
  });

  it('preserves positions through a round trip', () => {
    const original = parseDsl(SAMPLE).model!;
    const moved = E.cloneModel(original);
    const group = moved.shapes.find((s) => s.type === 'group')!;
    group.x = 1234;
    group.y = 567;

    const round = parseDsl(serializeDsl(moved)).model!;
    const same = round.shapes.find((s) => s.type === 'group' && s.title === group.title)!;
    expect({ x: same.x, y: same.y }).toEqual({ x: 1234, y: 567 });
  });

  it('preserves connector labels and styles', () => {
    const model = parseDsl(SAMPLE).model!;
    model.connectors[0].style = 'dashed';
    const round = parseDsl(serializeDsl(model)).model!;
    expect(round.connectors.map((c) => c.label).sort()).toEqual(['R/W', 'invoke']);
    expect(round.connectors.some((c) => c.style === 'dashed')).toBe(true);
  });

  it('is stable: serializing twice gives identical source', () => {
    const model = parseDsl(SAMPLE).model!;
    const once = serializeDsl(model);
    expect(serializeDsl(parseDsl(once).model!)).toBe(once);
  });

  it('uses the compact arrow form for plain edges', () => {
    const source = serializeDsl(parseDsl(SAMPLE).model!);
    expect(source).toMatch(/- api-p\S* -> lambda: invoke/);
  });

  it('collapses a node whose label and subtitle just repeat the catalogue', () => {
    const model = parseDsl('cloud: aws\nnodes:\n  fn: lambda\nedges: []\n').model!;
    expect(serializeDsl(model)).toMatch(/^ {2}lambda: lambda$/m);
  });

  it('writes coordinates inline rather than as a block sequence', () => {
    expect(serializeDsl(parseDsl(SAMPLE).model!)).toMatch(/\[\d+, ?\d+\]/);
  });

  it('emits the shared cloud and strips the prefix from every service', () => {
    const source = serializeDsl(parseDsl(SAMPLE).model!);
    expect(source).toContain('cloud: aws');
    expect(source).not.toContain('aws-lambda');
  });

  it('keeps full keys when the diagram spans several clouds', () => {
    const model = parseDsl('nodes:\n  a: aws-lambda\n  b: gcp-bigquery\nedges: []\n').model!;
    const source = serializeDsl(model);
    expect(source).not.toContain('cloud:');
    expect(source).toContain('aws-lambda');
    expect(source).toContain('gcp-bigquery');
  });

  it('can leave the layout block out', () => {
    const source = serializeDsl(parseDsl(SAMPLE).model!, { includeLayout: false });
    expect(source).not.toContain('layout:');
  });

  it('round-trips boundaries and membership', () => {
    const original = parseDsl(`cloud: aws
boundaries:
  vpc:
    label: Production VPC
nodes:
  fn:
    service: lambda
    in: vpc
edges: []
`).model!;
    const source = serializeDsl(original);
    expect(source).toContain('Production VPC');
    expect(source).toMatch(/in: \S+/);

    const round = parseDsl(source).model!;
    expect(round.shapes.filter((s) => s.type === 'boundary')).toHaveLength(1);
  });

  it('handles an empty diagram', () => {
    const source = serializeDsl(E.createEmptyModel());
    expect(parseDsl(source).model!.shapes).toHaveLength(0);
  });
});

describe('templates round-trip through the DSL', () => {
  for (const template of TEMPLATES) {
    it(`preserves "${template.name}"`, () => {
      const original = template.build();
      const round = parseDsl(serializeDsl(original)).model!;

      expect(nodesOf(round)).toHaveLength(nodesOf(original).length);
      expect(round.connectors).toHaveLength(original.connectors.length);
      expect(
        itemsOf(round)
          .map((s) => s.icon?.key)
          .sort(),
      ).toEqual(
        itemsOf(original)
          .map((s) => s.icon?.key)
          .sort(),
      );
      // Positions survive, so loading a template and editing its code is lossless.
      const positions = (m: DiagramModel) =>
        nodesOf(m)
          .map((g) => `${g.title}@${Math.round(g.x)},${Math.round(g.y)}`)
          .sort();
      expect(positions(round)).toEqual(positions(original));
    });
  }
});

describe('matchServiceLabel', () => {
  it('matches an exact name first', () => {
    expect(matchServiceLabel('Lambda')).toBe('aws-lambda');
  });

  it('looks past descriptive words a human would add', () => {
    expect(matchServiceLabel('S3 Bucket')).toBe('aws-s3');
    expect(matchServiceLabel('RDS Primary')).toBe('aws-rds');
    expect(matchServiceLabel('EC2 Web Tier')).toBe('aws-ec2');
  });

  it('prefers the most specific service when several could match', () => {
    // "API Gateway" must not lose to a shorter label that also fits.
    expect(matchServiceLabel('API Gateway')).toBe('aws-apigateway');
  });

  it('returns null rather than guessing', () => {
    expect(matchServiceLabel('Bespoke Widget')).toBeNull();
    expect(matchServiceLabel('')).toBeNull();
  });

  it('leaves the strict resolver strict', () => {
    // The DSL must still reject an unknown service instead of matching loosely.
    expect(resolveService('S3 Bucket')).toBeNull();
  });
});

describe('generated diagrams are clean', () => {
  const collisionTitles = (model: DiagramModel) =>
    [...E.checkCollisions(model)]
      .map((id) => E.getShape(model, id)?.title ?? id)
      .filter((t) => !t.startsWith('ctr_'))
      .sort();

  it('keeps a node that is not in a boundary clear of it', () => {
    const { model } = parseDsl(`cloud: aws
boundaries:
  vpc:
    label: Production VPC
nodes:
  cdn: cloudfront
  api: { service: apigateway, in: vpc }
  fn: { service: lambda, in: vpc }
  db: { service: dynamodb, in: vpc }
  bucket: { service: s3 }
edges:
  - cdn -> api: HTTPS
  - api -> fn: invoke
  - fn -> db: R/W
  - fn -> bucket: files
`);
    expect(collisionTitles(model!)).toEqual([]);
  });

  it('still contains every declared member', () => {
    const { model } = parseDsl(`cloud: aws
boundaries:
  vpc: { label: VPC }
nodes:
  a: { service: lambda, in: vpc }
  b: { service: dynamodb, in: vpc }
  c: { service: s3 }
edges:
  - a -> b: x
  - a -> c: y
`);
    const boundary = model!.shapes.find((s) => s.type === 'boundary')!;
    const groups = model!.shapes.filter((s) => s.type === 'group');
    const inside = groups.filter((g) => E.geometricallyContains(E.bbox(boundary), E.bbox(g)));
    expect(inside).toHaveLength(2);
  });

  it('produces no overlaps for a plain layered diagram', () => {
    const { model } = parseDsl(`cloud: aws
nodes:
  a: cloudfront
  b: apigateway
  c: lambda
  d: dynamodb
  e: s3
edges:
  - a -> b: ''
  - b -> c: ''
  - c -> d: ''
  - c -> e: ''
`);
    expect(collisionTitles(model!)).toEqual([]);
  });

  it('handles two boundaries side by side', () => {
    const { model } = parseDsl(`cloud: aws
boundaries:
  prod: { label: Production }
  data: { label: Data }
nodes:
  api: { service: apigateway, in: prod }
  fn: { service: lambda, in: prod }
  db: { service: dynamodb, in: data }
  wh: { service: redshift, in: data }
edges:
  - api -> fn: ''
  - fn -> db: ''
  - db -> wh: ''
`);
    expect(model!.shapes.filter((s) => s.type === 'boundary')).toHaveLength(2);
    expect(collisionTitles(model!)).toEqual([]);
  });
});
