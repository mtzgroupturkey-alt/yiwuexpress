const { Client } = require('pg')

async function checkDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'ecommerce',
    user: 'postgres',
    password: 'balkhi123'
  })

  try {
    await client.connect()
    console.log('✅ Connected to PostgreSQL\n')

    // List all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)

    console.log(`📊 Found ${tablesResult.rows.length} tables:\n`)
    tablesResult.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.table_name}`)
    })

    // Check products specifically
    console.log('\n🔍 Checking products table:\n')
    const productsResult = await client.query('SELECT * FROM products')
    console.log(`Found ${productsResult.rows.length} products:`)
    productsResult.rows.forEach(p => {
      console.log(`  - ${p.name} ($${p.price})`)
    })

    // Check categories
    console.log('\n📁 Checking categories table:\n')
    const categoriesResult = await client.query('SELECT * FROM categories')
    console.log(`Found ${categoriesResult.rows.length} categories:`)
    categoriesResult.rows.forEach(c => {
      console.log(`  - ${c.name}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkDatabase()
