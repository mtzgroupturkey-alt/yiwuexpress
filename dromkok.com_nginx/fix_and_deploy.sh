#!/bin/bash
# ==========================================
# Fix and Deploy Nginx Configuration
# ==========================================
# This script will:
# 1. Upload the corrected nginx config to server
# 2. Apply it to fix the port mismatch issue
# 3. Verify the site is working

set -e

# Configuration
SERVER="root@dromkok.com"
NGINX_CONF_LOCAL="./nginx_ssl_config.conf"
NGINX_CONF_REMOTE="/etc/nginx/sites-available/www.dromkok.com"
APP_PORT=3001

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   Fix Nginx Port Mismatch - dromkok.com                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if local config exists
if [ ! -f "$NGINX_CONF_LOCAL" ]; then
    echo "❌ Error: nginx_ssl_config.conf not found"
    echo "Make sure you're running this from the dromkok.com_nginx directory"
    exit 1
fi

# Check if we can connect to server
echo "🔍 Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$SERVER" "echo OK" > /dev/null 2>&1; then
    echo "⚠️  SSH key authentication not set up"
    echo "You'll be prompted for password"
fi
echo ""

# Upload nginx config
echo "📤 Uploading nginx configuration..."
scp "$NGINX_CONF_LOCAL" "$SERVER:/tmp/nginx_ssl_config.conf"
echo "✅ Config uploaded to server"
echo ""

# Apply configuration on server
echo "🔧 Applying configuration on server..."
ssh "$SERVER" bash << 'ENDSSH'
set -e

NGINX_CONF="/etc/nginx/sites-available/www.dromkok.com"
BACKUP_FILE="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

echo "📋 Creating backup: $BACKUP_FILE"
if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" "$BACKUP_FILE"
else
    echo "⚠️  No existing config found - this is a new installation"
fi

echo "📝 Installing new configuration..."
cp /tmp/nginx_ssl_config.conf "$NGINX_CONF"
chmod 644 "$NGINX_CONF"

echo "🧪 Testing nginx configuration..."
if ! nginx -t; then
    echo "❌ Nginx configuration test failed!"
    if [ -f "$BACKUP_FILE" ]; then
        echo "Restoring backup..."
        cp "$BACKUP_FILE" "$NGINX_CONF"
    fi
    exit 1
fi

echo "✅ Nginx configuration test passed"

echo "🔄 Reloading nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""
echo "🔍 Checking if app is running on port 3001..."
if curl -f -s http://localhost:3001 > /dev/null; then
    echo "✅ App is running on port 3001"
else
    echo "⚠️  App doesn't seem to be running on port 3001"
    echo ""
    echo "Checking PM2 status..."
    pm2 status || echo "PM2 not running or no processes"
    echo ""
    echo "Attempting to start/restart app..."
    cd /www/wwwroot/www.dromkok.com/web || {
        echo "❌ Web directory not found at /www/wwwroot/www.dromkok.com/web"
        exit 1
    }
    
    # Try to restart with PM2
    if command -v pm2 > /dev/null; then
        pm2 restart dromkok-web --update-env || {
            echo "Starting new PM2 process..."
            pm2 start server.js --name dromkok-web --env production
        }
        pm2 save
        
        echo "Waiting for app to start..."
        sleep 5
        
        if curl -f -s http://localhost:3001 > /dev/null; then
            echo "✅ App is now running on port 3001"
        else
            echo "❌ App still not responding"
            echo "PM2 logs:"
            pm2 logs dromkok-web --lines 30 --nostream
            exit 1
        fi
    else
        echo "❌ PM2 not found. Please install PM2 or start the app manually"
        exit 1
    fi
fi

echo ""
echo "🌐 Testing HTTPS endpoint..."
if curl -f -I https://www.dromkok.com > /dev/null 2>&1; then
    echo "✅ HTTPS endpoint responding"
else
    echo "⚠️  HTTPS endpoint not responding (may need DNS/firewall configuration)"
fi

ENDSSH

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ Configuration Applied Successfully!                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 What was done:"
echo "   • Nginx config updated (port 3000 → 3001)"
echo "   • Backup created on server"
echo "   • Nginx reloaded"
echo "   • App verified on port 3001"
echo ""
echo "🧪 Final verification steps:"
echo "   1. Clear your browser cache (Ctrl+Shift+Del)"
echo "   2. Visit https://www.dromkok.com"
echo "   3. Check browser console for errors"
echo ""
echo "If you still see issues:"
echo "   • Try incognito/private browsing"
echo "   • Check server logs:"
echo "       ssh $SERVER 'tail -f /var/log/nginx/www.dromkok.com_error.log'"
echo "   • Check PM2 logs:"
echo "       ssh $SERVER 'pm2 logs dromkok-web'"
echo ""
