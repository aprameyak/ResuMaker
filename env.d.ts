declare namespace NodeJS {
  interface ProcessEnv {
    GOOGLE_AI_API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_APP_URL?: string;
    VERCEL_URL?: string;
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    NEXT_PUBLIC_CLERK_SIGN_IN_URL?: string;
    NEXT_PUBLIC_CLERK_SIGN_UP_URL?: string;
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?: string;
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?: string;
    KV_REST_API_URL?: string;
    KV_REST_API_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE?: string;
    NEXT_PUBLIC_MAX_CONTENT_LENGTH?: string;
  }
} 