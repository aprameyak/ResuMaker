/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  env: {
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  },
  images: {
    domains: [], // Add any image domains you need
    unoptimized: false,
  },
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig 