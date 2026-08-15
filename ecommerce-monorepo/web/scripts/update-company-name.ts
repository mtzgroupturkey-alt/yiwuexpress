#!/usr/bin/env tsx

/**
 * Script to update the company name in the database from "YIWU EXPRESS" to "Global Trade"
 * Run with: npx tsx scripts/update-company-name.ts
 */

import { prisma } from '../lib/db'

async function updateCompanyName() {
  try {
    console.log('🔄 Updating company name in database...')
    
    // Check if any settings exist
    const existingSettings = await prisma.systemSettings.findFirst()
    
    if (existingSettings) {
      if (existingSettings.companyName === 'YIWU EXPRESS') {
        // Update existing record
        await prisma.systemSettings.update({
          where: { id: existingSettings.id },
          data: { companyName: 'Global Trade' }
        })
        console.log('✅ Updated existing company name from "YIWU EXPRESS" to "Global Trade"')
      } else {
        console.log(`ℹ️  Company name is already set to: "${existingSettings.companyName}"`)
      }
    } else {
      // Create new settings record with default values
      await prisma.systemSettings.create({
        data: {
          companyName: 'Global Trade',
          companyAddress: 'Yiwu International Trade City, Yiwu, Zhejiang, China',
          companyPhone: '+86 579 8555 1234',
          companyEmail: 'info@globaltradecompany.com',
          companyWebsite: 'https://globaltradecompany.com',
          companyDescription: 'Leading logistics and trade services provider connecting China to the world',
          primaryColor: '#1a3a5c',
          accentColor: '#c9a84c',
          currency: 'USD',
          timezone: 'Asia/Shanghai',
          language: 'en',
        }
      })
      console.log('✅ Created new system settings with company name "Global Trade"')
    }
    
    console.log('🎉 Company name update completed successfully!')
    
  } catch (error) {
    console.error('❌ Error updating company name:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateCompanyName()