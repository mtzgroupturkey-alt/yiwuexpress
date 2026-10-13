import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateWholesaleUser } from '@/lib/auth/oauth-wholesale-handler'
import { createOrUpdateRetailUser } from '@/lib/auth/oauth-retail-handler'
import { getDashboardForUser } from '@/lib/auth/dashboard-router'
import { generateToken, setAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state') || 'wholesale'

  // Resolve public origin properly behind reverse proxy (Nginx)
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  let origin = 'https://www.dromkok.com'
  if (forwardedHost && !forwardedHost.includes('0.0.0.0')) {
    origin = `${forwardedProto}://${forwardedHost}`
  } else if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('0.0.0.0')) {
    origin = process.env.NEXT_PUBLIC_API_URL
  }

  const isRetailFlow = state === 'retail' || state === 'retail-login'
  const errorBase = isRetailFlow ? `${origin}/en/login` : `${origin}/en/register-b2b`

  if (error) {
    return NextResponse.redirect(`${errorBase}?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${errorBase}?error=missing_code`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${origin}/api/auth/callback/google`

  if (!clientId || !clientSecret) {
    console.error('[OAuth Google] Missing env vars: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
    return NextResponse.redirect(`${errorBase}?error=server_config`)
  }

  // Support proxy for servers behind Great Firewall (e.g., in Mainland China)
  const proxyBase = process.env.GOOGLE_OAUTH_PROXY_URL?.replace(/\/+$/, '') || ''
  let tokenEndpoint = 'https://oauth2.googleapis.com/token'
  let userinfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo'

  if (proxyBase) {
    if (proxyBase.includes('.php')) {
      const sep = proxyBase.includes('?') ? '&' : '?'
      tokenEndpoint = `${proxyBase}${sep}action=token`
      userinfoEndpoint = `${proxyBase}${sep}action=userinfo`
    } else {
      tokenEndpoint = `${proxyBase}/token`
      userinfoEndpoint = `${proxyBase}/userinfo`
    }
  }

  // Helper to force IPv4 and prevent Linux IPv6 routing timeouts
  async function fetchIPv4(urlStr: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
    const https = await import('https')
    const http = await import('http')
    const url = new URL(urlStr)
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http

    return new Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<any> }>((resolve, reject) => {
      const req = client.request(
        url,
        {
          method: options.method || 'GET',
          headers: options.headers || {},
          family: 4, // FORCE IPv4 to avoid broken IPv6 routes on server
          timeout: 20000,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            resolve({
              ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
              status: res.statusCode || 500,
              text: async () => data,
              json: async () => JSON.parse(data),
            })
          })
        }
      )

      req.on('timeout', () => {
        req.destroy(new Error('Connection timed out after 20s'))
      })

      req.on('error', (err) => {
        reject(err)
      })

      if (options.body) {
        req.write(options.body)
      }
      req.end()
    })
  }

  try {
    // 1. Exchange code for tokens
    const postBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString()

    const tokenRes = await fetchIPv4(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postBody).toString(),
      },
      body: postBody,
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('[OAuth Google] Token exchange failed:', errText)
      return NextResponse.redirect(`${errorBase}?error=token_exchange`)
    }

    const tokens = await tokenRes.json()
    const accessToken = tokens.access_token as string

    // 2. Fetch user info
    const userRes = await fetchIPv4(userinfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userRes.ok) {
      console.error('[OAuth Google] userinfo failed')
      return NextResponse.redirect(`${errorBase}?error=userinfo`)
    }

    const googleUser = await userRes.json()

    if (!googleUser.email) {
      return NextResponse.redirect(`${errorBase}?error=no_email`)
    }

    const email = googleUser.email.toLowerCase().trim()
    const state = searchParams.get('state') || 'wholesale'
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, userType: true, verificationStatus: true },
    })

    // ---- BRANCH BY STATE ----

    if (state === 'retail' || state === 'retail-login') {
      // RETAIL FLOW

      // Reject ADMIN
      if (existingUser?.role === 'ADMIN') {
        console.error('[OAuth Google] Rejected: email belongs to ADMIN (retail flow)')
        return NextResponse.redirect(`${origin}/en/login?error=email_reserved`)
      }

      // Reject WHOLESALE / BOTH — they must use the wholesale login
      if (
        existingUser?.userType === 'WHOLESALE' ||
        existingUser?.userType === 'BOTH'
      ) {
        console.error('[OAuth Google] Rejected: email is WHOLESALE (retail flow)')
        return NextResponse.redirect(`${origin}/en/login?error=use_wholesale_login`)
      }

      // Create or update retail user
      let user
      try {
        user = await createOrUpdateRetailUser({
          provider: 'google',
          providerId: googleUser.id,
          email,
          name:
            googleUser.name ||
            `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim() ||
            googleUser.email.split('@')[0],
        })
      } catch (err: any) {
        const errorCode =
          err.message === 'email_reserved'
            ? 'email_reserved'
            : err.message === 'use_wholesale_login'
            ? 'use_wholesale_login'
            : 'oauth_failed'
        return NextResponse.redirect(`${origin}/en/login?error=${errorCode}`)
      }

      // Issue session
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      // Redirect via helper
      const target = getDashboardForUser(user, 'en')
      const response = NextResponse.redirect(`${origin}${target}`)
      setAuthCookie(response, token)
      return response
    }

    // ---- WHOLESALE FLOW (default, backwards compatible) ----

    // Reject ADMIN
    if (existingUser?.role === 'ADMIN') {
      console.error('[OAuth Google] Rejected: email belongs to ADMIN (wholesale flow)')
      return NextResponse.redirect(`${origin}/en/register-b2b?error=email_reserved`)
    }

    // Reject pure RETAIL
    if (existingUser?.userType === 'RETAIL') {
      console.error('[OAuth Google] Rejected: email is RETAIL (wholesale flow)')
      return NextResponse.redirect(`${origin}/en/register-b2b?error=email_exists`)
    }

    // Create or update wholesale user
    let user
    try {
      user = await createOrUpdateWholesaleUser({
        provider: 'google',
        providerId: googleUser.id,
        email,
        name:
          googleUser.name ||
          `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim() ||
          googleUser.email.split('@')[0],
        phone: null,
        country: null,
        city: null,
      })
    } catch (err: any) {
      console.error('[OAuth Google] Wholesale handler failed:', err)
      return NextResponse.redirect(`${origin}/en/register-b2b?error=oauth_failed`)
    }

    // Issue session
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Redirect via helper
    const target = getDashboardForUser(user, 'en')
    const response = NextResponse.redirect(`${origin}${target}`)
    setAuthCookie(response, token)
  } catch (err: any) {
    console.error('[OAuth Google] Unexpected error:', err)
    const errDetail = err?.cause ? `${err.message} (${err.cause?.code || err.cause?.message || ''})` : (err?.message || 'unexpected')
    const errMessage = encodeURIComponent(errDetail)
    return NextResponse.redirect(`${origin}/en/register-b2b?error=unexpected&detail=${errMessage}`)
  }
}
