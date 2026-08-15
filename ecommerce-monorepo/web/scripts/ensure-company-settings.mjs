/**
 * Ensures a SystemSettings row exists so the company name (and other
 * branding) is always available. If no row exists, one is created with
 * the default company name "Global Trade". Existing rows are left untouched
 * (the DB value always takes precedence over the code default).
 *
 * Run with:  node scripts/ensure-company-settings.mjs
 * (or:       npx tsx scripts/ensure-company-settings.mjs)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.systemSettings.findFirst()

  if (!existing) {
    await prisma.systemSettings.create({
      data: {
        companyName: 'Global Trade',
        primaryColor: '#1a3a5c',
        accentColor: '#c9a84c',
        currency: 'USD',
        timezone: 'Asia/Shanghai',
        language: 'en',
      },
    })
    console.log('✅ Created SystemSettings with default companyName "Global Trade"')
  } else {
    console.log(`ℹ️  SystemSettings already exists (companyName: "${existing.companyName}"). Leaving untouched.`)
  }
}

main()
  .catch((err) => {
    console.error('❌ Failed to ensure company settings:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
