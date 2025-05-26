import { Redis } from '@upstash/redis';
import { kv } from '@vercel/kv';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Maximum number of unique tokens per interval
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private redis: Redis | typeof kv;
  private interval: number;
  private uniqueTokenPerInterval: number;

  constructor(config: RateLimitConfig) {
    this.interval = config.interval;
    this.uniqueTokenPerInterval = config.uniqueTokenPerInterval;

    // Use Vercel KV if available, otherwise create Redis client
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      this.redis = kv;
    } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      throw new Error('No Redis configuration found. Please set up either Vercel KV or Upstash Redis.');
    }
  }

  async check(limit: number, identifier: string): Promise<RateLimitResult> {
    const key = `rate-limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.interval;

    try {
      // Clean up old requests and add new request
      const pipeline = this.redis.multi();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, { score: now, member: now.toString() });
      pipeline.zcard(key);
      pipeline.expire(key, Math.ceil(this.interval / 1000));

      // Execute pipeline
      const results = await pipeline.exec();
      const requestCount = results ? results[2] as number : 0;

      const success = requestCount <= limit;
      const reset = Math.ceil((windowStart + this.interval) / 1000);

      return {
        success,
        limit,
        remaining: Math.max(0, limit - requestCount),
        reset,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Math.ceil((now + this.interval) / 1000),
      };
    }
  }
}

export function rateLimit(config: RateLimitConfig) {
  return new RateLimiter(config);
} 