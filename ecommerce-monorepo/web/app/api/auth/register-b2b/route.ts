export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmailVerificationLink, sendAdminB2BNotificationEmail } from '@/lib/email';
import { verifyCaptcha } from '@/lib/captcha';

// Simplified Wholesale Registration Schema (Requirement #2)
const simplifiedRegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().min(5, 'Valid phone number is required').max(50),
  email: z.string().email('Invalid email address').toLowerCase(),
  country: z.string().min(2, 'Country is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
  captchaToken: z.string().optional().nullable(),
  locale: z.string().optional().default('en'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    // 1. IP-based rate limiting (Requirement #6: Max 10 registrations/hour/IP)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const limiter = await checkRateLimit(`register-b2b:${ip}`, {
      windowSeconds: 3600,
      maxRequests: 10,
    });

    if (!limiter.allowed) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: limiter.retryAfter,
        },
        { status: 429 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const validated = simplifiedRegisterSchema.parse(body);

    // 3. CAPTCHA verification (Requirement #4: Mandatory on email registration)
    const captchaResult = await verifyCaptcha(validated.captchaToken, request);
    if (!captchaResult.valid) {
      return NextResponse.json(
        { error: captchaResult.error || 'CAPTCHA verification failed. Please complete the security check.' },
        { status: 400 }
      );
    }

    // 4. Check if account already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      // If user was previously REJECTED, allow re-applying
      const canReapply =
        existingUser.userType === 'WHOLESALE' &&
        existingUser.verificationStatus === 'REJECTED';

      if (!canReapply) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in or use another email.' },
          { status: 400 }
        );
      }
    }

    // 5. Generate secure email verification token and hash password
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const hashedPassword = await hashPassword(validated.password);

    const fullName = `${validated.firstName.trim()} ${validated.lastName.trim()}`.trim();
    const locationString = `${validated.country.trim()}, ${validated.city.trim()}`;

    let user: any;

    if (existingUser) {
      // Update existing rejected user to fresh pending state
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: fullName,
          password: hashedPassword,
          phone: validated.phone.trim(),
          country: locationString,
          userType: 'WHOLESALE',
          // Email registration: MUST be verified via email link (Requirement #3)
          isVerified: false,
          verificationStatus: 'PENDING',
          resetToken: rawVerificationToken,
          resetTokenExpiry: tokenExpires,
          verificationNotes: 'Re-applied with updated credentials.',
          isActive: true,
        },
      });
    } else {
      // Create new Wholesale user
      user = await prisma.user.create({
        data: {
          email: validated.email,
          password: hashedPassword,
          name: fullName,
          phone: validated.phone.trim(),
          country: locationString,
          role: 'USER',
          userType: 'WHOLESALE',
          // Email registration: UNVERIFIED until email clicked (Requirement #3)
          isVerified: false,
          verificationStatus: 'PENDING',
          resetToken: rawVerificationToken,
          resetTokenExpiry: tokenExpires,
          isActive: true,
        },
      });
    }

    // 6. Build verification URL
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const targetLocale = validated.locale || 'en';
    const verificationUrl = `${appUrl}/${targetLocale}/verify-email?token=${rawVerificationToken}&email=${encodeURIComponent(user.email)}`;

    // 7. Dispatch Email Verification (Non-blocking)
    sendEmailVerificationLink({
      to: user.email,
      name: user.name,
      verificationUrl,
      locale: targetLocale,
    }).catch((err) => console.error('[B2B Register] Failed to send verification email:', err));

    // 8. Dispatch Admin Notification (Non-blocking)
    sendAdminB2BNotificationEmail({
      companyName: 'Wholesale Applicant (Pending Profile)',
      contactName: user.name,
      email: user.email,
      phone: user.phone || 'N/A',
      taxId: 'To be provided in profile',
      country: user.country || 'N/A',
      userId: user.id,
    }).catch((err) => console.error('[B2B Register] Failed to send admin alert:', err));

    return NextResponse.json({
      success: true,
      requiresEmailVerification: true,
      message: 'Account registered successfully. Please check your email to verify your address.',
      email: user.email,
    });
  } catch (error: any) {
    console.error('[register-b2b POST error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid form input' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
