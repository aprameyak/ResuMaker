import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const publicRoutes = createRouteMatcher([
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
]);

// Define routes that should be completely ignored by Clerk's middleware
const ignoredRoutes = createRouteMatcher([
  "/api/health",
  "/api/webhooks(.*)"
]);

// Main Clerk middleware function
export default clerkMiddleware((auth, request) => {
  // If the route is explicitly ignored, do nothing
  if (ignoredRoutes(request)) {
    return;
  }

  // If the current request's path is NOT one of the defined public routes,
  // then protect it
  if (!publicRoutes(request)) {
    auth().protect();
  }
});

// Configure the matcher to specify which paths the middleware should run on
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // Match all routes except static files and Next.js internals
    "/",                          // Explicitly match the root
    "/(api|trpc)(.*)"             // Match all API and tRPC routes
  ]
}; 