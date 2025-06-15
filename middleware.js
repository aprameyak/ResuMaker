import { NextResponse } from 'next/server';

export async function middleware(req) {
  // Protected routes that require authentication
  const protectedPaths = ['/create', '/upload', '/tailor'];
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // For now, allow all requests to pass through
  // Authentication will be handled client-side by the AuthContext
  if (isProtectedPath) {
    // Just pass through - let the client-side auth handle redirects
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 