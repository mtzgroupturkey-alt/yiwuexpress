const { execSync } = require('child_process')
const path = require('path')

console.log('🔧 Fixing Admin System...\n')

try {
  // Change to web directory
  process.chdir(path.join(__dirname, '..'))
  
  console.log('1️⃣ Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })
  
  console.log('\n2️⃣ Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  console.log('\n3️⃣ Pushing database schema...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  
  console.log('\n4️⃣ Seeding database...')
  execSync('npx prisma db seed', { stdio: 'inherit' })
  
  console.log('\n✅ Admin System Fixed!')
  console.log('\n🚀 Next Steps:')
  console.log('   1. Run: npm run dev')
  console.log('   2. Visit: http://localhost:3000/auth/login')
  console.log('   3. Login with:')
  console.log('      Email: admin@yiwuexpress.com')
  console.log('      Password: admin123')
  console.log('')
  
} catch (error) {
  console.error('❌ Fix failed:', error.message)
  console.log('\n🔧 Manual steps:')
  console.log('   cd web')
  console.log('   npm install')
  console.log('   npx prisma generate')
  console.log('   npx prisma db push')
  console.log('   npx prisma db seed')
  console.log('   npm run dev')
}