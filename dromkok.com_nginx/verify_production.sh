#!/bin/bash
# ==========================================
# Production Server Verification Script
# ==========================================
# Run this from your local machine to diagnose
# the production server issues

echo "🔍 Verifying dromkok.com Production Server"
echo "==========================================="
echo ""

DOMAIN="dromkok.com"
DOMAIN_WWW="www.dromkok.com"

# Test 1: DNS Resolution
echo "1️⃣  Testing DNS Resolution..."
if host "$DOMAIN" > /dev/null 2>&1; then
    IP=$(host "$DOMAIN" | grep "has address" | awk '{print $4}')
    echo "✅ DNS resolves: $DOMAIN → $IP"
else
    echo "❌ DNS resolution failed for $DOMAIN"
fi
echo ""

# Test 2: HTTPS Connection
echo "2️⃣  Testing HTTPS Connection..."
if curl -sSf -I "https://$DOMAIN_WWW" > /dev/null 2>&1; then
    STATUS=$(curl -sSI "https://$DOMAIN_WWW" | head -n 1)
    echo "✅ HTTPS connection successful"
    echo "   Status: $STATUS"
else
    echo "❌ HTTPS connection failed"
    echo "   Try: curl -I https://$DOMAIN_WWW"
fi
echo ""

# Test 3: Check for Static Asset MIME Types
echo "3️⃣  Testing Static Asset MIME Types..."
ASSET_URL="https://$DOMAIN_WWW/_next/static/css/d4cee35c6f61a1c2.css"
CONTENT_TYPE=$(curl -sSI "$ASSET_URL" 2>/dev/null | grep -i "content-type:" || echo "Failed")

if echo "$CONTENT_TYPE" | grep -q "text/css"; then
    echo "✅ CSS assets serving correctly"
    echo "   $CONTENT_TYPE"
elif echo "$CONTENT_TYPE" | grep -q "text/html"; then
    echo "❌ CSS assets returning HTML (404 error)"
    echo "   $CONTENT_TYPE"
    echo "   → This confirms the nginx port mismatch issue"
else
    echo "⚠️  Could not fetch asset"
    echo "   $CONTENT_TYPE"
fi
echo ""

# Test 4: Check Homepage Content
echo "4️⃣  Testing Homepage Content..."
HOMEPAGE=$(curl -sS "https://$DOMAIN_WWW" | head -n 30)
if echo "$HOMEPAGE" | grep -q "_next"; then
    echo "✅ Homepage contains Next.js assets"
else
    echo "⚠️  Homepage doesn't contain expected Next.js content"
fi
echo ""

# Test 5: Check API Endpoint
echo "5️⃣  Testing API Endpoint..."
API_URL="https://$DOMAIN_WWW/api/health"
API_STATUS=$(curl -sSI "$API_URL" 2>/dev/null | head -n 1 || echo "Failed")
echo "   API Status: $API_STATUS"
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""
echo "To fix the MIME type / 404 errors:"
echo "1. SSH to your server: ssh root@$DOMAIN"
echo "2. Run: sudo nano /etc/nginx/sites-available/www.dromkok.com"
echo "3. Change all 'localhost:3000' to 'localhost:3001'"
echo "4. Run: sudo nginx -t"
echo "5. Run: sudo systemctl reload nginx"
echo ""
echo "Or use the automated fix:"
echo "  scp dromkok.com_nginx/update_nginx_port.sh root@$DOMAIN:/tmp/"
echo "  ssh root@$DOMAIN 'sudo bash /tmp/update_nginx_port.sh'"
echo ""

# Check if we can SSH (optional)
echo "6️⃣  Testing SSH Access (optional)..."
if ssh -q -o ConnectTimeout=5 -o BatchMode=yes "root@$DOMAIN" exit 2>/dev/null; then
    echo "✅ SSH access confirmed"
else
    echo "⚠️  SSH key-based auth not configured (password prompt required)"
fi
echo ""

echo "✅ Verification complete!"
