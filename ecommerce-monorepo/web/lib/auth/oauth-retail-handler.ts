import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export interface OAuthRetailPayload {
  provider: 'google' | 'apple'
  providerId?: string
  email: string
  name: string
}

export interface OAuthRetailResult {
  id: string
  email: string
  name: string
  role: string
  userType: string
  verificationStatus: string
  isVerified: boolean
}

export async function createOrUpdateRetailUser(
  payload: OAuthRetailPayload
): Promise<OAuthRetailResult> {
  const email = payload.email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    // Defense in depth — the callback route already checks these,
    // but the helper must also enforce them.
    if (existing.role === 'ADMIN') {
      throw new Error('email_reserved')
    }
    if (existing.userType === 'WHOLESALE' || existing.userType === 'BOTH') {
      throw new Error('use_wholesale_login')
    }

    // Existing RETAIL user → log them in and update lastLoginAt
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        isVerified: true,
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

  // New retail user
  const randomPassword = crypto.randomBytes(24).toString('hex')
  const hashedPassword = await hashPassword(randomPassword)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: payload.name,
      role: 'USER', // forced
      userType: 'RETAIL', // forced
      verificationStatus: 'UNVERIFIED',
      isVerified: true, // Google verified the email
      isActive: true,
      lastLoginAt: new Date(),
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userType: user.userType,
    verificationStatus: user.verificationStatus,
    isVerified: user.isVerified,
  }
}
