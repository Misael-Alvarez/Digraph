import { describe, expect, it } from 'vitest';
import { SERVICE_ICONS } from '@/data/serviceIcons';
import { addConnector, addGroup, children, createEmptyModel } from '@/lib/engine';
import { parseDsl } from '@/lib/dsl';
import {
  EXPLAIN_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  buildExplainPrompt,
  buildUserPrompt,
} from './prompt';

const sample = parseDsl(
  'cloud: aws\nnodes:\n  fn: lambda\n  db: dynamodb\nedges:\n  - fn -> db: R/W\n',
).model!;

describe('SYSTEM_PROMPT', () => {
  it('lists every service the model is allowed to use', () => {
    for (const service of SERVICE_ICONS) {
      expect(SYSTEM_PROMPT, service.key).toContain(service.key);
    }
  });

  it('includes the cross-cloud equivalences', () => {
    expect(SYSTEM_PROMPT).toContain('Equivalent services across clouds');
    expect(SYSTEM_PROMPT).toMatch(/aws=aws-lambda/);
  });

  it('forbids inventing a key', () => {
    expect(SYSTEM_PROMPT).toContain('Never invent a key');
  });

  it('is large enough to be worth caching', () => {
    // Prompt caching needs roughly 1024 tokens of prefix to engage at all.
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(8000);
  });
});

describe('buildUserPrompt', () => {
  it('asks for a fresh design when generating', () => {
    const prompt = buildUserPrompt('generate', 'A serverless API');
    expect(prompt).toContain('A serverless API');
    expect(prompt).not.toContain('yaml');
  });

  it('includes the current diagram when modifying', () => {
    const prompt = buildUserPrompt('modify', 'add a cache', sample);
    expect(prompt).toContain('```yaml');
    expect(prompt).toContain('lambda');
    expect(prompt).toContain('add a cache');
  });

  it('asks for the whole architecture back, not just the change', () => {
    expect(buildUserPrompt('modify', 'add a cache', sample)).toContain('not just the change');
  });

  it('falls back to generating when there is nothing to modify', () => {
    const prompt = buildUserPrompt('modify', 'add a cache');
    expect(prompt).not.toContain('```yaml');
  });

  it('omits layout coordinates, which the model has no use for', () => {
    expect(buildUserPrompt('modify', 'x', sample)).not.toContain('layout:');
  });

  it('names the target cloud when retargeting', () => {
    expect(buildUserPrompt('retarget', 'GCP', sample)).toContain('Rebuild it on GCP');
  });
});

describe('explain prompts', () => {
  it('tells the model not to restate the diagram', () => {
    expect(EXPLAIN_SYSTEM_PROMPT).toContain('Do not restate the diagram');
  });

  it('sends the diagram and the question', () => {
    const prompt = buildExplainPrompt('What is missing?', sample);
    expect(prompt).toContain('```yaml');
    expect(prompt).toContain('What is missing?');
  });

  it('sends what the graph already worked out, so the model does not have to', () => {
    // A reviewer reading YAML sometimes misses a cycle and sometimes invents
    // one; these were found by walking the graph.
    const model = createEmptyModel();
    const a = addGroup(model, 0, 0);
    const b = addGroup(model, 600, 0);
    const c = addGroup(model, 1200, 0);
    const itemOf = (group: (typeof model.shapes)[number]) =>
      children(model, children(model, group.id).find((s) => s.type === 'container')!.id)[0];
    addConnector(model, itemOf(a).id, itemOf(b).id);
    addConnector(model, itemOf(b).id, itemOf(c).id);
    addConnector(model, itemOf(c).id, itemOf(a).id);

    const prompt = buildExplainPrompt('Review this', model);
    expect(prompt).toContain('Facts computed from the graph');
    expect(prompt).toContain('cycle');
    expect(prompt).toContain('score');
  });

  it('says nothing about an empty diagram rather than inventing a verdict', () => {
    expect(buildExplainPrompt('Review this', createEmptyModel())).not.toContain('Facts computed');
  });

  it('tells the model the facts are findings, not opinions', () => {
    expect(EXPLAIN_SYSTEM_PROMPT).toContain('not opinions');
  });
});
