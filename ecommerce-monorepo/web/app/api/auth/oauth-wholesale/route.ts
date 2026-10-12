export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createOrUpdateWholesaleUser } from '@/lib/auth/oauth-wholesale-handler';

const oauthWholesaleSchema = z.object({
  provider: z.enum(['google', 'apple']),
  email: z.string().email('Valid email is required').toLowerCase(),
  name: z.string().min(1, 'Name is required').max(150),
  providerId: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * POST /api/auth/oauth-wholesale
 * Handles Google & Apple Sign-In / Registration for Wholesale buyers.
 *
 * Rules:
 * - If user signs in with Google or Apple, Email is already verified by provider.
 * - Set `isVerified = true` immediately.
 * - Set `userType = WHOLESALE`.
 * - If new wholesale user, set `verificationStatus = PENDING` (Admin approval needed).
 * - No CAPTCHA required for Google/Apple Sign-In.
 * - Issue auth session cookie immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const limiter = await checkRateLimit(`oauth-wholesale:${ip}`, {
      windowSeconds: 3600,
      maxRequests: 30,
    });

    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = oauthWholesaleSchema.parse(body);

    const user = await createOrUpdateWholesaleUser({
      provider: validated.provider,
      providerId: validated.providerId,
      email: validated.email,
      name: validated.name,
      phone: validated.phone,
      country: validated.country,
      city: validated.city,
    });

    // Generate JWT and log user in
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
      },
      message: `Signed in successfully via ${validated.provider === 'google' ? 'Google' : 'Apple'}.`,
    });

    setAuthCookie(response, token);

    return response;
  } catch (error: any) {
    console.error('[oauth-wholesale POST error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid OAuth payload' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'OAuth authentication failed.' },
      { status: 500 }
    );
  }
}
