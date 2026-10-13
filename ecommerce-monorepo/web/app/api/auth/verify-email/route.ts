export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateToken, setAuthCookie } from '@/lib/auth';

/**
 * GET /api/auth/verify-email?token=xyz&email=abc@example.com
 * Verifies email verification token. When valid:
 * - Marks isVerified = true
 * - Clears resetToken & resetTokenExpiry
 * - Leaves verificationStatus = PENDING (so admin can review & approve wholesale access)
 * - Sets auth cookie so user is logged in
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: 'Verification token and email are required.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Account not found.' },
        { status: 404 }
      );
    }

    // Already verified
    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'Your email address is already verified.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          verificationStatus: user.verificationStatus,
        },
      });
    }

    // Check token match & expiry
    if (user.resetToken !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link.' },
        { status: 400 }
      );
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark email as verified, clear token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Auto-login verified user with JWT cookie
    const authToken = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    const isRetail = updatedUser.userType === 'RETAIL';
    const message = isRetail
      ? 'Email successfully verified! Your account is now active.'
      : 'Email successfully verified! Your wholesale account is under compliance review.';

    const response = NextResponse.json({
      success: true,
      message,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        userType: updatedUser.userType,
        verificationStatus: updatedUser.verificationStatus,
      },
    });

    setAuthCookie(response, authToken);

    return response;
  } catch (error: any) {
    console.error('[verify-email API error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
