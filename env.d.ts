declare namespace NodeJS {
  interface ProcessEnv {
    GOOGLE_AI_API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_APP_URL?: string;
    VERCEL_URL?: string;
  }
} 