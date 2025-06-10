import { LRUCache } from 'lru-cache';

export interface RateLimitResult {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
}

export function rateLimit(options?: {
  uniqueTokenPerInterval?: number;
  interval?: number;
  limit?: number;
}) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (token: string): RateLimitResult => {
      const limit = options?.limit || 10;
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage >= limit;
      const reset = Date.now() + (options?.interval || 60000);

      if (!isRateLimited) {
        tokenCache.set(token, [currentUsage + 1]);
      }

      return {
        limit,
        remaining: isRateLimited ? 0 : limit - currentUsage - 1,
        reset,
        success: !isRateLimited,
      };
    },
  };
} 