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
    "/_next/static/(.*)",
    "/favicon.ico",
  ],
  
  // Routes that can be accessed by anyone, but will still have session information if logged in
  ignoredRoutes: [
    "/api/parse-resume",
    "/api/analyze-content",
    "/api/generate",
    "/api/latex",
  ],
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}; 