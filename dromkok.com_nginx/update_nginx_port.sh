#!/bin/bash
# ==========================================
# Update Nginx Configuration - Fix Port Mismatch
# ==========================================
# This script fixes the proxy_pass port from 3000 to 3001
# to match the production server configuration

set -e

echo "🔧 Nginx Port Configuration Update"
echo "===================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script requires sudo/root privileges"
    echo "Please run with: sudo bash update_nginx_port.sh"
    exit 1
fi

# Backup current nginx configuration
NGINX_CONF="/etc/nginx/sites-available/www.dromkok.com"
BACKUP_FILE="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

if [ -f "$NGINX_CONF" ]; then
    echo "📋 Creating backup: $BACKUP_FILE"
    cp "$NGINX_CONF" "$BACKUP_FILE"
else
    echo "❌ Error: Nginx config not found at $NGINX_CONF"
    echo "Please check your nginx configuration path"
    exit 1
fi

# Update port from 3000 to 3001
echo "🔄 Updating proxy_pass port from 3000 to 3001..."
sed -i 's|proxy_pass http://localhost:3000|proxy_pass http://localhost:3001|g' "$NGINX_CONF"

# Verify the changes
if grep -q "proxy_pass http://localhost:3001" "$NGINX_CONF"; then
    echo "✅ Configuration updated successfully"
else
    echo "❌ Error: Configuration update failed"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONF"
    exit 1
fi

# Test nginx configuration
echo ""
echo "🧪 Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration test passed"
else
    echo "❌ Nginx configuration test failed"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONF"
    exit 1
fi

# Reload nginx
echo ""
echo "🔄 Reloading nginx..."
if systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx reload failed"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONF"
    systemctl reload nginx
    exit 1
fi

# Verify the application is running
echo ""
echo "🔍 Checking if application is running on port 3001..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Application is responding on port 3001"
else
    echo "⚠️  Warning: Application doesn't seem to be responding on port 3001"
    echo "Please ensure your Node.js application is running:"
    echo "  cd /www/wwwroot/www.dromkok.com/web"
    echo "  pm2 status"
fi

echo ""
echo "✅ Configuration update complete!"
echo ""
echo "📝 Summary:"
echo "  - Backup created: $BACKUP_FILE"
echo "  - Proxy port changed: 3000 → 3001"
echo "  - Nginx reloaded successfully"
echo ""
echo "🌐 Your site should now be working at: https://www.dromkok.com"
echo ""
echo "If you still see issues, try:"
echo "  1. Clear browser cache (Ctrl+Shift+Del)"
echo "  2. Check PM2 status: pm2 status"
echo "  3. Check nginx logs: tail -f /var/log/nginx/www.dromkok.com_error.log"
