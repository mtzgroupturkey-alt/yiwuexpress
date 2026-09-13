# Simple Production Fix Script
# No complex SSH commands, step-by-step manual approach

$SERVER = "djdn@39.175.57.2"
$PORT = "22"
$REMOTE_PATH = "/www/wwwroot/www.dromkok.com/web"
$LOCAL_WEB = "ecommerce-monorepo\web"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "SIMPLE PRODUCTION FIX" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create favicon locally
Write-Host "Step 1: Creating favicon.ico..." -ForegroundColor Yellow
if (!(Test-Path "$LOCAL_WEB\public\favicon.ico")) {
    Copy-Item "$LOCAL_WEB\public\favicon.svg" "$LOCAL_WEB\public\favicon.ico"
    Write-Host "  Created favicon.ico" -ForegroundColor Green
} else {
    Write-Host "  favicon.ico already exists" -ForegroundColor Green
}
Write-Host ""

# Step 2: Upload favicon
Write-Host "Step 2: Uploading favicon to server..." -ForegroundColor Yellow
Write-Host "  Running: scp -P $PORT $LOCAL_WEB\public\favicon.ico ${SERVER}:${REMOTE_PATH}/public/" -ForegroundColor Gray
scp -P $PORT "$LOCAL_WEB\public\favicon.ico" "${SERVER}:${REMOTE_PATH}/public/"
Write-Host ""

# Step 3: Fix Prisma and Database on server
Write-Host "Step 3: Now you need to SSH to the server and run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy and run these commands ONE BY ONE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh -p $PORT $SERVER" -ForegroundColor White
Write-Host ""
Write-Host "Then on the server, run:" -ForegroundColor Cyan
Write-Host "cd $REMOTE_PATH" -ForegroundColor White
Write-Host "npx prisma generate" -ForegroundColor White
Write-Host "npx prisma db push --accept-data-loss" -ForegroundColor White
Write-Host "rm -rf .next" -ForegroundColor White
Write-Host "NODE_ENV=production npm run build" -ForegroundColor White
Write-Host "pm2 restart dromkok-web" -ForegroundColor White
Write-Host "pm2 save" -ForegroundColor White
Write-Host "exit" -ForegroundColor White
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "After running those commands, test your site:" -ForegroundColor Yellow
Write-Host "  https://dromkok.com" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
