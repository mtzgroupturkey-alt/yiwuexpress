import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n')

  // Hash password once for all users
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  // ============================================
  // 1. HERO SLIDERS
  // ============================================
  console.log('📸 Inserting Hero Slides...')
  
  const heroSlides = [
    {
      id: 'hero-slide-1',
      title: 'Global Trade Made Simple',
      subtitle: 'Your Gateway to Yiwu International Market',
      description: 'Connect with 75,000+ suppliers and ship worldwide with confidence.',
      ctaText: 'Start Trading Now',
      ctaLink: '/products',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=600&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
      displayOrder: 1,
      isActive: true,
      slideDuration: 5,
      motionType: 'slide',
      alignment: 'center',
    },
    {
      id: 'hero-slide-2',
      title: 'Professional Logistics Solutions',
      subtitle: 'Door-to-Door Shipping to 200+ Countries',
      description: 'Sea freight, air cargo, express delivery - we handle it all.',
      ctaText: 'Get a Quote',
      ctaLink: '/services/logistics',
      imageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&h=600&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&h=600&fit=crop',
      displayOrder: 2,
      isActive: true,
      slideDuration: 5,
      motionType: 'fade',
      alignment: 'left',
    },
  ]

  for (const slide of heroSlides) {
    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      update: slide,
      create: slide,
    })
  }
  console.log(`✅ Created ${heroSlides.length} hero slides\n`)
