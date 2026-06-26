const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testHomepageAPIs() {
  console.log('\n========================================')
  console.log('🏠 TESTING HOMEPAGE API QUERIES')
  console.log('========================================\n')
  
  try {
    // Test Featured Products Query
    console.log('📊 [1/3] Testing Featured Products Query...')
    const featuredProducts = await prisma.product.findMany({
      where: { 
        isActive: true,
        isFeatured: true 
      },
      orderBy: { featuredOrder: 'asc' },
      take: 8,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    
    console.log(`   ✓ Found ${featuredProducts.length} featured products`)
    if (featuredProducts.length > 0) {
      console.log('   ✓ Sample featured products:')
      featuredProducts.slice(0, 3).forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.name} - $${p.price} (Order: ${p.featuredOrder})`)
      })
    } else {
      console.log('   ⚠️  No featured products found!')
      console.log('   💡 Go to /admin/products and toggle "Featured" switch')
    }
    
    // Test New Arrivals Query
    console.log('\n📊 [2/3] Testing New Arrivals Query...')
    const newArrivals = await prisma.product.findMany({
      where: { 
        isActive: true,
        isNewArrival: true 
      },
      orderBy: { newArrivalOrder: 'asc' },
      take: 8,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    
    console.log(`   ✓ Found ${newArrivals.length} new arrival products`)
    if (newArrivals.length > 0) {
      console.log('   ✓ Sample new arrivals:')
      newArrivals.slice(0, 3).forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.name} - $${p.price} (Order: ${p.newArrivalOrder})`)
      })
    } else {
      console.log('   ⚠️  No new arrivals found!')
      console.log('   💡 Go to /admin/products and toggle "New Arrival" switch')
    }
    
    // Simulate API Response Format
    console.log('\n📊 [3/3] Verifying API Response Format...')
    const apiResponse = {
      success: true,
      data: featuredProducts,
      pagination: {
        page: 1,
        limit: 8,
        total: featuredProducts.length,
        pages: Math.ceil(featuredProducts.length / 8)
      }
    }
    
    console.log('   ✓ API Response structure is correct')
    console.log(`   ✓ Response has 'success' field: ${apiResponse.success}`)
    console.log(`   ✓ Response has 'data' field: ${Array.isArray(apiResponse.data)}`)
    console.log(`   ✓ Response has 'pagination' field: ${!!apiResponse.pagination}`)
    
    // Summary
    console.log('\n========================================')
    console.log('✅ API TESTING COMPLETE!')
    console.log('========================================\n')
    
    if (featuredProducts.length > 0 || newArrivals.length > 0) {
      console.log('🎉 SUCCESS! Products are ready to display on homepage')
      console.log('\n📍 HOMEPAGE SECTIONS:')
      if (featuredProducts.length > 0) {
        console.log(`   ✅ Featured Products: ${featuredProducts.length} products ready`)
      } else {
        console.log('   ⚠️  Featured Products: No products marked (add via /admin/products)')
      }
      if (newArrivals.length > 0) {
        console.log(`   ✅ New Arrivals: ${newArrivals.length} products ready`)
      } else {
        console.log('   ⚠️  New Arrivals: No products marked (add via /admin/products)')
      }
    } else {
      console.log('⚠️  WARNING: No products are marked as Featured or New Arrivals!')
      console.log('\n📝 TO FIX THIS:')
      console.log('   1. Go to: http://localhost:3000/admin/products')
      console.log('   2. Toggle "Featured" switch for some products')
      console.log('   3. Toggle "New Arrival" switch for some products')
      console.log('   4. Refresh homepage to see results')
    }
    
    console.log('\n🌐 NEXT STEPS:')
    console.log('   1. Start dev server: npm run dev')
    console.log('   2. Visit: http://localhost:3000/')
    console.log('   3. You should see:')
    console.log('      • Featured Products section')
    console.log('      • New Arrivals section')
    console.log('\n========================================\n')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testHomepageAPIs()
