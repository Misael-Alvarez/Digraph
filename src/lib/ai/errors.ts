import { Anthropic } from './client';

export interface ApiFailure {
  status: number;
  code: string;
  message: string;
  retryAfter?: number;
}

/**
 * Maps an SDK error onto a response the UI can act on.
 *
 * Uses the SDK's typed classes, checked most specific first, so the client can
 * tell "try again in a minute" apart from "this will never work".
 */
export function describeError(error: unknown): ApiFailure {
  if (error instanceof Anthropic.AuthenticationError) {
    return { status: 500, code: 'bad_key', message: 'The configured API key was rejected.' };
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return { status: 500, code: 'no_permission', message: 'The API key lacks access to this model.' };
  }
  if (error instanceof Anthropic.RateLimitError) {
    const retryAfter = Number(error.headers?.get?.('retry-after') ?? 30);
    return {
      status: 429,
      code: 'upstream_rate_limit',
      message: 'The model is busy. Try again shortly.',
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : 30,
    };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { status: 400, code: 'bad_request', message: error.message };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { status: 503, code: 'unreachable', message: 'Could not reach the model.' };
  }
  if (error instanceof Anthropic.APIError) {
    return {
      status: error.status && error.status >= 500 ? 502 : 400,
      code: 'api_error',
      message: error.message,
    };
  }
  return { status: 500, code: 'unknown', message: 'Something went wrong generating the diagram.' };
}
