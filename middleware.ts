import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Explicitly export a 'runtime' variable to force the Node.js runtime.
// This is required because auth logic (which is imported here)
// uses Mongoose, which is not compatible with the default Edge runtime.
export const runtime = 'nodejs';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth; // The session is now attached to the request

  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'admin';
  const pathname = nextUrl.pathname;

  // --- Admin Route Protection ---
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // --- Authenticated User Route Protection ---
  if ((pathname.startsWith('/account') || pathname.startsWith('/order')) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // If none of the above conditions are met, allow the request to proceed
  return NextResponse.next();
});

// This config specifies which paths the middleware should run on.
export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/order/:path*',
  ],
};