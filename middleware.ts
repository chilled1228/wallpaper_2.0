import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Clone the request URL and headers for manipulation
  const url = request.nextUrl.clone()
  const response = NextResponse.next()
  
  // Check for Firebase ID token in cookies
  const authCookie = request.cookies.get('__session')
  const firebaseToken = request.cookies.get('firebaseToken')
  
  // Determine if user is authenticated
  const isAuthenticated = !!(authCookie || firebaseToken)
  
  // List of paths that require authentication
  const protectedPaths = ['/profile', '/dashboard', '/settings']
  const adminPaths = ['/admin']
  
  // Cache control for static assets
  if (
    request.nextUrl.pathname.includes('.') || // Files with extensions
    request.nextUrl.pathname.startsWith('/images/') ||
    request.nextUrl.pathname.startsWith('/static/')
  ) {
    // Set cache headers for static assets (1 week)
    response.headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400')
    return response
  }

  // Cache control for API routes that are cacheable
  if (
    request.nextUrl.pathname.startsWith('/api/') && 
    request.method === 'GET' && 
    !request.nextUrl.pathname.includes('/api/auth/')
  ) {
    // Default 5 minute cache for API GET requests that aren't auth related
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    return response
  }
  
  // Check if the requested path is protected or admin
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  const isAdminPath = adminPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // If it's a protected path and user is not authenticated
  if ((isProtectedPath || isAdminPath) && !isAuthenticated) {
    // Redirect to auth page with the original URL as redirect parameter
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If it's the auth page and user is authenticated
  if (request.nextUrl.pathname === '/auth' && isAuthenticated) {
    // Redirect to the original requested URL or home
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }
  
  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Prevent caching of HTML responses
  if (!request.nextUrl.pathname.includes('.')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth (auth APIs that handle tokens)
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. All static files (e.g. favicon.ico, sitemap.xml, robots.txt)
     */
    '/((?!_next|_static|_vercel|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
} 