const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupAdmin() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10)
    const adminEmails = ['admin@dromkok.com', 'admin@test.com']

    for (const email of adminEmails) {
      const existing = await prisma.user.findUnique({
        where: { email },
      })

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            password: adminPassword,
            role: 'ADMIN',
            isActive: true,
          },
        })
        console.log(`✅ Admin user updated: ${email} (Password: admin123)`)
      } else {
        const created = await prisma.user.create({
          data: {
            email,
            password: adminPassword,
            name: 'Global Trade Admin',
            companyName: 'Global Trade',
            businessType: 'logistics_provider',
            role: 'ADMIN',
            country: 'China',
            phone: '+86 579 8555 1234',
            isActive: true,
            isVerified: true,
          },
        })
        console.log(`✅ Admin user created: ${email} (Password: admin123, ID: ${created.id})`)
      }
    }
  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()