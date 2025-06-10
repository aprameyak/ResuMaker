import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api(.*)",
    "/_next(.*)",
    "/fonts(.*)",
    "/images(.*)",
    "/favicon.ico",
    "/sitemap.xml",
    "/robots.txt"
  ],
  
  // Ignore specific routes completely
  ignoredRoutes: [
    "/api/parse-resume",
    "/api/analyze-content",
    "/api/generate",
    "/api/latex"
  ],

  debug: true // Enable debug mode to get more information about middleware failures
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 