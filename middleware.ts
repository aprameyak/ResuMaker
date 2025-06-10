import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/parse-resume",  // Public API endpoint
    "/_next(.*)",        // Next.js assets
    "/fonts(.*)",        // Font assets
    "/images(.*)",       // Image assets
    "/favicon.ico",      // Favicon
    "/sitemap.xml",      // SEO
    "/robots.txt"        // SEO
  ],
  
  // Ignore specific routes completely (no auth check)
  ignoredRoutes: [
    "/api/health",       // Health check endpoint
    "/api/webhooks(.*)"  // Webhook endpoints
  ],

  // Disable debug mode in production
  debug: process.env.NODE_ENV === "development"
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ]
}; 