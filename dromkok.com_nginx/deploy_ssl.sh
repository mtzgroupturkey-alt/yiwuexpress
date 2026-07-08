#!/bin/bash
# ==========================================
# SSL Deployment Script for www.dromkok.com
# ==========================================
# Run this script on your Ubuntu server to deploy SSL
# Usage: sudo bash deploy_ssl.sh

set -e  # Exit on error

echo "🔒 Starting SSL Deployment for www.dromkok.com"
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use: sudo)"
   exit 1
fi

# Step 1: Create SSL directory
echo ""
echo "📁 Step 1: Creating SSL certificate directory..."
mkdir -p /etc/nginx/ssl/dromkok.com
echo "✅ Directory created"

# Step 2: Check if certificate files exist
echo ""
echo "📋 Step 2: Checking certificate files..."
CERT_FILES=(
    "dromkok.com_bundle.crt"
    "dromkok.com.key"
    "dromkok.com_bundle.pem"
)

for file in "${CERT_FILES[@]}"; do
    if [ ! -f "/etc/nginx/ssl/dromkok.com/$file" ]; then
        echo "❌ Missing: $file"
        echo "   Please upload all certificate files to /etc/nginx/ssl/dromkok.com/"
        exit 1
    fi
    echo "✅ Found: $file"
done

# Step 3: Set permissions
echo ""
echo "🔐 Step 3: Setting file permissions..."
chmod 644 /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt
chmod 644 /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.pem
chmod 600 /etc/nginx/ssl/dromkok.com/dromkok.com.key
echo "✅ Permissions set"

# Step 4: Set ownership
echo ""
echo "👤 Step 4: Setting file ownership..."
chown www-data:www-data /etc/nginx/ssl/dromkok.com/*
echo "✅ Ownership set to www-data:www-data"

# Step 5: Check nginx installation
echo ""
echo "🌐 Step 5: Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx not found. Installing..."
    apt-get update
    apt-get install -y nginx
else
    echo "✅ Nginx is installed"
fi

# Step 6: Check if nginx sites-available directory exists
echo ""
echo "📂 Step 6: Checking Nginx directories..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
echo "✅ Directories verified"

# Step 7: Create symbolic link if not exists
echo ""
echo "🔗 Step 7: Creating Nginx site configuration..."
if [ -f "/etc/nginx/sites-available/dromkok.com" ]; then
    echo "⚠️  Config already exists. Backing up..."
    cp /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-available/dromkok.com.backup
fi

# Step 8: Note about nginx config
echo ""
echo "⚠️  Step 8: Nginx Configuration"
echo "   You need to:"
echo "   1. Create /etc/nginx/sites-available/dromkok.com"
echo "   2. Use the configuration from: nginx_ssl_config.conf"
echo "   3. Or copy the provided nginx_ssl_config.conf"
echo ""
echo "   To enable the site after creating config:"
echo "   $ ln -s /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-enabled/"

# Step 9: Test Nginx configuration (if config exists)
echo ""
echo "🧪 Step 9: Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Configuration test passed"
else
    echo "❌ Configuration test failed"
    echo "   Please check your nginx configuration"
    exit 1
fi

# Step 10: Reload Nginx
echo ""
echo "♻️  Step 10: Reloading Nginx..."
if systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "⚠️  Failed to reload Nginx"
    echo "   Check error logs: tail -f /var/log/nginx/error.log"
    exit 1
fi

# Step 11: Check Nginx status
echo ""
echo "📊 Step 11: Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    echo "   Starting Nginx..."
    systemctl start nginx
fi

# Step 12: Display certificate information
echo ""
echo "📜 Step 12: Certificate Information"
echo "===================================="
openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -dates -subject -issuer

# Step 13: Verify certificate chain
echo ""
echo "🔍 Step 13: Verifying certificate chain..."
if openssl verify -CAfile /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt \
                 /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt 2>/dev/null; then
    echo "✅ Certificate chain verified"
else
    echo "⚠️  Could not verify certificate chain automatically"
fi

# Step 14: Setup log rotation
echo ""
echo "📝 Step 14: Setting up log rotation..."
cat > /etc/logrotate.d/dromkok-nginx << EOF
/var/log/nginx/www.dromkok.com_*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \`cat /var/run/nginx.pid\`
        fi
    endscript
}
EOF
echo "✅ Log rotation configured"

# Final Summary
echo ""
echo "=================================================="
echo "✨ SSL Deployment Complete!"
echo "=================================================="
echo ""
echo "📋 Summary:"
echo "  ✅ SSL certificates installed"
echo "  ✅ Permissions configured"
echo "  ✅ Nginx updated and reloaded"
echo "  ✅ Log rotation enabled"
echo ""
echo "🧪 Next Steps - Test your deployment:"
echo "  1. Visit: https://www.dromkok.com"
echo "  2. Check SSL: https://www.sslshopper.com/ssl-checker.html"
echo "  3. Check Labs: https://www.ssllabs.com/ssltest/"
echo ""
echo "📊 Monitoring:"
echo "  - Access log: tail -f /var/log/nginx/www.dromkok.com_access.log"
echo "  - Error log:  tail -f /var/log/nginx/www.dromkok.com_error.log"
echo ""
echo "🔐 Certificate Expiration:"
echo "  Check: echo \$(( ( \$(date -d \"\$(openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -enddate | cut -d= -f 2)\" +%s) - \$(date +%s) ) / 86400 )) days"
echo ""
echo "Need help? Check: SSL_DEPLOYMENT_GUIDE.md"
