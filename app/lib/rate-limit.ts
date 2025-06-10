import { Redis } from '@upstash/redis';
import { kv } from '@vercel/kv';

interface RateLimitConfig {
  interval: number;  // in seconds
  limit: number;     // max requests per interval
}

export class RateLimit {
  private redis: Redis | typeof kv;
  private interval: number;
  private limit: number;

  constructor(config: RateLimitConfig) {
    // Use Vercel KV if available, otherwise use Upstash Redis
    this.redis = process.env.KV_REST_API_URL ? kv : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    this.interval = config.interval;
    this.limit = config.limit;
  }

  async isRateLimited(identifier: string): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - (this.interval * 1000);

    try {
      // Get current requests count
      const requestCount = await this.redis.get<number>(key) || 0;

      if (requestCount >= this.limit) {
        return true;
      }

      // Increment request count
      await this.redis.set(key, requestCount + 1, {
        ex: this.interval // Set expiration in seconds
      });

      return false;
    } catch (error) {
      console.error('Rate limit error:', error);
      // In case of Redis error, allow the request
      return false;
    }
  }
} 