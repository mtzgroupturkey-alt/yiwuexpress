# ================================================================================
# FIX MIXED CONTENT - Update Environment Variables on Server
# ================================================================================

$SERVER = "djdn@39.175.57.2"
$PORT = "22"

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "FIX MIXED CONTENT - Updating Environment Variables" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "The issue: App is generating HTTP URLs instead of HTTPS URLs" -ForegroundColor Yellow
Write-Host "Solution: Update .env file on server to use HTTPS URLs" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Backing up current .env file..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "cd /www/wwwroot/www.dromkok.com/web && cp .env .env.backup.`$(date +%Y%m%d_%H%M%S)"
Write-Host "[OK] Backup created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Updating environment variables..." -ForegroundColor Yellow

$ENV_UPDATES = @'
#!/bin/bash
cd /www/wwwroot/www.dromkok.com/web

# Update NEXT_PUBLIC_API_URL to HTTPS
sed -i 's|NEXT_PUBLIC_API_URL=http://|NEXT_PUBLIC_API_URL=https://|g' .env
sed -i 's|NEXT_PUBLIC_API_URL=.*localhost.*|NEXT_PUBLIC_API_URL=https://dromkok.com/api|g' .env

# Update APP_URL to HTTPS
sed -i 's|APP_URL=http://|APP_URL=https://|g' .env
sed -i 's|APP_URL=.*localhost.*|APP_URL=https://dromkok.com|g' .env

# Update ALLOWED_ORIGINS to HTTPS
sed -i 's|ALLOWED_ORIGINS=http://|ALLOWED_ORIGINS=https://|g' .env

# Update IMAGE URLs to HTTPS
sed -i 's|NEXT_PUBLIC_IMAGE_BASE_URL=http://|NEXT_PUBLIC_IMAGE_BASE_URL=https://|g' .env
sed -i 's|NEXT_PUBLIC_UPLOAD_URL=http://|NEXT_PUBLIC_UPLOAD_URL=https://|g' .env

# Add NODE_ENV=production if not exists
grep -q "NODE_ENV=" .env || echo "NODE_ENV=production" >> .env
sed -i 's|NODE_ENV=development|NODE_ENV=production|g' .env

echo "Environment variables updated!"
echo ""
echo "Current HTTPS-related variables:"
grep -E "(NEXT_PUBLIC_API_URL|APP_URL|ALLOWED_ORIGINS|NODE_ENV)" .env
'@

$TEMP_SCRIPT = [System.IO.Path]::GetTempFileName()
$ENV_UPDATES | Out-File -FilePath $TEMP_SCRIPT -Encoding ASCII -NoNewline

scp -P $PORT $TEMP_SCRIPT "${SERVER}:/tmp/update-env.sh"
Remove-Item $TEMP_SCRIPT

ssh -p $PORT $SERVER "chmod +x /tmp/update-env.sh && /tmp/update-env.sh && rm /tmp/update-env.sh"

Write-Host "[OK] Environment variables updated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Rebuilding application..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "cd /www/wwwroot/www.dromkok.com/web && npm run build"
Write-Host "[OK] Application rebuilt" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Restarting PM2..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 restart ecommerce-monorepo"
Write-Host "[OK] PM2 restarted" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Checking PM2 status..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 status"
Write-Host ""

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "MIXED CONTENT FIX COMPLETE!" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "  2. Open incognito/private window" -ForegroundColor White
Write-Host "  3. Go to: https://dromkok.com/admin" -ForegroundColor White
Write-Host "  4. Open Console (F12)" -ForegroundColor White
Write-Host "  5. Should see NO mixed content errors" -ForegroundColor White
Write-Host "  6. Login should work perfectly" -ForegroundColor White
Write-Host ""
Write-Host "If still seeing HTTP requests:" -ForegroundColor Yellow
Write-Host "  - Check console for any remaining HTTP:// URLs" -ForegroundColor Gray
Write-Host "  - Run: ssh -p 22 djdn@39.175.57.2 `"cat /www/wwwroot/www.dromkok.com/web/.env | grep NEXT_PUBLIC`"" -ForegroundColor Gray
Write-Host ""
