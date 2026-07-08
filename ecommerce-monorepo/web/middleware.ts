import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge, getTokenFromRequest } from '@/lib/auth'
import * as jose from 'jose'

export async function middleware(request: NextRequest) {
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

  const isPublicRoute = publicRoutes.some(route => 
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
    '/api/auth/me',
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

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
