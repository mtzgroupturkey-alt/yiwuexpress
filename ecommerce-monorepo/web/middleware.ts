import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge, getTokenFromRequest } from '@/lib/auth'
import * as jose from 'jose'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// next-intl middleware handles locale detection + redirect for localized paths.
const intlMiddleware = createIntlMiddleware(routing)

// Paths that must NOT be touched by locale routing (auth, RBAC, API, admin,
// static files) — these run the original security logic directly.
const BYPASS_PREFIXES = [
  '/api',
  '/admin',
  '/auth',
  '/dashboard',
  '/login',
  '/uploads',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/og-image.png',
  '/logo.svg',
  '/unregister-sw.js',
]

function isBypassPath(pathname: string): boolean {
  // Always bypass _next static files (critical for preventing MIME type errors)
  if (pathname.startsWith('/_next/')) {
    return true
  }
  
  if (BYPASS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return true
  }
  
  // static assets by extension (prevent login redirect for CSS/JS/images)
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|webmanifest|woff2?|ttf|otf|css|js|map)$/.test(pathname)) {
    return true
  }
  
  // dev/test routes kept at root (English, unlocalized)
  if (/^\/test-/.test(pathname)) {
    return true
  }
  
  return false
}

// Original security/auth/RBAC handler (preserved verbatim from prior version).
async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS for /uploads static files
  if (pathname.startsWith('/uploads')) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type')
    return response
  }

  // Skip middleware for public routes
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/products',
    '/about',
    '/contact',
    '/services',
    '/wholesale',
    '/calculator',
    '/track',
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
    '/api/products',
    '/api/categories',
    '/api/hero-slides',
    '/api/settings',
    '/api/currencies',
    '/api/countries',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
  ]

  // Check if path is locale-prefixed (e.g., /en/, /ru/, /zh/)
  const localePattern = /^\/(en|ru|zh)(\/|$)/
  const localeMatch = pathname.match(localePattern)
  
  // If it's a locale-prefixed route, check the route without the locale prefix
  let routeToCheck = pathname
  if (localeMatch) {
    // Remove locale prefix for checking against publicRoutes
    routeToCheck = pathname.replace(localeMatch[0], '/')
    // Normalize double slashes
    if (routeToCheck.startsWith('//')) {
      routeToCheck = routeToCheck.substring(1)
    }
  }

  const isPublicRoute = publicRoutes.some(route => 
    routeToCheck === route || routeToCheck.startsWith(route + '/') ||
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get token from cookie or Authorization header
  const token = getTokenFromRequest(request)

  // Protected routes require authentication
  const protectedPaths = [
    '/dashboard',
    '/admin',
    '/profile',
    '/orders',
    '/payment',
    '/wishlist',
    '/api/admin',
    '/api/orders',
    '/api/wishlist',
    '/api/cart',
    '/api/checkout',
    '/api/addresses',
    '/api/profile',
    '/api/payments',
  ]

  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )

  if (isProtectedPath) {
    if (!token) {
      // Redirect to login for page requests
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // Return 401 for API requests
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token (edge-compatible - simplified verification)
    let payload = null
    try {
      payload = await verifyTokenEdge(token)
    } catch (error) {
      // Fallback: Token verification failed, redirect to login
      if (!pathname.startsWith('/api/')) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth_token')
        return response
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    if (!payload) {
      // Invalid/expired token
      if (!pathname.startsWith('/api/')) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth_token')
        return response
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Role-based access control
    const userRole = payload.role as string

    // Admin-only routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (userRole !== 'ADMIN') {
        // Redirect to user's appropriate dashboard
        if (!pathname.startsWith('/api/')) {
          if (userRole === 'SUPPLIER') {
            return NextResponse.redirect(new URL('/dashboard/supplier', request.url))
          }
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    // Supplier-only routes
    if (pathname.startsWith('/dashboard/supplier')) {
      if (userRole !== 'SUPPLIER') {
        if (userRole === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Customer dashboard
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      // Don't allow supplier dashboard access
      if (!pathname.startsWith('/dashboard/supplier')) {
        if (userRole === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
        if (userRole === 'SUPPLIER') {
          return NextResponse.redirect(new URL('/dashboard/supplier', request.url))
        }
      }
    }

    // Add user info to request headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-role', userRole)
    return response
  }

  return NextResponse.next()
}

// Entry point: route bypass paths to the security handler, everything else
// (user-facing localized routes) through next-intl for locale detection/redirect.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The dashboard is unlocalized (bypasses next-intl). Redirect any
  // locale-prefixed variant (e.g. /ru/dashboard) to the canonical /dashboard
  // so localized users never hit a 404.
  const seg0 = pathname.split('/').filter(Boolean)[0]
  const seg0IsLocale = (routing.locales as readonly string[]).includes(seg0)
  if (seg0IsLocale && pathname.replace(`/${seg0}`, '').startsWith('/dashboard')) {
    // Preserve the chosen locale as ?locale= so the unlocalized dashboard
    // renders in the user's language instead of resetting to English.
    const target = new URL(pathname.replace(`/${seg0}`, ''), request.url)
    target.searchParams.set('locale', seg0)
    return NextResponse.redirect(target)
  }

  if (isBypassPath(pathname)) {
    return authMiddleware(request)
  }

  // For root path or paths that need locale routing, let next-intl handle it first
  // This ensures "/" redirects to "/en/" properly
  const response = intlMiddleware(request)
  
  // If next-intl redirected, return that redirect immediately
  if (response.status === 307 || response.status === 308) {
    return response
  }

  // For locale-prefixed routes, check auth after locale resolution
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const isLocale = (routing.locales as readonly string[]).includes(firstSegment)
  
  if (isLocale) {
    // This is a localized route (e.g., /en/something)
    // We need to check auth for protected routes
    const routeWithoutLocale = pathname.replace(`/${firstSegment}`, '') || '/'
    
    // Define protected paths that need auth
    const protectedPaths = [
      '/dashboard',
      '/admin', 
      '/profile',
      '/orders',
      '/payment',
      '/wishlist',
    ]
    
    const isProtectedPath = protectedPaths.some(path => 
      routeWithoutLocale === path || routeWithoutLocale.startsWith(path + '/')
    )
    
    if (isProtectedPath) {
      // Check authentication
      const token = getTokenFromRequest(request)
      if (!token) {
        const loginUrl = new URL(`/${firstSegment}/login`, request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // Verify token
      try {
        const payload = await verifyTokenEdge(token)
        if (!payload) {
          const loginUrl = new URL(`/${firstSegment}/login`, request.url)
          const redirectResponse = NextResponse.redirect(loginUrl)
          redirectResponse.cookies.delete('auth_token')
          return redirectResponse
        }
      } catch (error) {
        const loginUrl = new URL(`/${firstSegment}/login`, request.url)
        const redirectResponse = NextResponse.redirect(loginUrl)
        redirectResponse.cookies.delete('auth_token')
        return redirectResponse
      }
    }
  }

  // Expose the resolved locale to the root layout so it can set the correct
  // <html lang> attribute. Derive it from the (possibly rewritten) pathname.
  const locale = isLocale ? firstSegment : routing.defaultLocale
  response.headers.set('x-locale', locale)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets handled by the framework.
     * Locale routing + auth logic are composed in-code via isBypassPath().
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
