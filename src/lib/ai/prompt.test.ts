import { describe, expect, it } from 'vitest';
import { SERVICE_ICONS } from '@/data/serviceIcons';
import { parseDsl } from '@/lib/dsl';
import { EXPLAIN_SYSTEM_PROMPT, SYSTEM_PROMPT, buildExplainPrompt, buildUserPrompt } from './prompt';

const sample = parseDsl('cloud: aws\nnodes:\n  fn: lambda\n  db: dynamodb\nedges:\n  - fn -> db: R/W\n').model!;

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
});
