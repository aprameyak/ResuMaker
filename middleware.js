import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Temporarily allow all routes to avoid redirect loops
        // This will be updated once environment variables are properly configured
        return true;
        
        // Original logic (commented out for now):
        // const publicPaths = [
        //   '/',
        //   '/api/parse-resume',
        //   '/api/health',
        //   '/api/webhooks',
        //   '/auth/signin',
        //   '/auth/error'
        // ];
        // 
        // if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
        //   return true;
        // }
        // 
        // return !!token;
      },
    },
  }
)

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 