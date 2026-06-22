const fetch = require('node-fetch')

async function testAdminSystem() {
  console.log('🧪 Testing YIWU EXPRESS Admin System...\n')

  try {
    // Test 1: Login
    console.log('1️⃣ Testing login...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@yiwuexpress.com',
        password: 'admin123'
      })
    })

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    const token = loginData.token

    if (!token) {
      throw new Error('No token received')
    }
    console.log('✅ Login successful')

    // Test 2: Admin Auth Check
    console.log('2️⃣ Testing admin auth...')
    const authResponse = await fetch('http://localhost:3000/api/admin/auth', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!authResponse.ok) {
      throw new Error(`Admin auth failed: ${authResponse.status}`)
    }
    console.log('✅ Admin auth verified')

    // Test 3: Stats API
    console.log('3️⃣ Testing stats API...')
    const statsResponse = await fetch('http://localhost:3000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!statsResponse.ok) {
      throw new Error(`Stats API failed: ${statsResponse.status}`)
    }

    const statsData = await statsResponse.json()
    console.log('✅ Stats API working')
    console.log(`   - Total Services: ${statsData.totalServices || 0}`)
    console.log(`   - Total Users: ${statsData.totalUsers || 0}`)

    // Test 4: Services API
    console.log('4️⃣ Testing services API...')
    const servicesResponse = await fetch('http://localhost:3000/api/admin/services?page=1&limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!servicesResponse.ok) {
      throw new Error(`Services API failed: ${servicesResponse.status}`)
    }

    const servicesData = await servicesResponse.json()
    console.log('✅ Services API working')
    console.log(`   - Found ${servicesData.services?.length || 0} services`)

    console.log('\n🎉 All tests passed! Admin system is working correctly.')
    console.log('\n🚀 You can now:')
    console.log('   1. Visit: http://localhost:3000/auth/login')
    console.log('   2. Login with: admin@yiwuexpress.com / admin123')
    console.log('   3. Access the admin dashboard')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('\n🔧 Make sure:')
    console.log('   1. Development server is running: npm run dev')
    console.log('   2. Database is seeded: npx prisma db seed')
    console.log('   3. Admin user exists in database')
  }
}

testAdminSystem()