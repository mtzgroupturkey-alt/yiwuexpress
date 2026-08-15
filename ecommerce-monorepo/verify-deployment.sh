#!/bin/bash
# ==========================================
# Deployment Verification Script
# ==========================================
# Run this after deployment to verify everything works

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   Deployment Verification - dromkok.com                  ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

DOMAIN="www.dromkok.com"
LOCAL_PORT="3001"
ERRORS=0

# Function to check and report
check() {
    local name="$1"
    local command="$2"
    
    echo -n "🔍 Checking $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        ((ERRORS++))
        return 1
    fi
}

# Check 1: PM2 Status
echo "1️⃣  PM2 Application Status"
echo "───────────────────────────"
if pm2 status | grep -q "dromkok-web.*online"; then
    echo "✅ App is online"
    pm2 list | grep dromkok-web
else
    echo "❌ App is not running or not online"
    pm2 status
    ((ERRORS++))
fi
echo ""

# Check 2: Local Port
echo "2️⃣  Local Port $LOCAL_PORT"
echo "───────────────────────────"
if curl -f -s http://localhost:$LOCAL_PORT > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$LOCAL_PORT)
    echo "✅ Port $LOCAL_PORT responding (HTTP $HTTP_CODE)"
else
    echo "❌ Port $LOCAL_PORT not responding"
    echo "Checking what's on the port:"
    netstat -tlnp | grep $LOCAL_PORT || echo "Nothing listening"
    ((ERRORS++))
fi
echo ""

# Check 3: Health Endpoint
echo "3️⃣  Health Check Endpoint"
echo "───────────────────────────"
HEALTH_RESPONSE=$(curl -s http://localhost:$LOCAL_PORT/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ Health check passed"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "$HEALTH_RESPONSE"
    ((ERRORS++))
fi
echo ""

# Check 4: HTTPS Endpoint
echo "4️⃣  HTTPS Endpoint"
echo "───────────────────────────"
if curl -f -s -I https://$DOMAIN > /dev/null 2>&1; then
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
    echo "✅ HTTPS endpoint responding (HTTP $HTTPS_CODE)"
else
    echo "❌ HTTPS endpoint not responding"
    echo "Trying to get more info:"
    curl -I https://$DOMAIN || true
    ((ERRORS++))
fi
echo ""

# Check 5: Static Assets
echo "5️⃣  Static Assets (.next folder)"
echo "───────────────────────────"
if [ -d ".next" ] && [ -d ".next/static" ]; then
    SIZE=$(du -sh .next/ | cut -f1)
    echo "✅ .next folder exists (size: $SIZE)"
    ls -lh .next/ | head -10
else
    echo "❌ .next folder missing or incomplete"
    ls -la .next/ 2>&1 || echo ".next does not exist"
    ((ERRORS++))
fi
echo ""

# Check 6: Environment Variables
echo "6️⃣  Environment Configuration"
echo "───────────────────────────"
if [ -f ".env.production" ]; then
    echo "✅ .env.production exists"
    echo "Required variables:"
    for var in PORT DATABASE_URL JWT_SECRET NEXT_PUBLIC_API_URL; do
        if grep -q "^${var}=" .env.production 2>/dev/null; then
            echo "  ✓ $var"
        else
            echo "  ✗ $var (MISSING)"
            ((ERRORS++))
        fi
    done
else
    echo "❌ .env.production not found"
    ((ERRORS++))
fi
echo ""

# Check 7: Nginx Configuration
echo "7️⃣  Nginx Configuration"
echo "───────────────────────────"
if sudo nginx -t > /dev/null 2>&1; then
    echo "✅ Nginx configuration is valid"
    
    # Check proxy port
    if sudo cat /etc/nginx/sites-available/www.dromkok.com | grep -q "proxy_pass.*localhost:3001"; then
        echo "✅ Nginx proxying to correct port (3001)"
    else
        echo "⚠️  Nginx may be proxying to wrong port"
        sudo cat /etc/nginx/sites-available/www.dromkok.com | grep proxy_pass | head -3
        ((ERRORS++))
    fi
else
    echo "❌ Nginx configuration has errors"
    sudo nginx -t
    ((ERRORS++))
fi
echo ""

# Check 8: Database Connection
echo "8️⃣  Database Connection"
echo "───────────────────────────"
if npx prisma db pull --force > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Check DATABASE_URL in .env.production"
    ((ERRORS++))
fi
echo ""

# Check 9: Disk Space
echo "9️⃣  Disk Space"
echo "───────────────────────────"
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✅ Disk space OK (${DISK_USAGE}% used)"
else
    echo "⚠️  Disk space running low (${DISK_USAGE}% used)"
    df -h .
fi
echo ""

# Check 10: Recent Logs
echo "🔟 Recent PM2 Logs (last 10 lines)"
echo "───────────────────────────"
pm2 logs dromkok-web --lines 10 --nostream || echo "Could not fetch logs"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Deployment is healthy."
    echo ""
    echo "🌐 Site: https://$DOMAIN"
    echo "📊 Health: http://localhost:$LOCAL_PORT/api/health"
    echo ""
    exit 0
else
    echo "❌ Found $ERRORS issue(s) that need attention."
    echo ""
    echo "📖 See DEPLOYMENT_TROUBLESHOOTING.md for solutions"
    echo ""
    echo "Quick commands:"
    echo "  pm2 logs dromkok-web          # View application logs"
    echo "  pm2 restart dromkok-web       # Restart application"
    echo "  sudo systemctl reload nginx   # Reload nginx"
    echo ""
    exit 1
fi
