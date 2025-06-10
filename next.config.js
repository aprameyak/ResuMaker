/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  env: {
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/',
  },
  images: {
    domains: ['fonts.gstatic.com', 'images.clerk.dev'],
    unoptimized: false,
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
  },
  optimizeFonts: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://clerk.com",
              "connect-src 'self' https://*.clerk.com https://clerk.com",
              "frame-src 'self' https://*.clerk.com https://clerk.com",
              "img-src 'self' data: https://*.clerk.com https://clerk.com",
              "style-src 'self' 'unsafe-inline'",
              "worker-src 'self' blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "manifest-src 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
}

module.exports = nextConfig 