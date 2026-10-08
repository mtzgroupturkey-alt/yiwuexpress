export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendB2BApplicationReceivedEmail, sendAdminB2BNotificationEmail } from '@/lib/email';

const registerB2BSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  taxId: z.string().min(2, 'Tax ID is required'),
  businessType: z.string().min(2, 'Business type is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(2, 'Address is required'),
  contactName: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  notes: z.string().optional().default(''),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting: Max 5 applications per hour per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const limiter = await checkRateLimit(`register-b2b:${ip}`, {
      windowSeconds: 3600, // 1 hour
      maxRequests: 5,      // 5 applications per hour
    });

    if (!limiter.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: limiter.retryAfter 
        },
        { status: 429 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();

    const rawData = {
      companyName: (formData.get('companyName') as string) || '',
      taxId: (formData.get('taxId') as string) || '',
      businessType: (formData.get('businessType') as string) || 'wholesaler',
      country: (formData.get('country') as string) || '',
      city: (formData.get('city') as string) || '',
      address: (formData.get('address') as string) || '',
      contactName: (formData.get('contactName') as string) || '',
      email: (formData.get('email') as string) || '',
      phone: (formData.get('phone') as string) || '',
      password: (formData.get('password') as string) || '',
      notes: (formData.get('notes') as string) || '',
    };

    const licenseFile = (formData.get('licenseFile') || formData.get('businessLicense')) as File | null;

    // 3. Validate form fields with Zod
    const validated = registerB2BSchema.parse(rawData);

    // 4. Validate License File
    if (!licenseFile || !(licenseFile instanceof Blob) || licenseFile.size === 0) {
      return NextResponse.json(
        { error: 'Business license or incorporation document is required.' },
        { status: 400 }
      );
    }

    if (licenseFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit. Please upload a smaller document.' },
        { status: 400 }
      );
    }

    const originalName = licenseFile.name || 'license.pdf';
    const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: 'Only PDF, JPG, PNG, and WebP files are allowed.' },
        { status: 400 }
      );
    }

    // 5. Check Email Uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in or use another email.' },
        { status: 400 }
      );
    }

    // 6. Hash Password (12 salt rounds)
    const hashedPassword = await hashPassword(validated.password);

    // 7. Create User Record in Database
    // Note: Starts strictly as PENDING, isVerified = false, userType = WHOLESALE
    const user = await prisma.user.create({
      data: {
        email: validated.email.toLowerCase(),
        password: hashedPassword,
        name: validated.contactName,
        companyName: validated.companyName,
        businessType: validated.businessType,
        taxId: validated.taxId,
        country: `${validated.country}, ${validated.city}`,
        phone: validated.phone,
        role: 'USER',
        userType: 'WHOLESALE',
        verificationStatus: 'PENDING',
        verificationNotes: validated.notes ? `Applicant Notes: ${validated.notes}` : null,
        isVerified: false,
        isActive: true,
      },
    });

    // 8. File name sanitization & Disk Persistence
    const sanitizedName = `${user.id}_${Date.now()}.${extension}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'licenses');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, sanitizedName);
    const arrayBuffer = await licenseFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(filePath, buffer);

    // 9. Create VerificationDocument Record
    await prisma.verificationDocument.create({
      data: {
        userId: user.id,
        type: 'BUSINESS_LICENSE',
        fileName: sanitizedName,
        fileUrl: `/uploads/licenses/${sanitizedName}`,
        fileSize: licenseFile.size,
        status: 'PENDING',
        notes: `Submitted during B2B registration for ${validated.companyName}`,
      },
    });

    // 10. Record Admin Notification if model exists
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'New B2B Application Received',
          message: `${validated.companyName} (${validated.contactName}) applied for a wholesale account.`,
          type: 'SYSTEM',
        },
      });
    } catch (notifErr) {
      console.warn('[B2B Register] Notification record creation skipped:', notifErr);
    }

    // 11. Send Emails (Non-blocking background tasks)
    sendB2BApplicationReceivedEmail(user.email, {
      contactName: user.name,
      companyName: validated.companyName,
      taxId: validated.taxId,
    }).catch((err) => console.error('[B2B Register] Failed to send customer confirmation:', err));

    sendAdminB2BNotificationEmail({
      companyName: validated.companyName,
      contactName: user.name,
      email: user.email,
      phone: validated.phone,
      taxId: validated.taxId,
      country: validated.country,
      userId: user.id,
    }).catch((err) => console.error('[B2B Register] Failed to send admin alert:', err));

    // 12. Return Success response without session cookie (user is NOT logged in)
    return NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Your B2B application has been submitted and is currently under review.',
    });
  } catch (error: any) {
    console.error('[B2B Register API] Unexpected Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid form data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}
