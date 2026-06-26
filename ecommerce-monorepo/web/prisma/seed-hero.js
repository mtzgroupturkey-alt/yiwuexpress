const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedHeroSlides() {
  console.log('🎯 Seeding hero slides...')

  // Create default hero slide
  const defaultSlide = await prisma.heroSlide.create({
    data: {
      title: 'Rise Ceramic Nonstick Bakeware',
      subtitle: 'Weeknight wins start with',
      description: 'From bubbling enchiladas to golden bakes, bring beauty and ease to every summer meal.',
      imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1920&h=800&fit=crop',
      productImageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833379?w=600&h=600&fit=crop',
      badgeText: 'NEW',
      badgeColor: '#c9a84c',
      ctaText: 'SHOP NOW',
      ctaLink: '/products',
      secondaryCtaText: 'Rise Baking Made Beautiful',
      secondaryCtaLink: '/products/rise-bakeware',
      overlayColor: 'rgba(26,58,92,0.6)',
      textColor: '#ffffff',
      displayOrder: 0,
      isActive: true,
      slideDuration: 6,
    },
  })

  console.log('✅ Created default hero slide:', defaultSlide.title)

  // Create second slide
  const secondSlide = await prisma.heroSlide.create({
    data: {
      title: 'Global Trade Solutions',
      subtitle: 'Your trusted partner',
      description: 'Connecting businesses worldwide with reliable logistics and sourcing services from Yiwu, China.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=800&fit=crop',
      badgeText: 'TRUSTED',
      badgeColor: '#1a3a5c',
      ctaText: 'EXPLORE SERVICES',
      ctaLink: '/services',
      secondaryCtaText: 'Contact Us',
      secondaryCtaLink: '/contact',
      overlayColor: 'rgba(26,26,46,0.7)',
      textColor: '#ffffff',
      displayOrder: 1,
      isActive: true,
      slideDuration: 5,
    },
  })

  console.log('✅ Created second hero slide:', secondSlide.title)

  console.log('✨ Hero slides seeded successfully!')
}

seedHeroSlides()
  .catch((e) => {
    console.error('❌ Error seeding hero slides:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
