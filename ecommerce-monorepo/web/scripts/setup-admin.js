const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupAdmin() {
  try {
    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@yiwuexpress.com' }
    })

    if (adminExists) {
      console.log('✅ Admin user already exists!')
      console.log('📧 Email: admin@yiwuexpress.com')
      console.log('🔑 Password: admin123')
      return
    }

    // Create admin user if doesn't exist
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
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

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@yiwuexpress.com')
    console.log('🔑 Password: admin123')
    console.log('👤 User ID:', admin.id)

  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()