import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook",
  ],
  
  // Routes that can be accessed by anyone, but will still have session information if logged in
  ignoredRoutes: [
    "/api/parse-resume",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 