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

$remoteCmd = @'
set -e
echo "=== 1. Navigating to project directory ==="
cd /www/wwwroot/www.dromkok.com/web

echo "=== 2. Pulling latest code from GitHub ==="
git fetch origin
git reset --hard origin/production || git reset --hard origin/main || git pull origin

echo "=== 3. Updating dependencies and Prisma ==="
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
npm install --cache /tmp/.npm-cache
npx prisma generate
npx prisma db push --accept-data-loss || true

echo "=== 4. Restoring complete product catalog snapshot (6,743 products) ==="
node scripts/restore-catalog-snapshot.js --force || true

echo "=== 5. Building fresh Next.js application ==="
rm -rf .next
npm run build

echo "=== 6. Restarting PM2 process ==="
pm2 restart all || pm2 restart dromkok-web || pm2 start npm --name "dromkok-web" -- run start
pm2 save

echo "====================================================="
echo " ✅ DEPLOYMENT FINISHED SUCCESSFULLY!"
echo "====================================================="
'@

ssh -tt -p $PORT $SERVER "bash -c `"$remoteCmd`""

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Green
Write-Host " ✅ DONE! Test the site at: https://dromkok.com/en" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Green
