import { LRUCache } from 'lru-cache';

// Create a cache for rate limiting
const cache = new LRUCache({
  max: 500, // Maximum number of entries
  ttl: 60 * 1000, // 1 minute TTL
});

const RATE_LIMIT_REQUESTS = parseInt(process.env.NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE || '10', 10);

export function rateLimit(identifier) {
  const key = `rate_limit_${identifier}`;
  const current = cache.get(key) || 0;
  
  if (current >= RATE_LIMIT_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetTime: Date.now() + 60 * 1000,
    };
  }
  
  cache.set(key, current + 1);
  
  return {
    success: true,
    remaining: RATE_LIMIT_REQUESTS - current - 1,
    resetTime: Date.now() + 60 * 1000,
  };
}

export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
} 