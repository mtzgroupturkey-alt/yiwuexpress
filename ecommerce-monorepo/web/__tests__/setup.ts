import { beforeAll, afterAll, afterEach } from 'vitest'
import { prisma } from '../lib/db'

beforeAll(async () => {
  // Verify database connection before tests start
  try {
    await prisma.$connect()
  } catch (error) {
    console.error('Failed to connect to test database:', error)
  }
})

afterEach(async () => {
  // Optional per-test cleanup hook
})

afterAll(async () => {
  await prisma.$disconnect()
})
