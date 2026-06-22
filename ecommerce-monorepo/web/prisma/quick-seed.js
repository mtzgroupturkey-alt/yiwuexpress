const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Quick seed: Creating admin user...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yiwuexpress.com' },
    update: {},
    create: {
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
  console.log('👤 Admin user ready:', admin.email)
  console.log('🔑 Password: admin123')

  console.log('✅ Quick seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })