import { auth } from '@/auth'; 
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth; // The session is now attached to the request

  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'admin';
  const pathname = nextUrl.pathname;

  // --- Admin Route Protection ---
  // If the user tries to access any /admin path and is not an admin
  if (pathname.startsWith('/admin') && !isAdmin) {
    // Redirect them to the homepage or an "unauthorized" page
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // --- Authenticated User Route Protection ---
  // If the user tries to access /account or /order and is not logged in
  if ((pathname.startsWith('/account') || pathname.startsWith('/order')) && !isLoggedIn) {
    // Redirect them to the sign-in page, and after they log in,
    // send them back to the page they were trying to access.
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // If none of the above conditions are met, allow the request to proceed
  return NextResponse.next();
});

// This config specifies which paths the middleware should run on.
// This is an optimization to avoid running middleware on every request.
export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/order/:path*',
    // Add other protected routes here if needed
  ],
};