const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCompleteSetup() {
  console.log('\n========================================')
  console.log('🎯 FEATURED PRODUCTS & NEW ARRIVALS')
  console.log('    COMPLETE SETUP VERIFICATION')
  console.log('========================================\n')
  
  try {
    // 1. Check Database Schema
    console.log('📊 [1/5] Checking Database Schema...')
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('isFeatured', 'featuredOrder', 'isNewArrival', 'newArrivalOrder')
      ORDER BY column_name
    `
    
    if (columns.length === 4) {
      console.log('   ✅ All 4 required fields exist:')
      columns.forEach(col => {
        console.log(`      ✓ ${col.column_name} (${col.data_type})`)
      })
    } else {
      console.log(`   ❌ ERROR: Expected 4 fields, found ${columns.length}`)
      return
    }
    
    // 2. Check Indexes
    console.log('\n📊 [2/5] Checking Database Indexes...')
    const indexes = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'products'
      AND (indexname = 'idx_products_featured' OR indexname = 'idx_products_new_arrival')
      ORDER BY indexname
    `
    
    if (indexes.length === 2) {
      console.log('   ✅ All required indexes exist:')
      indexes.forEach(idx => {
        console.log(`      ✓ ${idx.indexname}`)
      })
    } else {
      console.log(`   ⚠️  WARNING: Expected 2 indexes, found ${indexes.length}`)
    }
    
    // 3. Check Product Count
    console.log('\n📊 [3/5] Checking Products...')
    const totalProducts = await prisma.product.count()
    const featuredCount = await prisma.product.count({ where: { isFeatured: true } })
    const newArrivalCount = await prisma.product.count({ where: { isNewArrival: true } })
    
    console.log(`   ✓ Total Products: ${totalProducts}`)
    console.log(`   ✓ Featured Products: ${featuredCount}`)
    console.log(`   ✓ New Arrivals: ${newArrivalCount}`)
    
    // 4. Test Query Performance
    console.log('\n📊 [4/5] Testing Query Performance...')
    const start1 = Date.now()
    const featured = await prisma.product.findMany({
      where: { isFeatured: true },
      orderBy: { featuredOrder: 'asc' },
      take: 8
    })
    const time1 = Date.now() - start1
    console.log(`   ✓ Featured products query: ${time1}ms`)
    
    const start2 = Date.now()
    const newArrivals = await prisma.product.findMany({
      where: { isNewArrival: true },
      orderBy: { newArrivalOrder: 'asc' },
      take: 8
    })
    const time2 = Date.now() - start2
    console.log(`   ✓ New arrivals query: ${time2}ms`)
    
    // 5. Sample Data (if no featured/new arrivals exist)
    console.log('\n📊 [5/5] Sample Data Status...')
    
    if (featuredCount === 0 && totalProducts > 0) {
      console.log('   ℹ️  No featured products yet.')
      console.log('   💡 Go to /admin/products to mark products as featured')
    }
    
    if (newArrivalCount === 0 && totalProducts > 0) {
      console.log('   ℹ️  No new arrivals yet.')
      console.log('   💡 Go to /admin/products to mark products as new arrivals')
    }
    
    if (totalProducts === 0) {
      console.log('   ⚠️  No products in database.')
      console.log('   💡 Add products first via /admin/products/new')
    }
    
    // Final Summary
    console.log('\n========================================')
    console.log('✅ SETUP VERIFICATION COMPLETE!')
    console.log('========================================\n')
    
    console.log('📍 ADMIN ACCESS POINTS:')
    console.log('   • Products List:')
    console.log('     http://localhost:3000/admin/products')
    console.log('   • Featured Products Management:')
    console.log('     http://localhost:3000/admin/settings/featured-products')
    console.log('   • New Arrivals Management:')
    console.log('     http://localhost:3000/admin/settings/new-arrivals')
    console.log('\n📍 PUBLIC VIEW:')
    console.log('   • Homepage (Featured & New Arrivals):')
    console.log('     http://localhost:3000/')
    console.log('\n📚 DOCUMENTATION:')
    console.log('   • Complete Guide: web/FEATURED_NEW_ARRIVALS_GUIDE.md')
    console.log('   • Summary: FEATURED_NEW_ARRIVALS_COMPLETE.md')
    console.log('   • Quick Ref: FEATURE_SUMMARY_TABLE.md')
    
    console.log('\n🚀 NEXT STEPS:')
    console.log('   1. Start dev server: npm run dev')
    console.log('   2. Login to admin panel')
    console.log('   3. Go to /admin/products')
    console.log('   4. Toggle Featured/New Arrival switches')
    console.log('   5. Visit homepage to see results!')
    
    console.log('\n========================================\n')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('\nStack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testCompleteSetup()
