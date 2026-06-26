import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function seedHeroSlides() {
  console.log('🎨 Starting hero slides seeding...')

  const heroSlides = [
    {
      title: 'Premium Cookware Collection',
      subtitle: 'Professional Quality for Your Kitchen',
      description: 'Discover our extensive range of high-quality cookware. From non-stick pans to stainless steel pots, equip your kitchen with the best.',
      imageUrl: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1920&h=800&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&h=600&fit=crop',
      productImageUrl: 'https://images.unsplash.com/photo-1584990347449-39b4aa02ec3d?w=600&h=600&fit=crop',
      badgeText: 'NEW ARRIVAL',
      badgeColor: '#c9a84c',
      ctaText: 'Shop Cookware',
      ctaLink: '/products?category=cookware',
      secondaryCtaText: 'View Collection',
      secondaryCtaLink: '/products',
      overlayColor: 'rgba(26,58,92,0.6)',
      textColor: '#ffffff',
      displayOrder: 1,
      isActive: true,
      slideDuration: 6,
      motionType: 'slide'
    },
    {
      title: 'Electronics & Gadgets',
      subtitle: 'Latest Technology at Wholesale Prices',
      description: 'Premium electronics including smartphones, laptops, tablets, and accessories. Direct from Yiwu, China.',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920&h=800&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop',
      productImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
      badgeText: 'HOT DEALS',
      badgeColor: '#ef4444',
      ctaText: 'Shop Electronics',
      ctaLink: '/products?category=electronics',
      secondaryCtaText: 'Explore More',
      secondaryCtaLink: '/products',
      overlayColor: 'rgba(0,0,0,0.5)',
      textColor: '#ffffff',
      displayOrder: 2,
      isActive: true,
      slideDuration: 6,
      motionType: 'fade'
    },
    {
      title: 'Fashion & Apparel',
      subtitle: 'Trendy Clothing for Everyone',
      description: 'From casual wear to formal attire. Quality clothing at unbeatable wholesale prices. Ships worldwide from Yiwu.',
      imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=800&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop',
      productImageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop',
      badgeText: 'BESTSELLER',
      badgeColor: '#10b981',
      ctaText: 'Browse Fashion',
      ctaLink: '/products?category=clothing',
      secondaryCtaText: 'All Categories',
      secondaryCtaLink: '/products',
      overlayColor: 'rgba(0,0,0,0.4)',
      textColor: '#ffffff',
      displayOrder: 3,
      isActive: true,
      slideDuration: 6,
      motionType: 'zoom'
    },
    {
      title: 'Home Furniture & Décor',
      subtitle: 'Transform Your Living Space',
      description: 'Modern furniture and home décor items. Create the perfect ambiance with our stylish and affordable collection.',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=800&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
      productImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
      badgeText: 'PREMIUM QUALITY',
      badgeColor: '#8b5cf6',
      ctaText: 'Shop Furniture',
      ctaLink: '/products?category=furniture',
      secondaryCtaText: 'See All',
      secondaryCtaLink: '/products',
      overlayColor: 'rgba(26,58,92,0.5)',
      textColor: '#ffffff',
      displayOrder: 4,
      isActive: true,
      slideDuration: 6,
      motionType: 'slide'
    },
    {
      title: 'Wholesale Direct from Yiwu',
      subtitle: 'China\'s Largest Wholesale Market',
      description: 'Access to millions of products at factory prices. Bulk orders, international shipping, and quality guaranteed.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=800&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
      productImageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop',
      badgeText: 'WHOLESALE',
      badgeColor: '#f59e0b',
      ctaText: 'Start Wholesale',
      ctaLink: '/wholesale',
      secondaryCtaText: 'Contact Us',
      secondaryCtaLink: '/contact',
      overlayColor: 'rgba(0,0,0,0.6)',
      textColor: '#ffffff',
      displayOrder: 5,
      isActive: true,
      slideDuration: 6,
      motionType: 'fade'
    }
  ]

  // Delete existing slides
  await prisma.heroSlide.deleteMany({})
  console.log('🗑️ Cleared existing hero slides')

  // Create new slides
  for (const slide of heroSlides) {
    await prisma.heroSlide.create({
      data: slide
    })
  }

  console.log(`✅ Created ${heroSlides.length} hero slides`)
  
  // Display summary
  const allSlides = await prisma.heroSlide.findMany({
    orderBy: { displayOrder: 'asc' }
  })
  
  console.log('\n📊 Hero Slides Summary:')
  allSlides.forEach((slide, index) => {
    console.log(`   ${index + 1}. ${slide.title} - ${slide.badgeText}`)
  })
}

// Main execution
if (require.main === module) {
  seedHeroSlides()
    .then(() => {
      console.log('🌟 Hero slides seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}

export { seedHeroSlides }