const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSchema() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('isFeatured', 'featuredOrder', 'isNewArrival', 'newArrivalOrder')
      ORDER BY column_name
    `
    
    console.log('\n✅ DATABASE SCHEMA CHECK:')
    console.log('========================\n')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n')
    
    if (result.length === 4) {
      console.log('✅ SUCCESS! All 4 fields exist in the database:')
      result.forEach(col => {
        console.log(`   ✓ ${col.column_name} (${col.data_type})`)
      })
    } else {
      console.log(`⚠️  WARNING: Expected 4 fields, found ${result.length}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()
