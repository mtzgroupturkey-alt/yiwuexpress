import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateWholesaleUser } from '@/lib/auth/oauth-wholesale-handler'
import { createOrUpdateRetailUser } from '@/lib/auth/oauth-retail-handler'
import { getDashboardForUser } from '@/lib/auth/dashboard-router'
import { generateToken, setAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/en/register-b2b?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/en/register-b2b?error=missing_code`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${origin}/api/auth/callback/google`

  if (!clientId || !clientSecret) {
    console.error('[OAuth Google] Missing env vars: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
    return NextResponse.redirect(`${origin}/en/register-b2b?error=server_config`)
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('[OAuth Google] Token exchange failed:', errText)
      return NextResponse.redirect(`${origin}/en/register-b2b?error=token_exchange`)
    }

    const tokens = await tokenRes.json()
    const accessToken = tokens.access_token as string

    // 2. Fetch user info
    const userRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!userRes.ok) {
      console.error('[OAuth Google] userinfo failed')
      return NextResponse.redirect(`${origin}/en/register-b2b?error=userinfo`)
    }

    const googleUser = await userRes.json()

    if (!googleUser.email) {
      return NextResponse.redirect(`${origin}/en/register-b2b?error=no_email`)
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
    return response
  } catch (err) {
    console.error('[OAuth Google] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/en/register-b2b?error=unexpected`)
  }
}
