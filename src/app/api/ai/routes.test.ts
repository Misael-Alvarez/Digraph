import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseDsl } from '@/lib/dsl';
import type { AiDiagram } from '@/lib/ai/schema';

/**
 * The routes are exercised through a stubbed `getClient`, the seam the client
 * module exists to provide. This does not verify the wire contract with the
 * Anthropic API — only a live key can do that — but it does cover everything
 * the routes themselves decide: validation, rate limiting, refusals, dropped
 * services and error mapping.
 */
const parseMock = vi.fn();
const streamMock = vi.fn();

vi.mock('@/lib/ai/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/client')>('@/lib/ai/client');
  return {
    ...actual,
    getClient: () =>
      clientEnabled ? { messages: { parse: parseMock, stream: streamMock } } : null,
  };
});

let clientEnabled = true;

const ANSWER: AiDiagram = {
  title: 'Serverless API',
  summary: 'A minimal request path.',
  cloud: 'aws',
  boundaries: [],
  nodes: [
    { id: 'api', service: 'aws-apigateway', label: '', note: '', boundary: '' },
    { id: 'fn', service: 'aws-lambda', label: '', note: '', boundary: '' },
  ],
  edges: [{ from: 'api', to: 'fn', label: 'invoke' }],
};

function reply(overrides: Record<string, unknown> = {}) {
  return {
    stop_reason: 'end_turn',
    stop_details: null,
    parsed_output: ANSWER,
    usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 900 },
    ...overrides,
  };
}

/** Each request gets a distinct session so the shared limiter never interferes. */
let session = 0;
function post(body: unknown) {
  return new Request('http://localhost/api/ai/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-studio-session': `test-${++session}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  clientEnabled = true;
  parseMock.mockReset();
  streamMock.mockReset();
});

describe('POST /api/ai/generate', () => {
  it('turns a prompt into a compiled diagram', async () => {
    parseMock.mockResolvedValue(reply());
    const { POST } = await import('./generate/route');

    const response = await POST(post({ operation: 'generate', prompt: 'A serverless API' }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.title).toBe('Serverless API');
    expect(body.summary).toBe('A minimal request path.');
    expect(body.model.shapes.filter((s: { type: string }) => s.type === 'group')).toHaveLength(2);
    expect(body.model.connectors).toHaveLength(1);
  });

  it('sends the catalogue as a cached system prompt', async () => {
    parseMock.mockResolvedValue(reply());
    const { POST } = await import('./generate/route');
    await POST(post({ prompt: 'A serverless API' }));

    const params = parseMock.mock.calls[0][0];
    expect(params.model).toBe('claude-opus-5');
    expect(params.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(params.system[0].text).toContain('aws-lambda');
    expect(params.thinking).toEqual({ type: 'adaptive' });
    expect(params.output_config.format).toBeDefined();
  });

  it('reports what it left out when the model names an unknown service', async () => {
    parseMock.mockResolvedValue(
      reply({
        parsed_output: {
          ...ANSWER,
          nodes: [
            ...ANSWER.nodes,
            { id: 'x', service: 'aws-imaginary', label: 'Imaginary', note: '', boundary: '' },
          ],
        },
      }),
    );
    const { POST } = await import('./generate/route');

    const body = await (await POST(post({ prompt: 'anything' }))).json();
    expect(body.dropped).toEqual(['aws-imaginary']);
    expect(body.model.shapes.filter((s: { type: string }) => s.type === 'group')).toHaveLength(2);
  });

  it('surfaces a refusal as its own status', async () => {
    parseMock.mockResolvedValue(
      reply({
        stop_reason: 'refusal',
        parsed_output: null,
        stop_details: { type: 'refusal', category: 'cyber' },
      }),
    );
    const { POST } = await import('./generate/route');

    const response = await POST(post({ prompt: 'something disallowed' }));
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe('refused');
  });

  it('reports an unusable answer rather than crashing', async () => {
    parseMock.mockResolvedValue(reply({ parsed_output: null }));
    const { POST } = await import('./generate/route');

    const response = await POST(post({ prompt: 'anything' }));
    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe('unparseable');
  });

  it('rejects a prompt that is too short or missing', async () => {
    const { POST } = await import('./generate/route');
    expect((await POST(post({ prompt: 'a' }))).status).toBe(400);
    expect((await POST(post({}))).status).toBe(400);
    expect(parseMock).not.toHaveBeenCalled();
  });

  it('answers 503 when no key is configured', async () => {
    clientEnabled = false;
    const { POST } = await import('./generate/route');

    const response = await POST(post({ prompt: 'A serverless API' }));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('not_configured');
  });

  it('includes the current diagram when modifying', async () => {
    parseMock.mockResolvedValue(reply());
    const { POST } = await import('./generate/route');
    const model = parseDsl('cloud: aws\nnodes:\n  fn: lambda\nedges: []\n').model!;

    await POST(post({ operation: 'modify', prompt: 'add a cache', model }));

    const userTurn = parseMock.mock.calls[0][0].messages[0].content as string;
    expect(userTurn).toContain('```yaml');
    expect(userTurn).toContain('lambda');
  });

  it('rate limits a caller that will not stop', async () => {
    parseMock.mockResolvedValue(reply());
    const { POST } = await import('./generate/route');
    const headers = { 'content-type': 'application/json', 'x-studio-session': 'greedy' };
    const request = () =>
      POST(
        new Request('http://localhost/api/ai/generate', {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: 'A serverless API' }),
        }),
      );

    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) statuses.push((await request()).status);

    expect(statuses.filter((s) => s === 200).length).toBeGreaterThan(0);
    expect(statuses).toContain(429);
  });

  it('maps an upstream failure onto a usable status', async () => {
    const { Anthropic } = await import('@/lib/ai/client');
    parseMock.mockRejectedValue(
      new Anthropic.AuthenticationError(401, undefined, 'bad key', new Headers()),
    );
    const { POST } = await import('./generate/route');

    const response = await POST(post({ prompt: 'A serverless API' }));
    expect(response.status).toBe(500);
    expect((await response.json()).code).toBe('bad_key');
  });
});

describe('POST /api/ai/explain', () => {
  const model = parseDsl('cloud: aws\nnodes:\n  fn: lambda\nedges: []\n').model!;

  function explainPost(body: unknown) {
    return new Request('http://localhost/api/ai/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-studio-session': `explain-${++session}` },
      body: JSON.stringify(body),
    });
  }

  it('streams the answer back as plain text', async () => {
    streamMock.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Looks ' } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'fine.' } };
      },
      finalMessage: async () => ({ stop_reason: 'end_turn' }),
      abort: () => undefined,
    });
    const { POST } = await import('./explain/route');

    const response = await POST(explainPost({ question: 'What is missing?', model }));
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toBe('Looks fine.');
  });

  it('refuses to review an empty canvas', async () => {
    const { POST } = await import('./explain/route');
    const empty = {
      schemaVersion: 1,
      canvas: { w: 10, h: 10 },
      shapes: [],
      connectors: [],
      showFooter: false,
    };

    const response = await POST(explainPost({ question: 'What is missing?', model: empty }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('empty_diagram');
  });

  it('rejects a malformed diagram', async () => {
    const { POST } = await import('./explain/route');
    const response = await POST(
      explainPost({ question: 'What is missing?', model: { nope: true } }),
    );
    expect(response.status).toBe(400);
  });

  it('tells the reader when the model declined', async () => {
    streamMock.mockReturnValue({
      async *[Symbol.asyncIterator]() {},
      finalMessage: async () => ({ stop_reason: 'refusal' }),
      abort: () => undefined,
    });
    const { POST } = await import('./explain/route');

    const text = await (await POST(explainPost({ question: 'Something', model }))).text();
    expect(text).toContain('declined');
  });
});
