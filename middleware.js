import { authMiddleware } from "@clerk/nextjs/server";

// Main Clerk middleware function
export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/parse-resume",
    "/_next(.*)",
    "/fonts(.*)",
    "/images(.*)",
    "/favicon.ico",
    "/sitemap.xml",
    "/robots.txt"
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    "/api/health",
    "/api/webhooks(.*)"
  ],
});

// Configure the matcher to specify which paths the middleware should run on
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 