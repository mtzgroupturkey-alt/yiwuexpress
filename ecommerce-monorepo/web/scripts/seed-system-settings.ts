import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSystemSettings() {
  console.log('🔧 Seeding SystemSettings with contact info and social media...')

  try {
    // Check if SystemSettings already exists
    const existingSettings = await prisma.systemSettings.findFirst()

    const settingsData = {
      companyName: 'Global Trade Express',
      companyAddress: 'Floor 15, International Trade Building, 123 Yiwu Commerce City, Zhejiang Province, China',
      companyPhone: '+86 579 8555 9999',
      companyEmail: 'info@globaltradeexpress.com',
      companyWebsite: 'https://globaltradeexpress.com',
      businessLicense: 'CHN-GTE-2024-001',
      taxRegistrationNumber: '91330782MA2BQXXX88',
      companyDescription: 'Leading international trade and logistics company connecting global businesses with Chinese manufacturers and suppliers.',
      companyLogo: '/images/logo.png',
      companyLogoHeight: 50,
      primaryColor: '#1a3a5c',
      accentColor: '#c9a84c',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      language: 'en',
      storeMode: 'WHOLESALE',
      // Social media links
      facebookUrl: 'https://facebook.com/globaltradeexpress',
      twitterUrl: 'https://twitter.com/GlobalTradeExp',
      linkedinUrl: 'https://linkedin.com/company/global-trade-express',
      instagramUrl: 'https://instagram.com/globaltradeexpress',
      wechatId: 'GlobalTrade_CN',
      whatsappNumber: '+8613901234567'
    }

    if (existingSettings) {
      // Update existing settings
      await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: settingsData
      })
      console.log('✅ Updated existing SystemSettings with contact and social media info')
    } else {
      // Create new settings
      await prisma.systemSettings.create({
        data: settingsData
      })
      console.log('✅ Created new SystemSettings with contact and social media info')
    }

    console.log('📞 Contact Information:')
    console.log(`   Company: ${settingsData.companyName}`)
    console.log(`   Address: ${settingsData.companyAddress}`)
    console.log(`   Phone: ${settingsData.companyPhone}`)
    console.log(`   Email: ${settingsData.companyEmail}`)
    
    console.log('🌐 Social Media:')
    console.log(`   Facebook: ${settingsData.facebookUrl}`)
    console.log(`   Twitter: ${settingsData.twitterUrl}`)
    console.log(`   LinkedIn: ${settingsData.linkedinUrl}`)
    console.log(`   Instagram: ${settingsData.instagramUrl}`)
    console.log(`   WeChat ID: ${settingsData.wechatId}`)
    console.log(`   WhatsApp: ${settingsData.whatsappNumber}`)

  } catch (error) {
    console.error('❌ Error seeding SystemSettings:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedSystemSettings()
    .then(() => {
      console.log('🎉 SystemSettings seeded successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error:', error)
      process.exit(1)
    })
}

module.exports = { seedSystemSettings }