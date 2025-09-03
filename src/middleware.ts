import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getCSPHeaders } from '@/lib/csp';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers
  const securityHeaders = getCSPHeaders();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Handle API routes authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip auth for public API routes (auth endpoints, webhooks, etc.)
    const publicRoutes = ['/api/auth', '/api/webhooks'];
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );

    if (!isPublicRoute) {
      try {
        const token = await getToken({ 
          req: request, 
          secret: process.env.NEXTAUTH_SECRET
        });

        if (!token?.email) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Add user info to headers for downstream use
        response.headers.set('X-User-Email', token.email);
        response.headers.set('X-User-ID', token.sub || '');
        if (token.name) response.headers.set('X-User-Name', token.name);
        if (token.picture) response.headers.set('X-User-Picture', token.picture);

      } catch (error) {
        console.error('Middleware auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all pages except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
