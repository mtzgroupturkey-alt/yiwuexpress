#!/bin/bash
set -e

echo "================================================="
echo "🚀 Manual Production Deployment Script"
echo "================================================="

# Configuration
REPO_URL="https://github.com/mtzgroupturkey-alt/dromkok.git"
BRANCH="production"

# 1. Detect server path
if [ -d "/www/wwwroot/www.dromkok.com/web" ]; then
  TARGET_DIR="/www/wwwroot/www.dromkok.com/web"
elif [ -d "/www/wwwroot/www.dromkok.com/ecommerce-monorepo/web" ]; then
  TARGET_DIR="/www/wwwroot/www.dromkok.com/ecommerce-monorepo/web"
elif [ -d "/root/ecommerce-monorepo/web" ]; then
  TARGET_DIR="/root/ecommerce-monorepo/web"
elif [ -d "/var/www/ecommerce-monorepo/web" ]; then
  TARGET_DIR="/var/www/ecommerce-monorepo/web"
else
  TARGET_DIR="/www/wwwroot/www.dromkok.com"
fi

echo "📂 Target directory: $TARGET_DIR"
cd "$TARGET_DIR"

# 2. Fix git TLS issues
echo "🔧 Configuring git for TLS compatibility..."
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
git config --global http.sslVerify true

# Optional: Use libcurl instead of GnuTLS if available
if command -v git-remote-https > /dev/null 2>&1; then
  git config --global http.sslBackend openssl || true
fi

# 3. Update code from GitHub with retry logic
echo "📥 Fetching and syncing git branch..."

max_retries=5
retry_count=0
success=false

while [ $retry_count -lt $max_retries ] && [ "$success" = false ]; do
  echo "Attempt $((retry_count + 1)) of $max_retries..."
  
  # Try different fetch strategies
  if git fetch origin --depth=1 2>/dev/null; then
    success=true
    echo "✅ Git fetch succeeded"
  elif git fetch origin 2>/dev/null; then
    success=true
    echo "✅ Git fetch succeeded (full history)"
  elif git -c http.version=HTTP/1.1 fetch origin 2>/dev/null; then
    success=true
    echo "✅ Git fetch succeeded (HTTP/1.1)"
  else
    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
      echo "⚠️ Fetch failed, retrying in 10 seconds..."
      sleep 10
    fi
  fi
done

if [ "$success" = false ]; then
  echo "❌ All fetch attempts failed!"
  echo "🔄 Trying complete re-clone as fallback..."
  
  cd ..
  BACKUP_DIR="${TARGET_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
  echo "📦 Backing up current directory to $BACKUP_DIR"
  mv "$TARGET_DIR" "$BACKUP_DIR"
  
  # Clone with retry
  clone_success=false
  for i in 1 2 3; do
    echo "Clone attempt $i..."
    if git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$TARGET_DIR" 2>/dev/null || \
       git clone --branch "$BRANCH" "$REPO_URL" "$TARGET_DIR" 2>/dev/null; then
      clone_success=true
      break
    fi
    sleep 10
  done
  
  if [ "$clone_success" = false ]; then
    echo "❌ Clone failed! Restoring backup..."
    mv "$BACKUP_DIR" "$TARGET_DIR"
    exit 1
  fi
  
  cd "$TARGET_DIR"
else
  # Reset to latest
  git reset --hard "origin/$BRANCH" || git reset --hard origin/main || true
fi

# 4. Clean install & database sync
echo "📦 Installing npm dependencies..."
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
npm install --cache /tmp/.npm-cache --production=false

echo "🔧 Prisma Client generation & schema deploy..."
npx prisma generate
npx prisma db push --accept-data-loss || npx prisma migrate deploy || true

# 5. Clean Next.js build
echo "🏗️ Performing clean Next.js production build..."
rm -rf .next
NODE_ENV=production npm run build

# 6. Restart PM2 & Save
echo "🔄 Restarting PM2 process..."
pm2 restart all || pm2 restart dromkok-web || pm2 restart ecommerce-monorepo || pm2 start npm --name "dromkok-web" -- run start
pm2 save

# 7. Verify local server health
echo "⏳ Waiting for service to respond on port 3001..."
sleep 10

health_check_count=0
max_health_checks=6

while [ $health_check_count -lt $max_health_checks ]; do
  if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1 || \
     curl -f -s http://localhost:3001/ > /dev/null 2>&1; then
    echo "✅ Next.js app is healthy on port 3001"
    break
  else
    health_check_count=$((health_check_count + 1))
    echo "⏳ Health check $health_check_count/$max_health_checks..."
    sleep 5
  fi
done

# 8. Reload Nginx if configured
if command -v nginx > /dev/null 2>&1; then
  echo "🔄 Reloading Nginx..."
  nginx -t && systemctl reload nginx || true
fi

echo "================================================="
echo "✅ Production Deployment Complete!"
echo "🌐 Site: https://www.dromkok.com"
echo "================================================="
