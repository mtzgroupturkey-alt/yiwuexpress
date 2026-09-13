#!/bin/bash
echo ""
echo "SSH Connection Successful!"
echo ""
echo "=============================================="
echo "Server Information:"
echo "=============================================="
echo "   Hostname:     $(hostname)"
echo "   OS:           $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2)"
echo "   Current User: $(whoami)"
echo "   Current Dir:  $(pwd)"
echo ""
echo "=============================================="
echo "Project Directory Check:"
echo "=============================================="
if [ -d "/www/wwwroot/www.dromkok.com/web" ]; then
    echo "   Project directory exists"
    echo "   Path: /www/wwwroot/www.dromkok.com/web"
    SIZE=$(du -sh /www/wwwroot/www.dromkok.com/web 2>/dev/null | cut -f1)
    echo "   Size: $SIZE"
else
    echo "   Project directory not found"
    echo "   Expected: /www/wwwroot/www.dromkok.com/web"
fi
echo ""
echo "=============================================="
echo "Server Tools Check:"
echo "=============================================="
echo -n "   Node.js:      "
if command -v node > /dev/null 2>&1; then 
    echo "$(node -v)"
else 
    echo "Not found"
fi

echo -n "   npm:          "
if command -v npm > /dev/null 2>&1; then 
    echo "$(npm -v)"
else 
    echo "Not found"
fi

echo -n "   PM2:          "
if command -v pm2 > /dev/null 2>&1; then 
    echo "$(pm2 -v)"
else 
    echo "Not found"
fi

echo -n "   Nginx:        "
if command -v nginx > /dev/null 2>&1; then 
    echo "$(nginx -v 2>&1 | cut -d'/' -f2)"
else 
    echo "Not found"
fi

echo -n "   PostgreSQL:   "
if [ -f "/www/server/pgsql/bin/psql" ]; then 
    echo "$(/www/server/pgsql/bin/psql --version 2>/dev/null | cut -d' ' -f3)"
else 
    echo "Not found"
fi

echo -n "   Git:          "
if command -v git > /dev/null 2>&1; then 
    echo "$(git --version | cut -d' ' -f3)"
else 
    echo "Not found"
fi

echo ""
echo "=============================================="
echo "Disk Space:"
echo "=============================================="
df -h / 2>/dev/null | tail -1 | awk '{print "   Total: " $2 "   Used: " $3 " (" $5 ")   Available: " $4}'

echo ""
echo "=============================================="
echo "PM2 Process Status:"
echo "=============================================="
if command -v pm2 > /dev/null 2>&1; then
    pm2 list 2>/dev/null || echo "   No PM2 processes running"
else
    echo "   PM2 not installed"
fi

echo ""
echo "=============================================="
echo "Database Check:"
echo "=============================================="
if [ -f "/www/server/pgsql/bin/psql" ]; then
    echo "   PostgreSQL installed: YES"
    echo -n "   Database 'ecommerce': "
    export PGPASSWORD="ecommerce123"
    if /www/server/pgsql/bin/psql -U ecommerce -d ecommerce -h localhost -p 5432 -c "SELECT 1" > /dev/null 2>&1; then
        echo "Connected"
    else
        echo "Cannot connect"
    fi
    unset PGPASSWORD
else
    echo "   PostgreSQL not found"
fi

echo ""
echo "=============================================="
echo "Site Status:"
echo "=============================================="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null)
if echo "$HTTP_CODE" | grep -q "200\|301\|302"; then
    echo "   App responding on port 3001 (HTTP $HTTP_CODE)"
else
    echo "   App not responding on port 3001"
fi

echo ""
echo "=============================================="
echo "SSH Connection Test Complete!"
echo "=============================================="
echo ""
