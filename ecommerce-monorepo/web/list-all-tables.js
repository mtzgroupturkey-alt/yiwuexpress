const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listTables() {
  try {
    // Query the PostgreSQL information schema directly
    const tables = await prisma.$queryRaw`
      SELECT 
        table_name,
        (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::int as row_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    
    console.log('\n📊 All Tables in "ecommerce" database (public schema):\n')
    console.log('='.repeat(60))
    
    tables.forEach((table, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${table.table_name.padEnd(30)} - ${table.row_count || 0} rows`)
    })
    
    console.log('='.repeat(60))
    console.log(`\nTotal Tables: ${tables.length}\n`)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listTables()
