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
  private redis: Redis | typeof kv | null = null;
  private interval: number;
  private uniqueTokenPerInterval: number;

  constructor(config: RateLimitConfig) {
    this.interval = config.interval;
    this.uniqueTokenPerInterval = config.uniqueTokenPerInterval;

    // Use Vercel KV if available, otherwise try Upstash Redis
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      this.redis = kv;
    } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    // If neither is configured, redis will remain null and rate limiting will be disabled
  }

  async check(limit: number, identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    
    // If Redis is not configured, allow all requests
    if (!this.redis) {
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Math.ceil((now + this.interval) / 1000),
      };
    }

    const key = `rate-limit:${identifier}`;
    const windowStart = now - this.interval;

    try {
      // Clean up old requests
      await this.redis.zremrangebyscore(key, 0, windowStart);
      
      // Add new request with score and member
      await this.redis.zadd(key, {
        score: now,
        member: now.toString(),
      });
      
      // Get current count
      const requestCount = await this.redis.zcard(key);
      
      // Set expiry
      await this.redis.expire(key, Math.ceil(this.interval / 1000));

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