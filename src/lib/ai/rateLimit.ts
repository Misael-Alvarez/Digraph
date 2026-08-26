/**
 * Token-bucket rate limiter.
 *
 * In-memory, so it is per-process: it resets on deploy and does not span
 * instances. That is deliberate for now — it exists so a single visitor cannot
 * run up a bill on an unauthenticated endpoint, not as a billing control. When
 * the app moves to AWS this moves to a shared store alongside real accounts.
 */
export interface RateLimitOptions {
  /** Requests allowed in a burst. */
  capacity: number;
  /** Tokens replenished per minute. */
  refillPerMinute: number;
  /** Injectable for tests. */
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the next token, for the Retry-After header. */
  retryAfter: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private readonly now: () => number;

  constructor({ capacity, refillPerMinute, now = Date.now }: RateLimitOptions) {
    this.capacity = capacity;
    this.refillPerMs = refillPerMinute / 60_000;
    this.now = now;
  }

  take(key: string): RateLimitResult {
    const timestamp = this.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: timestamp };

    const refilled = Math.min(
      this.capacity,
      bucket.tokens + (timestamp - bucket.updatedAt) * this.refillPerMs,
    );

    if (refilled < 1) {
      this.buckets.set(key, { tokens: refilled, updatedAt: timestamp });
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((1 - refilled) / this.refillPerMs / 1000),
      };
    }

    const tokens = refilled - 1;
    this.buckets.set(key, { tokens, updatedAt: timestamp });
    return { allowed: true, remaining: Math.floor(tokens), retryAfter: 0 };
  }

  /** Drops buckets that have been full and idle, so the map cannot grow forever. */
  prune(maxIdleMs = 30 * 60_000): void {
    const timestamp = this.now();
    for (const [key, bucket] of this.buckets) {
      if (timestamp - bucket.updatedAt > maxIdleMs) this.buckets.delete(key);
    }
  }

  get size(): number {
    return this.buckets.size;
  }
}

/** Identifies the caller as well as an unauthenticated endpoint can. */
export function callerKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const session = headers.get('x-studio-session');
  return `${forwarded || headers.get('x-real-ip') || 'local'}:${session ?? 'anon'}`;
}
