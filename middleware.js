import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicPaths = [
          '/',
          '/api/parse-resume',
          '/api/health',
          '/api/webhooks',
          '/auth/signin',
          '/auth/error'
        ];
        
        if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
          return true;
        }
        
        // Require authentication for protected routes
        return !!token;
      },
    },
  }
)

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 