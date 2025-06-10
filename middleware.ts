// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define an array of routes that should be considered public.
// These routes will explicitly be accessible without authentication.
// This matches your 'publicRoutes' from the deprecated authMiddleware.
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

// Define an array of routes that should be completely ignored by Clerk's middleware.
// This means no authentication checks will occur for these routes.
// This matches your 'ignoredRoutes' from the deprecated authMiddleware.
const ignoredRoutes = createRouteMatcher([
    "/api/health",
    "/api/webhooks(.*)"
]);

// This is the main Clerk middleware function.
// `clerkMiddleware` by default makes all routes public.
// We apply conditional protection based on the 'publicRoutes' and 'ignoredRoutes'.
export default clerkMiddleware((auth, request) => {
  // If the route is explicitly ignored, do nothing and let the request proceed.
  if (ignoredRoutes(request)) {
    return; // Do not apply any auth logic to ignored routes
  }

  // If the current request's path is NOT one of the defined public routes,
  // then attempt to protect it. This effectively makes all non-public, non-ignored
  // routes protected. If a user is signed out, they will be redirected to the sign-in page.
  if (!publicRoutes(request)) {
    auth().protect();
  }

  // Debug mode can be dynamically enabled based on the environment.
  // This is a good practice for production deployments.
  // Note: 'debug' is an option for `clerkMiddleware` itself if you pass an object.
  // For dynamic debugging in a function, you'd typically use console logs or a logger.
  // The global 'debug' option for `authMiddleware` doesn't directly map here
  // as `clerkMiddleware` usually takes an async function.
  // If you need debugging, rely on `console.log` statements within this function
  // and check Vercel's runtime logs.
});

// Configure the matcher to specify which paths the middleware should run on.
// This matcher ensures the middleware runs for all routes except static files
// and Next.js internals, as well as all API routes.
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // Match all routes except static files and Next.js internals
    "/",                          // Explicitly match the root
    "/(api|trpc)(.*)"             // Match all API and tRPC routes
  ]
};