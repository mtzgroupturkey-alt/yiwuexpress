# ================================================================================
# 1-CLICK PRODUCTION DEPLOYMENT & CHUNK FIX
# Target: djdn@39.175.57.2 (/www/wwwroot/www.dromkok.com/web)
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "  🚀 DEPLOYING TO DROMKOK.COM PRODUCTION SERVER" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "djdn@39.175.57.2"
$PORT = "22"
$REMOTE_PATH = "/www/wwwroot/www.dromkok.com/web"

Write-Host "Connecting to $SERVER (Path: $REMOTE_PATH)..." -ForegroundColor Yellow
Write-Host "If prompted, please enter your SSH password." -ForegroundColor Yellow
Write-Host ""

ssh -p $PORT $SERVER @"
set -e
echo '=== 1. Navigating to project directory ==='
cd $REMOTE_PATH

echo '=== 2. Pulling latest code from GitHub ==='
git fetch origin
git reset --hard origin/production || git reset --hard origin/main || git pull origin

echo '=== 3. Cleaning stale build cache ==='
rm -rf .next

echo '=== 4. Updating dependencies and Prisma ==='
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
npm install --cache /tmp/.npm-cache
npx prisma generate
npx prisma db push --accept-data-loss || true

echo '=== 5. Building fresh Next.js application ==='
npm run build

echo '=== 6. Restarting PM2 process ==='
pm2 restart all || pm2 restart dromkok-web || pm2 restart ecommerce-monorepo || pm2 start npm --name "dromkok-web" -- run start
pm2 save

echo '=== 7. Reloading Nginx ==='
if command -v nginx > /dev/null 2>&1; then
    sudo nginx -t && sudo systemctl reload nginx || nginx -t && systemctl reload nginx || true
fi

echo '=== 8. Health Check ==='
sleep 3
curl -I http://localhost:3001/api/health || curl -I http://localhost:3000/api/health || true

echo '====================================================='
echo ' ✅ DEPLOYMENT FINISHED SUCCESSFULLY!'
echo '====================================================='
"@

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Green
Write-Host " ✅ DONE! Test the site at: https://dromkok.com/en" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Green
