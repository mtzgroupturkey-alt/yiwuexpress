#!/usr/bin/env tsx

/**
 * Script to update breadcrumb settings in the database from "YIWU EXPRESS" to "Global Trade"
 * Run with: npx tsx scripts/update-breadcrumb-names.ts
 */

import { prisma } from '../lib/db'

async function updateBreadcrumbNames() {
  try {
    console.log('🔄 Updating breadcrumb settings in database...')
    
    // Update home page breadcrumb
    const homeUpdated = await prisma.breadcrumbSetting.updateMany({
      where: {
        pageType: 'home',
        subtitle: 'Welcome to YIWU EXPRESS'
      },
      data: {
        subtitle: 'Welcome to Global Trade'
      }
    })
    
    // Update register page breadcrumb
    const registerUpdated = await prisma.breadcrumbSetting.updateMany({
      where: {
        pageType: 'register',
        subtitle: 'Join YIWU EXPRESS'
      },
      data: {
        subtitle: 'Join Global Trade'
      }
    })
    
    // Update about page breadcrumb if it exists
    const aboutUpdated = await prisma.breadcrumbSetting.updateMany({
      where: {
        pageType: 'about',
        OR: [
          { subtitle: { contains: 'YIWU EXPRESS' } },
          { title: { contains: 'YIWU EXPRESS' } }
        ]
      },
      data: {
        subtitle: 'Learn about Global Trade',
        title: 'About Global Trade'
      }
    })
    
    console.log('✅ Breadcrumb updates completed:')
    console.log(`   - Home pages updated: ${homeUpdated.count}`)
    console.log(`   - Register pages updated: ${registerUpdated.count}`)
    console.log(`   - About pages updated: ${aboutUpdated.count}`)
    
    // List all current breadcrumb settings for verification
    const allSettings = await prisma.breadcrumbSetting.findMany({
      select: {
        pageType: true,
        pageSlug: true,
        title: true,
        subtitle: true
      }
    })
    
    console.log('\n📋 Current breadcrumb settings:')
    allSettings.forEach(setting => {
      console.log(`   ${setting.pageType}${setting.pageSlug ? `/${setting.pageSlug}` : ''}: "${setting.title || 'No title'}" - "${setting.subtitle || 'No subtitle'}"`)
    })
    
  } catch (error) {
    console.error('❌ Error updating breadcrumb names:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateBreadcrumbNames()