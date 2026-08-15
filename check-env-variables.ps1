# ================================================================================
# CHECK ENVIRONMENT VARIABLES - Debug Translation API Issue
# ================================================================================

$SERVER = "djdn@39.175.57.2"
$PORT = "22"

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "CHECKING ENVIRONMENT VARIABLES ON SERVER" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Checking .env file location..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "ls -la /www/wwwroot/www.dromkok.com/web/.env*"
Write-Host ""

Write-Host "2. Checking OPENROUTER_API_KEY in .env..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "cd /www/wwwroot/www.dromkok.com/web && grep OPENROUTER .env"
Write-Host ""

Write-Host "3. Checking if PM2 is using the .env file..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 describe ecommerce-monorepo | grep -A5 'env:'"
Write-Host ""

Write-Host "4. Checking PM2 logs for environment errors..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 logs ecommerce-monorepo --lines 20 --nostream"
Write-Host ""

Write-Host "5. Checking which .env file Next.js is loading..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "cd /www/wwwroot/www.dromkok.com/web && ls -la .env* | grep -v node_modules"
Write-Host ""

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "Possible Issues:" -ForegroundColor Yellow
Write-Host "  1. .env file exists but PM2 not reading it" -ForegroundColor White
Write-Host "  2. Need to set env vars in PM2 ecosystem file" -ForegroundColor White
Write-Host "  3. Need to rebuild app after adding env vars" -ForegroundColor White
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
