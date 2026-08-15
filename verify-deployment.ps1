# ================================================================================
# VERIFY DEPLOYMENT - Quick Health Check
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "djdn@39.175.57.2"
$PORT = "22"

Write-Host "Checking deployment status..." -ForegroundColor Yellow
Write-Host ""

# Test HTTPS
Write-Host "1. Testing HTTPS..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://dromkok.com" -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 307 -or $response.StatusCode -eq 200) {
        Write-Host "   ✅ HTTPS is working" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 307) {
        Write-Host "   ✅ HTTPS is working (redirect to /en/)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  HTTPS issue: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test HTTP redirect
Write-Host "2. Testing HTTP → HTTPS redirect..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://dromkok.com" -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 301) {
        Write-Host "   ✅ HTTP redirects to HTTPS" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  HTTP redirect issue" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check PM2 status
Write-Host "3. Checking PM2 application status..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 status | grep ecommerce-monorepo"
Write-Host ""

# Check port 3001
Write-Host "4. Checking if app is running on port 3001..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "sudo netstat -tlnp | grep :3001 | head -1"
Write-Host ""

# Recent logs
Write-Host "5. Recent application logs..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 logs ecommerce-monorepo --lines 5 --nostream"
Write-Host ""

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "Manual Browser Test:" -ForegroundColor Yellow
Write-Host "  1. Open: https://dromkok.com/admin" -ForegroundColor White
Write-Host "  2. Check for 🔒 lock icon" -ForegroundColor White
Write-Host "  3. Open Console (F12)" -ForegroundColor White
Write-Host "  4. Login and watch for debug messages" -ForegroundColor White
Write-Host "=================================================================================" -ForegroundColor Cyan
