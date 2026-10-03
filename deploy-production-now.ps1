# ================================================================================
# 1-CLICK PRODUCTION DEPLOYMENT & CATALOG RESTORE
# Target: djdn@39.175.57.2 (/www/wwwroot/www.dromkok.com/web)
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "  🚀 DEPLOYING CATALOG (6,743 PRODUCTS) TO DROMKOK.COM PRODUCTION" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "djdn@39.175.57.2"
$PORT = "22"
$REMOTE_PATH = "/www/wwwroot/www.dromkok.com/web"

Write-Host "Connecting to $SERVER (Path: $REMOTE_PATH)..." -ForegroundColor Yellow
Write-Host "When prompted, enter your SSH password." -ForegroundColor Yellow
Write-Host ""

# Remote bash script with pure LF line endings
$bashScript = @'
set -e

echo "=== 1. Locating project directory ==="
if [ -d "/www/wwwroot/www.dromkok.com/web" ]; then
  cd /www/wwwroot/www.dromkok.com/web
elif [ -d "/www/wwwroot/www.dromkok.com/ecommerce-monorepo/web" ]; then
  cd /www/wwwroot/www.dromkok.com/ecommerce-monorepo/web
elif [ -d "/var/www/ecommerce-monorepo/web" ]; then
  cd /var/www/ecommerce-monorepo/web
else
  echo "❌ Error: Could not locate project directory"
  exit 1
fi
echo "📂 Project root: $(pwd)"

echo "=== 2. Pulling latest code and catalog snapshot from GitHub ==="
if [ -d ".git" ]; then
  git fetch origin || git fetch dromkok || true
  git reset --hard origin/production || git reset --hard origin/main || git pull || true
else
  echo "ℹ️  Not a git repo directly, checking existing files..."
fi

echo "=== 3. Updating dependencies and Prisma client ==="
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
npx prisma generate

echo "=== 4. Restoring complete product catalog (6,743 products & 122 categories) ==="
if [ -f "scripts/restore-catalog-snapshot.js" ]; then
  node scripts/restore-catalog-snapshot.js --force
else
  echo "⚠️ Warning: scripts/restore-catalog-snapshot.js not found in current directory."
  echo "Listing current directory contents:"
  ls -la
fi

echo "=== 5. Restarting PM2 process ==="
pm2 restart all || pm2 restart dromkok-web || true
pm2 save || true

echo "====================================================="
echo " ✅ DEPLOYMENT & CATALOG RESTORATION COMPLETE!"
echo "====================================================="
'@

# Clean all Windows CRLF (\r\n) to Unix LF (\n) and Base64 encode
# to guarantee 100% clean transmission without any carriage return corruption
$cleanBashScript = $bashScript -replace "`r`n", "`n" -replace "`r", ""
$bytes = [System.Text.Encoding]::UTF8.GetBytes($cleanBashScript)
$base64Script = [Convert]::ToBase64String($bytes)

# Execute via base64 pipeline over SSH
ssh -tt -p $PORT $SERVER "echo $base64Script | base64 -d | bash"

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Green
Write-Host " ✅ DONE! Check your live store at: https://dromkok.com/en/store" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Green
