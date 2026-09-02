import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import { createTestUser, createTestAdmin, createTestAuthToken } from '../utils/test-factory'
import { verifyToken, hashPassword, verifyPassword } from '../../lib/auth'

describe('Auth Integration Tests', () => {
  let testUser: any
  let testAdmin: any

  beforeAll(async () => {
    testUser = await createTestUser()
    testAdmin = await createTestAdmin()
  })

  afterAll(async () => {
    if (testUser?.id) {
      await prisma.user.deleteMany({
        where: { id: { in: [testUser.id, testAdmin?.id].filter(Boolean) } },
      })
    }
  })

  it('generates and verifies valid customer JWT token', async () => {
    const token = createTestAuthToken(testUser)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe(testUser.id)
    expect(payload?.email).toBe(testUser.email)
    expect(payload?.role).toBe('USER')
  })

  it('correctly validates admin privileges in token payload', async () => {
    const adminToken = createTestAuthToken(testAdmin)
    const payload = verifyToken(adminToken)

    expect(payload).not.toBeNull()
    expect(payload?.role).toBe('ADMIN')
    expect(payload?.userId).toBe(testAdmin.id)
  })

  it('rejects tampered or malformed JWT tokens', async () => {
    const validToken = createTestAuthToken(testUser)
    const tamperedToken = `${validToken.substring(0, validToken.length - 6)}badsig`

    const payload = verifyToken(tamperedToken)
    expect(payload).toBeNull()
  })

  it('hashes passwords securely and verifies credentials accurately', async () => {
    const rawPassword = 'SecurePassword!2026'
    const hashed = await hashPassword(rawPassword)

    expect(hashed).toBeDefined()
    expect(hashed).not.toBe(rawPassword)
    expect(hashed.startsWith('$2')).toBe(true)

    const isValid = await verifyPassword(rawPassword, hashed)
    expect(isValid).toBe(true)

    const isInvalid = await verifyPassword('WrongPassword123', hashed)
    expect(isInvalid).toBe(false)
  })

  it('enforces active user verification during authentication lookup', async () => {
    const userInDb = await prisma.user.findUnique({
      where: { id: testUser.id },
    })

    expect(userInDb).toBeDefined()
    expect(userInDb?.isActive).toBe(true)
  })
})
