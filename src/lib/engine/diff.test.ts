import { describe, expect, it } from 'vitest';
import { parseDsl } from '@/lib/dsl';
import { diffModels } from './diff';
import { createEmptyModel } from './model';

/** Compiles a document; the DSL is the shortest way to write an architecture. */
const build = (source: string) => parseDsl(source).model!;

const BEFORE = `version: 1
cloud: aws
nodes:
  api: apigateway
  fn: lambda
  db: dynamodb
edges:
  - api -> fn: invoke
  - fn -> db: R/W
`;

describe('diffModels', () => {
  it('says nothing changed when nothing did', () => {
    const diff = diffModels(build(BEFORE), build(BEFORE));
    expect(diff.identical).toBe(true);
  });

  it('survives the document being recompiled', () => {
    // Compiling builds a fresh model with new ids for everything. A diff that
    // trusted ids would report every service as replaced the moment somebody
    // edited the code panel.
    const first = build(BEFORE);
    const second = build(BEFORE);
    expect(first.shapes[0].id).not.toBe(second.shapes[0].id);
    expect(diffModels(first, second).identical).toBe(true);
  });

  it('names what was added and what went', () => {
    const after = build(`version: 1
cloud: aws
nodes:
  api: apigateway
  fn: lambda
  cache: elasticache
edges:
  - api -> fn: invoke
  - fn -> cache: read
`);
    const diff = diffModels(build(BEFORE), after);
    const added = diff.nodes.filter((n) => n.kind === 'added').map((n) => n.shape.icon?.key);
    const removed = diff.nodes.filter((n) => n.kind === 'removed').map((n) => n.shape.icon?.key);
    expect(added).toEqual(['aws-elasticache']);
    expect(removed).toEqual(['aws-dynamodb']);
  });

  it('reports a rename as a change, not as a replacement', () => {
    const after = build(`version: 1
cloud: aws
nodes:
  api:
    service: apigateway
    label: Public API
  fn: lambda
  db: dynamodb
edges:
  - api -> fn: invoke
  - fn -> db: R/W
`);
    const diff = diffModels(build(BEFORE), after);
    expect(diff.nodes).toHaveLength(1);
    expect(diff.nodes[0].kind).toBe('changed');
    expect(diff.nodes[0].fields).toContain('title');
  });

  it('notices what a node is now, not only what it is called', () => {
    const after = build(`version: 1
cloud: aws
nodes:
  api: apigateway
  fn:
    service: lambda
    owner: payments
    criticality: critical
  db: dynamodb
edges:
  - api -> fn: invoke
  - fn -> db: R/W
`);
    const [change] = diffModels(build(BEFORE), after).nodes;
    expect(change.kind).toBe('changed');
    expect(change.fields.sort()).toEqual(['criticality', 'owner']);
  });

  it('follows an edge through a recompile and sees what it now means', () => {
    const after = build(`version: 1
cloud: aws
nodes:
  api: apigateway
  fn: lambda
  db: dynamodb
edges:
  - api -> fn: invoke
  - from: fn
    to: db
    label: R/W
    protocol: https
    dataClass: pii
`);
    const diff = diffModels(build(BEFORE), after);
    expect(diff.nodes).toEqual([]);
    expect(diff.edges).toHaveLength(1);
    expect(diff.edges[0].kind).toBe('changed');
    expect(diff.edges[0].fields.sort()).toEqual(['dataClass', 'protocol']);
    expect(diff.edges[0].from).toBe('Lambda');
  });

  it('reports an edge that went away', () => {
    const after = build(`version: 1
cloud: aws
nodes:
  api: apigateway
  fn: lambda
  db: dynamodb
edges:
  - api -> fn: invoke
`);
    const diff = diffModels(build(BEFORE), after);
    const removed = diff.edges.filter((e) => e.kind === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].to).toBe('DynamoDB');
  });

  it('does not guess between two services of the same kind', () => {
    // Two unnamed lambdas on each side are not evidence of a rename.
    const twin = `version: 1
cloud: aws
nodes:
  a: lambda
  b: lambda
`;
    const diff = diffModels(build(twin), build(twin));
    expect(diff.identical).toBe(true);
  });

  it('compares an empty diagram with a full one', () => {
    const diff = diffModels(createEmptyModel(), build(BEFORE));
    expect(diff.nodes.every((n) => n.kind === 'added')).toBe(true);
    expect(diff.nodes).toHaveLength(3);
    expect(diff.edges).toHaveLength(2);
  });
});
