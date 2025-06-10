import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook",
    "/api/parse-resume",
    "/api/analyze-content",
    "/api/generate",
    "/api/latex",
    "/sitemap.xml",
    "/robots.txt",
    "/favicon.ico",
    "/_next/static/(.*)",
    "/_next/image(.*)",
    "/images/(.*)",
    "/fonts/(.*)",
  ],
  
  // Routes that can be accessed by anyone, but will still have session information if logged in
  ignoredRoutes: [
    "/api/parse-resume",
    "/api/analyze-content",
    "/api/generate",
    "/api/latex",
  ],
});

// Matcher configuration for Next.js middleware
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|images|fonts).*)",
    "/(api|trpc)(.*)",
  ],
}; 