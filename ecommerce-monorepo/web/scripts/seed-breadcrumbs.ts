#!/usr/bin/env tsx

/**
 * Script to seed breadcrumb settings with correct company name
 * Run with: npx tsx scripts/seed-breadcrumbs.ts
 */

import { prisma } from '../lib/db'

async function seedBreadcrumbs() {
  try {
    console.log('🔄 Seeding breadcrumb settings...')
    
    const breadcrumbData = [
      { pageType: 'home', imageUrl: '/uploads/breadcrumb/home-bg.jpg', title: 'Home', subtitle: 'Welcome to Global Trade' },
      { pageType: 'about', imageUrl: '/uploads/breadcrumb/about-bg.jpg', title: 'About Global Trade', subtitle: 'Learn about Global Trade' },
      { pageType: 'products', imageUrl: '/uploads/breadcrumb/products-bg.jpg', title: 'Products', subtitle: 'Browse Our Catalog' },
      { pageType: 'categories', imageUrl: '/uploads/breadcrumb/categories-bg.jpg', title: 'Categories', subtitle: 'Shop by Category' },
      { pageType: 'contact', imageUrl: '/uploads/breadcrumb/contact-bg.jpg', title: 'Contact Us', subtitle: 'Get in Touch' },
      { pageType: 'cart', imageUrl: '/uploads/breadcrumb/cart-bg.jpg', title: 'Shopping Cart', subtitle: 'Review Your Items' },
      { pageType: 'checkout', imageUrl: '/uploads/breadcrumb/checkout-bg.jpg', title: 'Checkout', subtitle: 'Complete Your Order' },
      { pageType: 'orders', imageUrl: '/uploads/breadcrumb/orders-bg.jpg', title: 'Orders', subtitle: 'Your Order History' },
      { pageType: 'track', imageUrl: '/uploads/breadcrumb/track-bg.jpg', title: 'Track Shipment', subtitle: 'Real-Time Tracking' },
      { pageType: 'login', imageUrl: '/uploads/breadcrumb/auth-bg.jpg', title: 'Sign In', subtitle: 'Welcome Back' },
      { pageType: 'register', imageUrl: '/uploads/breadcrumb/auth-bg.jpg', title: 'Create Account', subtitle: 'Join Global Trade' },
      { pageType: 'calculator', imageUrl: '/uploads/breadcrumb/calculator-bg.jpg', title: 'Shipping Calculator', subtitle: 'Calculate Shipping Costs' },
      { pageType: 'dashboard', imageUrl: '/uploads/breadcrumb/dashboard-bg.jpg', title: 'Dashboard', subtitle: 'Your Account Overview' },
      { pageType: 'wholesale', imageUrl: '/uploads/breadcrumb/wholesale-bg.jpg', title: 'Wholesale', subtitle: 'Bulk Ordering Solutions' },
    ]

    for (const b of breadcrumbData) {
      const exists = await prisma.breadcrumbSetting.findFirst({
        where: { pageType: b.pageType }
      })
      
      if (exists) {
        // Update existing record
        await prisma.breadcrumbSetting.update({
          where: { id: exists.id },
          data: {
            title: b.title,
            subtitle: b.subtitle,
            imageUrl: b.imageUrl
          }
        })
        console.log(`   ✅ Updated breadcrumb for ${b.pageType}`)
      } else {
        // Create new record
        await prisma.breadcrumbSetting.create({
          data: {
            pageType: b.pageType,
            imageUrl: b.imageUrl,
            title: b.title,
            subtitle: b.subtitle,
            overlayColor: 'rgba(26, 26, 46, 0.85), rgba(26, 58, 92, 0.85)',
            isActive: true
          }
        })
        console.log(`   ✅ Created breadcrumb for ${b.pageType}`)
      }
    }

    console.log('🎉 Breadcrumb seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding breadcrumbs:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedBreadcrumbs()