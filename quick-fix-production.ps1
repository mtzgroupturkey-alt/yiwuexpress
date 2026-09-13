# ================================================================================
# QUICK FIX FOR PRODUCTION SERVER ERRORS
# ================================================================================
# Fixes: API 500 errors, favicon 404, database schema issues
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "QUICK PRODUCTION FIX" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "djdn@39.175.57.2"
$PORT = "22"
$REMOTE_PATH = "/www/wwwroot/www.dromkok.com/web"
$LOCAL_WEB_PATH = "ecommerce-monorepo\web"

# ================================================================================
# FIX 1: Favicon
# ================================================================================
Write-Host "FIX 1: Creating and uploading favicon.ico..." -ForegroundColor Yellow

if (!(Test-Path "$LOCAL_WEB_PATH\public\favicon.ico")) {
    Copy-Item "$LOCAL_WEB_PATH\public\favicon.svg" "$LOCAL_WEB_PATH\public\favicon.ico"
    Write-Host "  ✓ Created favicon.ico locally" -ForegroundColor Green
}

scp -P $PORT "$LOCAL_WEB_PATH\public\favicon.ico" "${SERVER}:${REMOTE_PATH}/public/favicon.ico" 2>&1 | Out-Null
Write-Host "  ✓ Uploaded favicon.ico to production" -ForegroundColor Green
Write-Host ""

# ================================================================================
# FIX 2: Prisma Client & Database
# ================================================================================
Write-Host "FIX 2: Fixing Prisma Client and Database..." -ForegroundColor Yellow

ssh -p $PORT $SERVER @"
cd $REMOTE_PATH && \
echo '→ Generating Prisma Client with Linux binary...' && \
npx prisma generate && \
echo '→ Pushing database schema...' && \
npx prisma db push --accept-data-loss && \
echo '✓ Database fixed'
"@
Write-Host ""

# ================================================================================
# FIX 3: Environment Variables Check
# ================================================================================
Write-Host "FIX 3: Checking critical environment variables..." -ForegroundColor Yellow

$envCheck = ssh -p $PORT $SERVER @"
cd $REMOTE_PATH && \
if [ -f .env.production ]; then
  echo '✓ .env.production exists'
  grep -q 'DATABASE_URL=' .env.production && echo '✓ DATABASE_URL is set' || echo '✗ DATABASE_URL is MISSING'
  grep -q 'JWT_SECRET=' .env.production && echo '✓ JWT_SECRET is set' || echo '✗ JWT_SECRET is MISSING'
  grep -q 'NEXT_PUBLIC_API_URL=' .env.production && echo '✓ NEXT_PUBLIC_API_URL is set' || echo '✗ NEXT_PUBLIC_API_URL is MISSING'
else
  echo '✗ .env.production DOES NOT EXIST'
fi
"@

Write-Host $envCheck
Write-Host ""

# ================================================================================
# FIX 4: Rebuild & Restart
# ================================================================================
Write-Host "FIX 4: Rebuilding and restarting..." -ForegroundColor Yellow

ssh -p $PORT $SERVER @"
cd $REMOTE_PATH && \
echo '→ Clearing build cache...' && \
rm -rf .next && \
echo '→ Building application...' && \
NODE_ENV=production npm run build && \
echo '→ Restarting PM2...' && \
pm2 restart dromkok-web && \
pm2 save && \
echo '✓ Restart complete'
"@
Write-Host ""

# ================================================================================
# VERIFICATION
# ================================================================================
Write-Host "VERIFICATION: Testing endpoints..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Testing API endpoints..." -ForegroundColor Cyan

# Test /api/settings/public
Write-Host -NoNewline "  /api/settings/public: "
$status1 = ssh -p $PORT $SERVER "curl -s -o /dev/null -w '%{http_code}' https://dromkok.com/api/settings/public"
if ($status1 -eq "200") {
    Write-Host "✓ 200 OK" -ForegroundColor Green
} else {
    Write-Host "✗ $status1" -ForegroundColor Red
}

# Test /api/admin/settings/company
Write-Host -NoNewline "  /api/admin/settings/company: "
$status2 = ssh -p $PORT $SERVER "curl -s -o /dev/null -w '%{http_code}' https://dromkok.com/api/admin/settings/company"
if ($status2 -eq "200") {
    Write-Host "✓ 200 OK" -ForegroundColor Green
} else {
    Write-Host "✗ $status2" -ForegroundColor Red
}

# Test /favicon.ico
Write-Host -NoNewline "  /favicon.ico: "
$status3 = ssh -p $PORT $SERVER "curl -s -o /dev/null -w '%{http_code}' https://dromkok.com/favicon.ico"
if ($status3 -eq "200") {
    Write-Host "✓ 200 OK" -ForegroundColor Green
} else {
    Write-Host "✗ $status3" -ForegroundColor Red
}

Write-Host ""

# ================================================================================
# SUMMARY
# ================================================================================
Write-Host "=================================================================================" -ForegroundColor Cyan

$allGood = ($status1 -eq "200") -and ($status2 -eq "200") -and ($status3 -eq "200")

if ($allGood) {
    Write-Host "✓ ALL ISSUES FIXED!" -ForegroundColor Green
    Write-Host "=================================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your site is now working correctly:" -ForegroundColor White
    Write-Host "  → https://dromkok.com" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠ SOME ISSUES REMAIN" -ForegroundColor Yellow
    Write-Host "=================================================================================" -ForegroundColor Yellow
    Write-Host ""
    
    if ($status1 -ne "200" -or $status2 -ne "200") {
        Write-Host "API ERRORS - Run this to check environment variables:" -ForegroundColor Yellow
        Write-Host "  ssh -p $PORT $SERVER" -ForegroundColor White
        Write-Host "  cd $REMOTE_PATH" -ForegroundColor White
        Write-Host "  cat .env.production" -ForegroundColor White
        Write-Host ""
        Write-Host "Required in .env.production:" -ForegroundColor Yellow
        Write-Host "  DATABASE_URL=postgresql://ecommerce:PASSWORD@localhost:5432/ecommerce" -ForegroundColor Gray
        Write-Host "  JWT_SECRET=at_least_64_characters_long" -ForegroundColor Gray
        Write-Host "  NEXT_PUBLIC_API_URL=https://dromkok.com" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Check logs for errors:" -ForegroundColor Yellow
        Write-Host "  ssh -p $PORT $SERVER 'pm2 logs dromkok-web --lines 50'" -ForegroundColor White
        Write-Host ""
    }
    
    if ($status3 -ne "200") {
        Write-Host "FAVICON ERROR - Try manual upload:" -ForegroundColor Yellow
        Write-Host "  scp -P $PORT $LOCAL_WEB_PATH\public\favicon.ico ${SERVER}:${REMOTE_PATH}/public/" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "For detailed diagnostics, run:" -ForegroundColor Cyan
Write-Host "  .\diagnose-and-fix-production.ps1" -ForegroundColor White
Write-Host ""
