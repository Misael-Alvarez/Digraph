import Anthropic from '@anthropic-ai/sdk';

/** The model this product is built against. */
export const AI_MODEL = 'claude-opus-5';

/** Non-streaming ceiling that stays comfortably inside the SDK's HTTP timeout. */
export const MAX_TOKENS = 16_000;

let cached: Anthropic | null = null;

/**
 * The Anthropic client, or null when no key is configured.
 *
 * Returning null rather than throwing lets the routes answer with a clear
 * "not configured" instead of a 500, so a deployment without a key degrades to
 * the AI features being unavailable rather than the app looking broken.
 */
export function getClient(): Anthropic | null {
  if (cached) return cached;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  cached = new Anthropic();
  return cached;
}

export { Anthropic };
