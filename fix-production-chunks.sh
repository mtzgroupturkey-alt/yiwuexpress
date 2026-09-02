#!/bin/bash
# ==============================================================================
# Fix Next.js Static Chunk Loading & Nginx 400 Bad Request on Production Server
# Run this on your Ubuntu production server: bash fix-production-chunks.sh
# ==============================================================================

set -e

echo "======================================================="
echo " 🚀 Starting Production Static Chunk & Nginx Fix"
echo "======================================================="

# 1. Locate Web App Directory
if [ -d "/root/ecommerce-monorepo/web" ]; then
    APP_DIR="/root/ecommerce-monorepo/web"
elif [ -d "/var/www/ecommerce-monorepo/web" ]; then
    APP_DIR="/var/www/ecommerce-monorepo/web"
elif [ -d "/www/wwwroot/www.dromkok.com/web" ]; then
    APP_DIR="/www/wwwroot/www.dromkok.com/web"
else
    APP_DIR="$(pwd)"
fi

echo "📂 Application Directory: $APP_DIR"
cd "$APP_DIR"

# 2. Pull Latest Code
echo "📥 Pulling latest git updates..."
git pull || echo "⚠️ Git pull failed or already up to date"

# 3. Clean Old Build Cache to eliminate Chunk Mismatches
echo "🧹 Cleaning stale .next build cache..."
rm -rf .next

# 4. Rebuild Next.js Production Bundle
echo "🔨 Building fresh Next.js application..."
npm run build

# 5. Restart PM2 Process to Load Fresh Chunks in Memory
echo "🔄 Restarting PM2 process..."
pm2 restart all || pm2 restart ecommerce-monorepo || pm2 restart web || pm2 start npm --name "ecommerce-monorepo" -- run start

# 6. Update Nginx Configuration
echo "⚙️ Updating Nginx static block configuration..."
NGINX_CONF="/etc/nginx/sites-available/www.dromkok.com"
if [ ! -f "$NGINX_CONF" ]; then
    NGINX_CONF="/etc/nginx/sites-available/dromkok.com"
fi

if [ -f "$NGINX_CONF" ]; then
    echo "📋 Backing up existing Nginx config..."
    cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 7. Test and Reload Nginx
echo "🔍 Testing Nginx configuration..."
nginx -t

echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo ""
echo "======================================================="
echo " ✅ Fix Applied Successfully!"
echo " Test with: curl -I https://dromkok.com/en"
echo "======================================================="
