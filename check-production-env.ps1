# ================================================================================
# CHECK PRODUCTION ENVIRONMENT VARIABLES
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "PRODUCTION ENVIRONMENT CHECK" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "djdn@39.175.57.2"
$PORT = "22"
$REMOTE_PATH = "/www/wwwroot/www.dromkok.com/web"

Write-Host "Checking environment on: $SERVER" -ForegroundColor Yellow
Write-Host "Path: $REMOTE_PATH" -ForegroundColor Yellow
Write-Host ""

# Check .env.production
$envResult = ssh -p $PORT $SERVER @"
cd $REMOTE_PATH
echo '=== ENVIRONMENT FILE ==='
if [ -f .env.production ]; then
  echo '✓ .env.production exists'
  echo ''
  echo '=== CRITICAL VARIABLES ==='
  
  # Database
  if grep -q 'DATABASE_URL=' .env.production; then
    echo '✓ DATABASE_URL: SET'
    # Show without password
    grep 'DATABASE_URL=' .env.production | sed 's/:.*@/:***@/'
  else
    echo '✗ DATABASE_URL: MISSING'
  fi
  
  # JWT
  if grep -q 'JWT_SECRET=' .env.production; then
    JWT_LEN=\$(grep 'JWT_SECRET=' .env.production | cut -d'=' -f2 | wc -c)
    if [ \$JWT_LEN -gt 64 ]; then
      echo '✓ JWT_SECRET: SET (length OK)'
    else
      echo '⚠ JWT_SECRET: SET (but too short, need 64+ chars)'
    fi
  else
    echo '✗ JWT_SECRET: MISSING'
  fi
  
  # API URL
  if grep -q 'NEXT_PUBLIC_API_URL=' .env.production; then
    echo '✓ NEXT_PUBLIC_API_URL: SET'
    grep 'NEXT_PUBLIC_API_URL=' .env.production
  else
    echo '✗ NEXT_PUBLIC_API_URL: MISSING'
  fi
  
  # Node Environment
  if grep -q 'NODE_ENV=' .env.production; then
    echo '✓ NODE_ENV: SET'
    grep 'NODE_ENV=' .env.production
  else
    echo '⚠ NODE_ENV: MISSING (will default to development)'
  fi
  
  echo ''
  echo '=== OPTIONAL VARIABLES ==='
  
  # CORS
  if grep -q 'ALLOWED_ORIGINS=' .env.production; then
    echo '✓ ALLOWED_ORIGINS: SET'
  else
    echo '○ ALLOWED_ORIGINS: NOT SET (using defaults)'
  fi
  
  # AI Keys
  if grep -q 'OPENROUTER_API_KEY=' .env.production; then
    echo '✓ OPENROUTER_API_KEY: SET'
  else
    echo '○ OPENROUTER_API_KEY: NOT SET'
  fi
  
  if grep -q 'GEMINI_API_KEY=' .env.production; then
    echo '✓ GEMINI_API_KEY: SET'
  else
    echo '○ GEMINI_API_KEY: NOT SET'
  fi
  
else
  echo '✗ .env.production DOES NOT EXIST!'
  echo ''
  echo 'You need to create it:'
  echo '  ssh -p $PORT $SERVER'
  echo '  cd $REMOTE_PATH'
  echo '  nano .env.production'
fi
"@

Write-Host $envResult
Write-Host ""

# Check database connection
Write-Host "=== DATABASE CONNECTION ===" -ForegroundColor Yellow
$dbResult = ssh -p $PORT $SERVER @"
cd $REMOTE_PATH
if [ -f .env.production ]; then
  node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\\\$connect()
    .then(() => {
      console.log('✓ Database connection successful');
      return prisma.systemSettings.findFirst();
    })
    .then(settings => {
      if (settings) {
        console.log('✓ SystemSettings table accessible');
        console.log('  Company Name: ' + settings.companyName);
      } else {
        console.log('⚠ SystemSettings table empty (run db:seed)');
      }
      return prisma.\\\$disconnect();
    })
    .catch(err => {
      console.error('✗ Database error:', err.message);
      process.exit(1);
    });
  " 2>&1
else
  echo '✗ Cannot test database - .env.production missing'
fi
"@

Write-Host $dbResult
Write-Host ""

# Check Prisma Client
Write-Host "=== PRISMA CLIENT ===" -ForegroundColor Yellow
$prismaResult = ssh -p $PORT $SERVER @"
cd $REMOTE_PATH
if [ -d node_modules/@prisma/client ]; then
  echo '✓ @prisma/client installed'
  if [ -d node_modules/.prisma/client ]; then
    echo '✓ Prisma client generated'
    # Check for Linux binary
    if [ -f node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node ]; then
      echo '✓ Linux binary (debian-openssl-3.0.x) found'
    else
      echo '⚠ Linux binary missing - run: npx prisma generate'
    fi
  else
    echo '✗ Prisma client not generated - run: npx prisma generate'
  fi
else
  echo '✗ @prisma/client not installed - run: npm install'
fi
"@

Write-Host $prismaResult
Write-Host ""

# Check PM2
Write-Host "=== PM2 PROCESS ===" -ForegroundColor Yellow
$pm2Result = ssh -p $PORT $SERVER "pm2 list | grep dromkok"
Write-Host $pm2Result
Write-Host ""

# Summary
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "WHAT TO DO NEXT" -ForegroundColor Yellow
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

if ($envResult -match "DATABASE_URL.*MISSING" -or $envResult -match "JWT_SECRET.*MISSING") {
    Write-Host "❌ CRITICAL VARIABLES MISSING" -ForegroundColor Red
    Write-Host ""
    Write-Host "ACTION REQUIRED: Set up .env.production" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. SSH to server:" -ForegroundColor White
    Write-Host "   ssh -p $PORT $SERVER" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Create .env.production:" -ForegroundColor White
    Write-Host "   cd $REMOTE_PATH" -ForegroundColor Gray
    Write-Host "   nano .env.production" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Add these critical variables:" -ForegroundColor White
    Write-Host "   DATABASE_URL=postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce" -ForegroundColor Gray
    Write-Host "   JWT_SECRET=<generate-64-char-secret>" -ForegroundColor Gray
    Write-Host "   NEXT_PUBLIC_API_URL=https://dromkok.com" -ForegroundColor Gray
    Write-Host "   NODE_ENV=production" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Generate JWT_SECRET:" -ForegroundColor White
    Write-Host "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Restart PM2:" -ForegroundColor White
    Write-Host "   pm2 restart dromkok-web" -ForegroundColor Gray
    Write-Host ""
} elseif ($dbResult -match "Database error" -or $dbResult -match "Cannot test") {
    Write-Host "❌ DATABASE CONNECTION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "  1. Is PostgreSQL running? ssh $SERVER 'sudo systemctl status postgresql'" -ForegroundColor White
    Write-Host "  2. Is DATABASE_URL correct in .env.production?" -ForegroundColor White
    Write-Host "  3. Can you connect manually? ssh $SERVER 'psql <DATABASE_URL> -c \"\l\"'" -ForegroundColor White
    Write-Host ""
} elseif ($prismaResult -match "not generated" -or $prismaResult -match "binary missing") {
    Write-Host "⚠ PRISMA CLIENT NEEDS REGENERATION" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run these commands on the server:" -ForegroundColor White
    Write-Host "  ssh -p $PORT $SERVER" -ForegroundColor Gray
    Write-Host "  cd $REMOTE_PATH" -ForegroundColor Gray
    Write-Host "  npx prisma generate" -ForegroundColor Gray
    Write-Host "  pm2 restart dromkok-web" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ ENVIRONMENT LOOKS GOOD" -ForegroundColor Green
    Write-Host ""
    Write-Host "If APIs still fail, run the full fix:" -ForegroundColor White
    Write-Host "  .\quick-fix-production.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "For detailed guide, see: PRODUCTION-ERRORS-FIX-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
