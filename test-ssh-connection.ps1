# Test SSH Connection to Dromkok Server
# Quick script to verify you can connect before running full migration

$SERVER = "39.175.57.2"
$USER = "djdn"
$PORT = 22

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🔐 Testing SSH Connection to Dromkok Server" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $USER@${SERVER}:${PORT}" -ForegroundColor Yellow
Write-Host ""

# Check if ssh command exists
Write-Host "1️⃣  Checking SSH client..." -ForegroundColor Cyan
if (Get-Command ssh -ErrorAction SilentlyContinue) {
    Write-Host "✅ SSH client found" -ForegroundColor Green
    $sshVersion = ssh -V 2>&1
    Write-Host "   Version: $sshVersion" -ForegroundColor Gray
} else {
    Write-Host "❌ SSH client not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install one of:" -ForegroundColor Yellow
    Write-Host "  1. Git for Windows (includes Git Bash with SSH)" -ForegroundColor White
    Write-Host "     Download: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "  2. OpenSSH for Windows:" -ForegroundColor White
    Write-Host "     Add-WindowsCapability -Online -Name OpenSSH.Client*" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Test basic connectivity
Write-Host ""
Write-Host "2️⃣  Testing network connectivity..." -ForegroundColor Cyan
Write-Host "   Pinging $SERVER..." -ForegroundColor Gray

if (Test-Connection -ComputerName $SERVER -Count 2 -Quiet) {
    Write-Host "✅ Server is reachable" -ForegroundColor Green
} else {
    Write-Host "⚠️  Ping failed (may be blocked by firewall)" -ForegroundColor Yellow
    Write-Host "   This is normal - firewall may block ICMP ping" -ForegroundColor Gray
}

# Test SSH connection
Write-Host ""
Write-Host "3️⃣  Testing SSH connection..." -ForegroundColor Cyan
Write-Host "   Attempting to connect to $USER@$SERVER..." -ForegroundColor Gray
Write-Host ""
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host "You will be prompted for your SSH password" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host ""

# Create a simple bash script file to upload and execute
$bashScript = @'
#!/bin/bash
echo ""
echo "✅ SSH Connection Successful!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Server Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Hostname:     $(hostname)"
echo "   OS:           $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2)"
echo "   Current User: $(whoami)"
echo "   Current Dir:  $(pwd)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 Project Directory Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "/www/wwwroot/www.dromkok.com/web" ]; then
    echo "   ✅ Project directory exists"
    echo "   Path: /www/wwwroot/www.dromkok.com/web"
    SIZE=$(du -sh /www/wwwroot/www.dromkok.com/web 2>/dev/null | cut -f1)
    echo "   Size: $SIZE"
else
    echo "   ⚠️  Project directory not found"
    echo "   Expected: /www/wwwroot/www.dromkok.com/web"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Server Tools Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "   Node.js:      "
if command -v node > /dev/null 2>&1; then 
    echo "$(node -v) ✅"
else 
    echo "Not found ❌"
fi

echo -n "   npm:          "
if command -v npm > /dev/null 2>&1; then 
    echo "$(npm -v) ✅"
else 
    echo "Not found ❌"
fi

echo -n "   PM2:          "
if command -v pm2 > /dev/null 2>&1; then 
    echo "$(pm2 -v) ✅"
else 
    echo "Not found ❌"
fi

echo -n "   Nginx:        "
if command -v nginx > /dev/null 2>&1; then 
    echo "$(nginx -v 2>&1 | cut -d'/' -f2) ✅"
else 
    echo "Not found ❌"
fi

echo -n "   PostgreSQL:   "
if [ -f "/www/server/pgsql/bin/psql" ]; then 
    echo "$(/www/server/pgsql/bin/psql --version 2>/dev/null | cut -d' ' -f3) ✅"
else 
    echo "Not found ❌"
fi

echo -n "   Git:          "
if command -v git > /dev/null 2>&1; then 
    echo "$(git --version | cut -d' ' -f3) ✅"
else 
    echo "Not found ❌"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Disk Space:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h / 2>/dev/null | tail -1 | awk '{print "   Total: " $2 "   Used: " $3 " (" $5 ")   Available: " $4}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PM2 Process Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v pm2 > /dev/null 2>&1; then
    pm2 list 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "   No PM2 processes running"
    fi
else
    echo "   PM2 not installed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Database Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/www/server/pgsql/bin/psql" ]; then
    echo "   PostgreSQL installed: ✅"
    echo -n "   Database 'ecommerce': "
    export PGPASSWORD="ecommerce123"
    if /www/server/pgsql/bin/psql -U ecommerce -d ecommerce -h localhost -p 5432 -c "SELECT 1" > /dev/null 2>&1; then
        echo "Connected ✅"
    else
        echo "Cannot connect ⚠️"
    fi
    unset PGPASSWORD
else
    echo "   PostgreSQL not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Site Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null)
if echo "$HTTP_CODE" | grep -q "200\|301\|302"; then
    echo "   ✅ App responding on port 3001 (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  App not responding on port 3001"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SSH Connection Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
'@

# Save script to temp file
$tempScript = Join-Path $env:TEMP "test-ssh-$([guid]::NewGuid().ToString().Substring(0,8)).sh"
$bashScript | Out-File -FilePath $tempScript -Encoding ASCII -NoNewline

try {
    # Execute via SSH
    $scriptContent = Get-Content $tempScript -Raw
    ssh -p $PORT "${USER}@${SERVER}" "bash -s" < $tempScript
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "=================================================" -ForegroundColor Green
        Write-Host "✅ SSH Connection Test PASSED!" -ForegroundColor Green
        Write-Host "=================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You are ready to run the migration script:" -ForegroundColor Cyan
        Write-Host "  .\deploy-to-dromkok.ps1" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "=================================================" -ForegroundColor Red
        Write-Host "❌ SSH Connection Test Failed" -ForegroundColor Red
        Write-Host "=================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "  1. Wrong password" -ForegroundColor White
        Write-Host "  2. Server is down" -ForegroundColor White
        Write-Host "  3. Firewall blocking SSH (port 22)" -ForegroundColor White
        Write-Host "  4. Network connectivity issue" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "  1. Check your password is correct" -ForegroundColor White
    Write-Host "  2. Verify server IP: $SERVER" -ForegroundColor White
    Write-Host "  3. Ensure SSH port 22 is open" -ForegroundColor White
    Write-Host ""
} finally {
    # Cleanup
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Manual SSH Test Command:" -ForegroundColor Cyan
Write-Host "  ssh djdn@39.175.57.2 -p 22" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
