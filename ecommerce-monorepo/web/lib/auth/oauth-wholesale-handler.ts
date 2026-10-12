import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendAdminB2BNotificationEmail } from '@/lib/email'

export interface OAuthWholesalePayload {
  provider: 'google' | 'apple'
  providerId?: string
  email: string
  name: string
  phone?: string | null
  country?: string | null
  city?: string | null
}

export interface OAuthWholesaleResult {
  id: string
  email: string
  name: string
  role: string
  userType: string
  verificationStatus: string
  isVerified: boolean
}

export async function createOrUpdateWholesaleUser(
  payload: OAuthWholesalePayload
): Promise<OAuthWholesaleResult> {
  const email = payload.email.toLowerCase().trim()

  // 1. Check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    // Existing wholesale user: preserve current verificationStatus, ensure verified email and updated login timestamp
    const locationString = payload.country
      ? `${payload.country}${payload.city ? `, ${payload.city}` : ''}`
      : existingUser.country

    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: 'USER',
        userType: existingUser.userType === 'BOTH' ? 'BOTH' : 'WHOLESALE',
        isVerified: true,
        phone: payload.phone || existingUser.phone,
        country: locationString,
        lastLoginAt: new Date(),
      },
    })

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      userType: updated.userType,
      verificationStatus: updated.verificationStatus,
      isVerified: updated.isVerified,
    }
  }

  // 2. Create new user
  const randomPassword = crypto.randomBytes(24).toString('hex')
  const hashedPassword = await hashPassword(randomPassword)

  const locationString = payload.country
    ? `${payload.country}${payload.city ? `, ${payload.city}` : ''}`
    : null

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: payload.name,
      phone: payload.phone || null,
      country: locationString,
      role: 'USER',
      userType: 'WHOLESALE',
      isVerified: true,
      verificationStatus: 'PENDING',
      verifiedAt: null,
      isActive: true,
      lastLoginAt: new Date(),
    },
  })

  // Notify admin of new wholesale applicant (non-blocking)
  sendAdminB2BNotificationEmail({
    companyName: `Wholesale Applicant via ${payload.provider.toUpperCase()}`,
    contactName: newUser.name,
    email: newUser.email,
    phone: newUser.phone || 'N/A',
    taxId: 'To be completed in profile',
    country: newUser.country || 'N/A',
    userId: newUser.id,
  }).catch((err) => console.error('[oauth-wholesale] Admin alert error:', err))

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    userType: newUser.userType,
    verificationStatus: newUser.verificationStatus,
    isVerified: newUser.isVerified,
  }
}
