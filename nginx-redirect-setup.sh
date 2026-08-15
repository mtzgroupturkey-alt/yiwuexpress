#!/bin/bash

# Simple Nginx Redirect Setup for dromkok.com → dromkok.com/en
# Run this script on your PRODUCTION SERVER

echo "=========================================="
echo "Setting up Nginx redirect: / → /en/"
echo "=========================================="
echo ""

# Backup current config
echo "📁 Backing up current nginx config..."
sudo cp /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-available/dromkok.com.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"
echo ""

# Check if redirect already exists
if grep -q "location = /" /etc/nginx/sites-available/dromkok.com; then
    echo "⚠️  Root location block already exists. Please add manually."
    echo ""
    echo "Add this BEFORE the main 'location /' block:"
    echo ""
    echo "    # Root redirect to /en/"
    echo "    location = / {"
    echo "        return 307 /en/;"
    echo "    }"
    echo ""
    exit 0
fi

# Find the line with "location / {" and insert the redirect before it
echo "📝 Adding redirect rule to nginx config..."

sudo sed -i '/# Proxy Configuration for Next.js Application/a \
    # Root redirect to /en/\
    location = / {\
        return 307 /en/;\
    }\
' /etc/nginx/sites-available/dromkok.com

echo "✅ Redirect rule added"
echo ""

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    echo ""
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    echo ""
    
    echo "=========================================="
    echo "✅ SUCCESS! Redirect is active"
    echo "=========================================="
    echo ""
    echo "Test it:"
    echo "  curl -I http://dromkok.com/"
    echo ""
    echo "Expected output:"
    echo "  HTTP/1.1 307 Temporary Redirect"
    echo "  Location: /en/"
    echo ""
    
else
    echo "❌ Nginx configuration test failed!"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/dromkok.com.backup.* /etc/nginx/sites-available/dromkok.com
    echo "Backup restored. Please check the configuration manually."
    exit 1
fi
