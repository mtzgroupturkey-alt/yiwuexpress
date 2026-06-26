const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkIndexes() {
  try {
    const result = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'products'
      AND (indexname LIKE '%featured%' OR indexname LIKE '%arrival%')
      ORDER BY indexname
    `
    
    console.log('\n✅ DATABASE INDEXES CHECK:')
    console.log('==========================\n')
    
    if (result.length > 0) {
      console.log(`Found ${result.length} index(es):\n`)
      result.forEach(idx => {
        console.log(`✓ ${idx.indexname}`)
        console.log(`  ${idx.indexdef}\n`)
      })
    } else {
      console.log('⚠️  No featured/new arrival indexes found yet.')
      console.log('Creating indexes...\n')
      
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_products_featured" ON "products"("isFeatured", "featuredOrder")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_products_new_arrival" ON "products"("isNewArrival", "newArrivalOrder")`
      
      console.log('✅ Indexes created successfully!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkIndexes()
