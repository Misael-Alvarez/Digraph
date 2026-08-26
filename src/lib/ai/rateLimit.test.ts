import { describe, expect, it } from 'vitest';
import { RateLimiter, callerKey } from './rateLimit';

/** Controllable clock so the tests never sleep. */
function clock(start = 0) {
  let value = start;
  return { now: () => value, advance: (ms: number) => (value += ms) };
}

describe('RateLimiter', () => {
  it('allows a burst up to capacity', () => {
    const limiter = new RateLimiter({ capacity: 3, refillPerMinute: 3, now: clock().now });
    expect([1, 2, 3].map(() => limiter.take('a').allowed)).toEqual([true, true, true]);
    expect(limiter.take('a').allowed).toBe(false);
  });

  it('counts down the remaining allowance', () => {
    const limiter = new RateLimiter({ capacity: 3, refillPerMinute: 3, now: clock().now });
    expect(limiter.take('a').remaining).toBe(2);
    expect(limiter.take('a').remaining).toBe(1);
  });

  it('refills over time', () => {
    const time = clock();
    const limiter = new RateLimiter({ capacity: 2, refillPerMinute: 60, now: time.now });
    limiter.take('a');
    limiter.take('a');
    expect(limiter.take('a').allowed).toBe(false);

    time.advance(1000);
    expect(limiter.take('a').allowed).toBe(true);
  });

  it('never refills past capacity', () => {
    const time = clock();
    const limiter = new RateLimiter({ capacity: 2, refillPerMinute: 600, now: time.now });
    limiter.take('a');
    time.advance(60_000);
    expect([1, 2].map(() => limiter.take('a').allowed)).toEqual([true, true]);
    expect(limiter.take('a').allowed).toBe(false);
  });

  it('reports when to retry', () => {
    const time = clock();
    const limiter = new RateLimiter({ capacity: 1, refillPerMinute: 6, now: time.now });
    limiter.take('a');
    const denied = limiter.take('a');
    expect(denied.allowed).toBe(false);
    // Six per minute is one every ten seconds.
    expect(denied.retryAfter).toBe(10);
  });

  it('keeps callers independent', () => {
    const limiter = new RateLimiter({ capacity: 1, refillPerMinute: 1, now: clock().now });
    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('b').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(false);
  });

  it('prunes idle buckets so the map cannot grow forever', () => {
    const time = clock();
    const limiter = new RateLimiter({ capacity: 1, refillPerMinute: 60, now: time.now });
    limiter.take('a');
    limiter.take('b');
    expect(limiter.size).toBe(2);

    time.advance(31 * 60_000);
    limiter.prune();
    expect(limiter.size).toBe(0);
  });

  it('keeps recently used buckets when pruning', () => {
    const time = clock();
    const limiter = new RateLimiter({ capacity: 1, refillPerMinute: 60, now: time.now });
    limiter.take('a');
    time.advance(60_000);
    limiter.prune();
    expect(limiter.size).toBe(1);
  });
});

describe('callerKey', () => {
  it('uses the first forwarded address', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' });
    expect(callerKey(headers)).toBe('203.0.113.7:anon');
  });

  it('falls back to the real-ip header', () => {
    expect(callerKey(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4:anon');
  });

  it('separates sessions behind the same address', () => {
    const a = callerKey(new Headers({ 'x-real-ip': '1.2.3.4', 'x-studio-session': 'one' }));
    const b = callerKey(new Headers({ 'x-real-ip': '1.2.3.4', 'x-studio-session': 'two' }));
    expect(a).not.toBe(b);
  });

  it('still produces a key with no headers at all', () => {
    expect(callerKey(new Headers())).toBe('local:anon');
  });
});
