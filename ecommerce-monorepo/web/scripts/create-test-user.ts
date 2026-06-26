import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('🔧 Creating test user...\n')

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
    })

    if (existingUser) {
      console.log('✅ Test user already exists!')
      console.log('📧 Email: user@example.com')
      console.log('🔑 Password: password123')
      console.log('\n💡 You can login with these credentials at: http://localhost:3001/login\n')
      return
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: hashedPassword,
        name: 'Test Customer',
        companyName: 'Global Trade Co.',
        businessType: 'wholesaler',
        role: 'USER',
        country: 'Russia',
        phone: '+7 900 123-45-67',
      },
    })

    console.log('✅ Test user created successfully!')
    console.log('\n📋 Login credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email: user@example.com')
    console.log('🔑 Password: password123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 Login at: http://localhost:3001/login\n')

    // Also create admin if it doesn't exist
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@yiwuexpress.com' },
    })

    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 10)
      await prisma.user.create({
        data: {
          email: 'admin@yiwuexpress.com',
          password: adminPassword,
          name: 'YIWU Express Admin',
          companyName: 'YIWU EXPRESS',
          businessType: 'logistics_provider',
          role: 'ADMIN',
          country: 'China',
          phone: '+86 579 8555 1234',
        },
      })
      console.log('✅ Admin user created!')
      console.log('📧 Email: admin@yiwuexpress.com')
      console.log('🔑 Password: admin123\n')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
