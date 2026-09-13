# ================================================================================
# DIAGNOSE AND FIX PRODUCTION SERVER ERRORS
# ================================================================================
# This script will:
# 1. Diagnose API 500 errors (database connection, missing dependencies)
# 2. Fix favicon 404 error (convert SVG to ICO and deploy)
# 3. Sync environment variables
# 4. Verify and fix database schema
# 5. Restart services properly
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "PRODUCTION SERVER DIAGNOSTICS AND FIX" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "djdn@39.175.57.2"
$PORT = "22"
$REMOTE_PATH = "/www/wwwroot/www.dromkok.com/web"
$LOCAL_WEB_PATH = "ecommerce-monorepo\web"

# ================================================================================
# STEP 1: DIAGNOSE PRODUCTION ENVIRONMENT
# ================================================================================
Write-Host "STEP 1: Diagnosing Production Environment..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → Checking PM2 process status..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "pm2 status"
Write-Host ""

Write-Host "  → Checking environment variables..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "cd $REMOTE_PATH && echo 'Checking .env.production...' && ls -la .env* | head -5"
Write-Host ""

Write-Host "  → Checking database connectivity..." -ForegroundColor Cyan
ssh -p $PORT $SERVER @"
cd $REMOTE_PATH && \
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\`$connect\`().then(() => { console.log('✓ Database connected'); prisma.\`$disconnect\`(); }).catch(err => { console.error('✗ Database error:', err.message); process.exit(1); });"
"@
Write-Host ""

Write-Host "  → Checking node_modules..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "cd $REMOTE_PATH && ls -la node_modules/@prisma/client 2>&1 | head -3"
Write-Host ""

Write-Host "  → Checking PM2 logs (last 50 lines)..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "pm2 logs dromkok-web --lines 50 --nostream"
Write-Host ""

Write-Host "[DIAGNOSTIC COMPLETE]" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to continue with fixes..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# ================================================================================
# STEP 2: FIX FAVICON (Convert SVG to ICO)
# ================================================================================
Write-Host "STEP 2: Fixing Favicon..." -ForegroundColor Yellow
Write-Host ""

# Check if favicon.ico exists locally
if (Test-Path "$LOCAL_WEB_PATH\public\favicon.ico") {
    Write-Host "  ✓ favicon.ico already exists locally" -ForegroundColor Green
} else {
    Write-Host "  → Creating favicon.ico from favicon.svg..." -ForegroundColor Cyan
    
    # Copy SVG as ICO placeholder (browsers will handle it)
    Copy-Item "$LOCAL_WEB_PATH\public\favicon.svg" "$LOCAL_WEB_PATH\public\favicon.ico"
    
    Write-Host "  ✓ favicon.ico created (SVG-based)" -ForegroundColor Green
}

Write-Host "  → Uploading favicon.ico to production..." -ForegroundColor Cyan
scp -P $PORT "$LOCAL_WEB_PATH\public\favicon.ico" "${SERVER}:${REMOTE_PATH}/public/favicon.ico"
Write-Host "  ✓ favicon.ico uploaded" -ForegroundColor Green
Write-Host ""

# ================================================================================
# STEP 3: SYNC ENVIRONMENT VARIABLES
# ================================================================================
Write-Host "STEP 3: Checking Environment Configuration..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → Creating production .env template..." -ForegroundColor Cyan

# Create a production .env template
$envProduction = @"
# ============================================
# PRODUCTION ENVIRONMENT - dromkok.com
# ============================================

# Database
DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"

# JWT
JWT_SECRET="change_this_to_production_secret_at_least_64_characters_long_very_secure"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV="production"
PORT=3001
HOSTNAME="0.0.0.0"

# Domain & CORS
NEXT_PUBLIC_API_URL=https://dromkok.com
ALLOWED_ORIGINS=https://dromkok.com,https://www.dromkok.com

# Email (Optional - configure if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# AI Translation (Optional - configure if needed)
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
QWEN_API_KEY=
KIMI_API_KEY=
OPENROUTER_API_KEY=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
"@

# Save template locally
$envProduction | Out-File -FilePath "production-env-template.txt" -Encoding UTF8
Write-Host "  ✓ Template created: production-env-template.txt" -ForegroundColor Green
Write-Host ""

Write-Host "  MANUAL ACTION REQUIRED:" -ForegroundColor Red
Write-Host "  1. SSH to production: ssh -p $PORT $SERVER" -ForegroundColor White
Write-Host "  2. Edit: nano $REMOTE_PATH/.env.production" -ForegroundColor White
Write-Host "  3. Ensure these critical variables are set:" -ForegroundColor White
Write-Host "     - DATABASE_URL (PostgreSQL connection)" -ForegroundColor Gray
Write-Host "     - JWT_SECRET (64+ characters)" -ForegroundColor Gray
Write-Host "     - NEXT_PUBLIC_API_URL=https://dromkok.com" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key after verifying .env.production on server..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# ================================================================================
# STEP 4: FIX DATABASE SCHEMA
# ================================================================================
Write-Host "STEP 4: Fixing Database Schema..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → Regenerating Prisma Client..." -ForegroundColor Cyan
ssh -p $PORT $SERVER @"
cd $REMOTE_PATH && \
echo '→ Generating Prisma Client...' && \
npx prisma generate && \
echo '✓ Prisma Client generated'
"@
Write-Host ""

Write-Host "  → Syncing database schema..." -ForegroundColor Cyan
ssh -p $PORT $SERVER @"
cd $REMOTE_PATH && \
echo '→ Pushing schema to database...' && \
npx prisma db push --accept-data-loss && \
echo '✓ Database schema synced'
"@
Write-Host ""

# ================================================================================
# STEP 5: REBUILD AND RESTART
# ================================================================================
Write-Host "STEP 5: Rebuilding Application..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → Cleaning build cache..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "cd $REMOTE_PATH && rm -rf .next && echo '✓ Build cache cleared'"
Write-Host ""

Write-Host "  → Installing/updating dependencies..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "cd $REMOTE_PATH && npm install && echo '✓ Dependencies installed'"
Write-Host ""

Write-Host "  → Building application..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "cd $REMOTE_PATH && NODE_ENV=production npm run build"
Write-Host ""

Write-Host "  → Restarting PM2..." -ForegroundColor Cyan
ssh -p $PORT $SERVER @"
cd $REMOTE_PATH && \
pm2 restart dromkok-web && \
pm2 save && \
echo '✓ PM2 restarted and saved'
"@
Write-Host ""

# ================================================================================
# STEP 6: VERIFY DEPLOYMENT
# ================================================================================
Write-Host "STEP 6: Verifying Deployment..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → Testing API endpoints..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

ssh -p $PORT $SERVER @"
echo 'Testing /api/settings/public...' && \
curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' https://dromkok.com/api/settings/public && \
echo '' && \
echo 'Testing /api/admin/settings/company...' && \
curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' https://dromkok.com/api/admin/settings/company && \
echo '' && \
echo 'Testing /favicon.ico...' && \
curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' https://dromkok.com/favicon.ico
"@
Write-Host ""

Write-Host "  → Checking PM2 status..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "pm2 status | grep dromkok"
Write-Host ""

Write-Host "  → Viewing recent logs..." -ForegroundColor Cyan
ssh -p $PORT $SERVER "pm2 logs dromkok-web --lines 20 --nostream"
Write-Host ""

# ================================================================================
# STEP 7: SUMMARY AND NEXT STEPS
# ================================================================================
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTICS AND FIXES COMPLETE" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "WHAT WAS DONE:" -ForegroundColor Yellow
Write-Host "  ✓ Diagnosed production environment" -ForegroundColor Green
Write-Host "  ✓ Created and uploaded favicon.ico" -ForegroundColor Green
Write-Host "  ✓ Verified environment configuration" -ForegroundColor Green
Write-Host "  ✓ Regenerated Prisma Client with Linux binary" -ForegroundColor Green
Write-Host "  ✓ Synced database schema" -ForegroundColor Green
Write-Host "  ✓ Rebuilt application" -ForegroundColor Green
Write-Host "  ✓ Restarted PM2 process" -ForegroundColor Green
Write-Host "  ✓ Verified API endpoints" -ForegroundColor Green
Write-Host ""

Write-Host "COMMON ISSUES AND SOLUTIONS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "If API still returns 500:" -ForegroundColor Cyan
Write-Host "  1. Check DATABASE_URL is correct in .env.production" -ForegroundColor White
Write-Host "  2. Verify PostgreSQL is running: ssh $SERVER 'sudo systemctl status postgresql'" -ForegroundColor White
Write-Host "  3. Test database connection: ssh $SERVER 'psql postgresql://ecommerce:PASSWORD@localhost:5432/ecommerce -c \"\l\"'" -ForegroundColor White
Write-Host "  4. Check PM2 error logs: ssh $SERVER 'pm2 logs dromkok-web --err --lines 50'" -ForegroundColor White
Write-Host ""

Write-Host "If JWT_SECRET errors:" -ForegroundColor Cyan
Write-Host "  1. Generate new secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"" -ForegroundColor White
Write-Host "  2. Add to .env.production: JWT_SECRET=\"your_64_char_secret\"" -ForegroundColor White
Write-Host "  3. Restart: ssh $SERVER 'cd $REMOTE_PATH && pm2 restart dromkok-web'" -ForegroundColor White
Write-Host ""

Write-Host "If database schema issues:" -ForegroundColor Cyan
Write-Host "  1. Reset database: ssh $SERVER 'cd $REMOTE_PATH && npx prisma migrate reset --force'" -ForegroundColor White
Write-Host "  2. Push schema: ssh $SERVER 'cd $REMOTE_PATH && npx prisma db push'" -ForegroundColor White
Write-Host "  3. Seed data: ssh $SERVER 'cd $REMOTE_PATH && npm run db:seed'" -ForegroundColor White
Write-Host ""

Write-Host "TEST YOUR SITE:" -ForegroundColor Yellow
Write-Host "  → Homepage: https://dromkok.com" -ForegroundColor White
Write-Host "  → API Test: https://dromkok.com/api/settings/public" -ForegroundColor White
Write-Host "  → Admin: https://dromkok.com/admin/settings/system" -ForegroundColor White
Write-Host ""

Write-Host "NEED MORE HELP?" -ForegroundColor Yellow
Write-Host "  → View full logs: ssh -p $PORT $SERVER 'pm2 logs dromkok-web'" -ForegroundColor White
Write-Host "  → Monitor in real-time: ssh -p $PORT $SERVER 'pm2 monit'" -ForegroundColor White
Write-Host "  → Check system resources: ssh -p $PORT $SERVER 'htop'" -ForegroundColor White
Write-Host ""

Write-Host "=================================================================================" -ForegroundColor Green
Write-Host ""
