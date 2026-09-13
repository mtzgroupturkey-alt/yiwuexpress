#!/bin/bash

# Test SSH Connection to Dromkok Server
# Quick script to verify you can connect before running full migration

SERVER="39.175.57.2"
USER="djdn"
PORT=22

echo "================================================="
echo "🔐 Testing SSH Connection to Dromkok Server"
echo "================================================="
echo ""
echo "Server: $USER@$SERVER:$PORT"
echo ""

# Check if ssh command exists
echo "1️⃣  Checking SSH client..."
if command -v ssh > /dev/null 2>&1; then
    echo "✅ SSH client found"
    ssh -V 2>&1 | head -1
else
    echo "❌ SSH client not found!"
    echo ""
    echo "Please install Git for Windows (includes SSH)"
    echo "Download: https://git-scm.com/download/win"
    exit 1
fi

# Test basic connectivity
echo ""
echo "2️⃣  Testing network connectivity..."
echo "   Pinging $SERVER..."

if ping -c 2 -W 5 "$SERVER" > /dev/null 2>&1; then
    echo "✅ Server is reachable"
else
    echo "⚠️  Ping failed (may be blocked by firewall)"
    echo "   This is normal - firewall may block ICMP ping"
fi

# Test SSH connection
echo ""
echo "3️⃣  Testing SSH connection..."
echo "   Attempting to connect to $USER@$SERVER..."
echo ""
echo "================================================="
echo "You will be prompted for your SSH password"
echo "================================================="
echo ""

# Create test command
TEST_COMMAND='
echo ""
echo "✅ SSH Connection Successful!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Server Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Hostname:     $(hostname)"
echo "   OS:           $(cat /etc/os-release | grep PRETTY_NAME | cut -d\" -f2)"
echo "   Current User: $(whoami)"
echo "   Current Dir:  $(pwd)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 Project Directory Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "/www/wwwroot/www.dromkok.com/web" ]; then
    echo "   ✅ Project directory exists"
    echo "   Path: /www/wwwroot/www.dromkok.com/web"
    echo "   Size: $(du -sh /www/wwwroot/www.dromkok.com/web 2>/dev/null | cut -f1)"
else
    echo "   ⚠️  Project directory not found"
    echo "   Expected: /www/wwwroot/www.dromkok.com/web"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Server Tools Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "   Node.js:      "
if command -v node > /dev/null; then echo "$(node -v) ✅"; else echo "Not found ❌"; fi
echo -n "   npm:          "
if command -v npm > /dev/null; then echo "$(npm -v) ✅"; else echo "Not found ❌"; fi
echo -n "   PM2:          "
if command -v pm2 > /dev/null; then echo "$(pm2 -v) ✅"; else echo "Not found ❌"; fi
echo -n "   Nginx:        "
if command -v nginx > /dev/null; then echo "$(nginx -v 2>&1 | cut -d/ -f2) ✅"; else echo "Not found ❌"; fi
echo -n "   MySQL:        "
if command -v mysql > /dev/null; then echo "$(mysql -V | cut -d\" \" -f6) ✅"; else echo "Not found ❌"; fi
echo -n "   Git:          "
if command -v git > /dev/null; then echo "$(git --version | cut -d\" \" -f3) ✅"; else echo "Not found ❌"; fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Disk Space:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h / | tail -1 | awk '"'"'{print "   Total: " $2 "   Used: " $3 " (" $5 ")   Available: " $4}'"'"'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PM2 Process Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v pm2 > /dev/null; then
    pm2 list 2>/dev/null || echo "   No PM2 processes running"
else
    echo "   PM2 not installed"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Database Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v mysql > /dev/null; then
    echo -n "   MySQL Service: "
    if systemctl is-active mysql > /dev/null 2>&1 || systemctl is-active mysqld > /dev/null 2>&1; then
        echo "Running ✅"
    else
        echo "Not running ⚠️"
    fi
else
    echo "   MySQL not found"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Site Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|301\|302"; then
    echo "   ✅ App responding on port 3001"
else
    echo "   ⚠️  App not responding on port 3001"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SSH Connection Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
'

# Execute the test
ssh -p $PORT "${USER}@${SERVER}" "$TEST_COMMAND"
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "================================================="
    echo "✅ SSH Connection Test PASSED!"
    echo "================================================="
    echo ""
    echo "You are ready to run the migration:"
    echo "  PowerShell: .\deploy-to-dromkok.ps1"
    echo "  Git Bash:   ./migrate-localhost-to-production.sh"
    echo ""
else
    echo "================================================="
    echo "❌ SSH Connection Test Failed"
    echo "================================================="
    echo ""
    echo "Possible issues:"
    echo "  1. Wrong password"
    echo "  2. Server is down"
    echo "  3. Firewall blocking SSH (port 22)"
    echo "  4. Network connectivity issue"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Manual SSH Test Command:"
echo "  ssh djdn@39.175.57.2 -p 22"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
