#!/bin/bash

# Deployment script for middleware fixes
# Run this on your PRODUCTION SERVER

echo "=========================================="
echo "Deploying Middleware Fixes"
echo "=========================================="
echo ""

# Navigate to project directory
cd /root/ecommerce-monorepo/web || exit 1

echo "✅ In directory: $(pwd)"
echo ""

# Pull latest changes
echo "📥 Pulling latest code from repository..."
git pull origin production
if [ $? -ne 0 ]; then
  echo "❌ Git pull failed!"
  exit 1
fi
echo "✅ Code updated"
echo ""

# Install dependencies (if package.json changed)
echo "📦 Checking dependencies..."
npm install
echo "✅ Dependencies checked"
echo ""

# Build the application
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi
echo "✅ Build complete"
echo ""

# Restart PM2
echo "🔄 Restarting application with PM2..."
pm2 restart ecommerce-monorepo
if [ $? -ne 0 ]; then
  echo "❌ PM2 restart failed!"
  exit 1
fi
echo "✅ Application restarted"
echo ""

# Wait for app to start
echo "⏳ Waiting for application to start (15 seconds)..."
sleep 15

# Check if app is running
echo "🔍 Checking application status..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
  echo "✅ Application is responding on port 3001"
else
  echo "⚠️  Application may not be ready yet, check manually"
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Visit http://dromkok.com - should redirect to /en/"
echo "2. Check browser console - should have NO MIME errors"
echo "3. Test all 3 languages:"
echo "   - http://dromkok.com/en/"
echo "   - http://dromkok.com/ru/"
echo "   - http://dromkok.com/zh/"
echo ""
echo "Monitor logs with:"
echo "  pm2 logs ecommerce-monorepo"
echo "  tail -f /var/log/nginx/www.dromkok.com_error.log"
echo ""
