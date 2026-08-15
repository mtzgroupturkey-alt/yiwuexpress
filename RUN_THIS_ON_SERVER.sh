#!/bin/bash

# Complete deployment script - Run this on your PRODUCTION SERVER
# This will fix http://dromkok.com redirect issue

echo "=========================================="
echo "Deploying dromkok.com redirect fix"
echo "=========================================="
echo ""

# Step 1: Deploy code
echo "Step 1: Updating code..."
cd /root/ecommerce-monorepo/web
git pull origin production
echo "✅ Code updated"
echo ""

# Step 2: Build
echo "Step 2: Building application..."
npm run build
echo "✅ Build complete"
echo ""

# Step 3: Restart PM2
echo "Step 3: Restarting application..."
pm2 restart ecommerce-monorepo
sleep 10
echo "✅ Application restarted"
echo ""

# Step 4: Add nginx redirect (if not already there)
echo "Step 4: Configuring nginx redirect..."
if grep -q "location = /" /etc/nginx/sites-available/dromkok.com; then
    echo "⚠️  Nginx redirect already exists"
else
    sudo sed -i '/# Proxy Configuration for Next.js Application/i \    # Root Path Redirect\n    location = / {\n        return 307 /en/;\n    }\n' /etc/nginx/sites-available/dromkok.com
    echo "✅ Nginx redirect added"
fi
echo ""

# Step 5: Test nginx
echo "Step 5: Testing nginx configuration..."
sudo nginx -t
echo ""

# Step 6: Reload nginx
echo "Step 6: Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# Step 7: Test redirect
echo "Step 7: Testing redirect..."
curl -I http://dromkok.com/ | grep -E "(HTTP|Location)"
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Test in browser: http://dromkok.com"
echo "Should redirect to: http://dromkok.com/en/"
echo ""
