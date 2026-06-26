const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n')
    
    // Try to query each table
    const checks = [
      { name: 'Users', query: () => prisma.user.count() },
      { name: 'Products', query: () => prisma.product.count() },
      { name: 'Categories', query: () => prisma.category.count() },
      { name: 'Orders', query: () => prisma.order.count() },
      { name: 'OrderItems', query: () => prisma.orderItem.count() },
      { name: 'Carts', query: () => prisma.cart.count() },
      { name: 'CartItems', query: () => prisma.cartItem.count() },
      { name: 'Countries', query: () => prisma.country.count() },
      { name: 'ShippingRates', query: () => prisma.shippingRate.count() },
      { name: 'WholesaleInquiries', query: () => prisma.wholesaleInquiry.count() },
      { name: 'Addresses', query: () => prisma.address.count() },
      { name: 'Notifications', query: () => prisma.notification.count() },
      { name: 'Services', query: () => prisma.service.count() },
      { name: 'Quotes', query: () => prisma.quote.count() },
      { name: 'Shipments', query: () => prisma.shipment.count() },
      { name: 'CompanyInfo', query: () => prisma.companyInfo.count() },
      { name: 'SystemSettings', query: () => prisma.systemSettings.count() },
      { name: 'PermissionRoles', query: () => prisma.permissionRole.count() },
      { name: 'RolePermissions', query: () => prisma.rolePermission.count() },
      { name: 'UserPermissions', query: () => prisma.userPermission.count() },
      { name: 'OrderExceptions', query: () => prisma.orderException.count() },
    ]

    let totalTables = 0
    let totalRecords = 0

    for (const check of checks) {
      try {
        const count = await check.query()
        console.log(`✓ ${check.name.padEnd(25)} - ${count} records`)
        totalTables++
        totalRecords += count
      } catch (error) {
        console.log(`✗ ${check.name.padEnd(25)} - ERROR: ${error.message}`)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`Total Tables: ${totalTables}`)
    console.log(`Total Records: ${totalRecords}`)
    console.log('='.repeat(50))

    // Show database connection info
    console.log('\n📊 Database Connection:')
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
      if (match) {
        console.log(`   Host: ${match[3]}`)
        console.log(`   Port: ${match[4]}`)
        console.log(`   Database: ${match[5]}`)
        console.log(`   User: ${match[1]}`)
      }
    }

    console.log('\n✨ Check complete!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()
