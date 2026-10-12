import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateWholesaleUser } from '@/lib/auth/oauth-wholesale-handler'
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

    const email = googleUser.email.toLowerCase()

    // 1. Check if this email already exists in the system
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, userType: true, verificationStatus: true },
    })

    // 2. Reject ADMIN emails — never allow OAuth to touch admin accounts
    if (existingUser?.role === 'ADMIN') {
      console.error(
        `[OAuth Google] Rejected: email ${email} belongs to an ADMIN account`
      )
      return NextResponse.redirect(
        `${origin}/en/register-b2b?error=email_reserved`
      )
    }

    // 3. Reject pure RETAIL users — they must use the retail login flow
    if (existingUser?.userType === 'RETAIL') {
      console.error(
        `[OAuth Google] Rejected: email ${email} is a RETAIL user`
      )
      return NextResponse.redirect(
        `${origin}/en/register-b2b?error=email_exists`
      )
    }

    // 4. Create/update user via shared helper
    const user = await createOrUpdateWholesaleUser({
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

    // 4. Issue session and redirect to dashboard
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.redirect(`${origin}/en/business/dashboard`)
    setAuthCookie(response, token)
    return response
  } catch (err) {
    console.error('[OAuth Google] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/en/register-b2b?error=unexpected`)
  }
}
