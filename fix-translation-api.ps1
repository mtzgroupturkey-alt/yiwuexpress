# ================================================================================
# FIX TRANSLATION API - Add OPENROUTER_API_KEY to Production Server
# ================================================================================

$SERVER = "djdn@39.175.57.2"
$PORT = "22"
$API_KEY = "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"

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "FIX TRANSLATION API - Adding OPENROUTER_API_KEY" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Backing up .env file..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "cd /www/wwwroot/www.dromkok.com/web && cp .env .env.backup.translation.`$(date +%Y%m%d_%H%M%S)"
Write-Host "[OK] Backup created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Checking current API keys..." -ForegroundColor Yellow
Write-Host "Current translation-related variables:" -ForegroundColor Gray
ssh -p $PORT $SERVER "cd /www/wwwroot/www.dromkok.com/web && grep -E '(OPENROUTER|GEMINI|DEEPSEEK|QWEN|KIMI)' .env || echo 'No translation API keys found'"
Write-Host ""

Write-Host "Step 3: Adding/updating OPENROUTER_API_KEY..." -ForegroundColor Yellow

$UPDATE_SCRIPT = @"
#!/bin/bash
cd /www/wwwroot/www.dromkok.com/web

# Remove old OPENROUTER_API_KEY if exists
sed -i '/OPENROUTER_API_KEY=/d' .env

# Add new OPENROUTER_API_KEY
echo "" >> .env
echo "# AI Translation (OpenRouter)" >> .env
echo "OPENROUTER_API_KEY=$API_KEY" >> .env
echo "OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free" >> .env
echo "OPENROUTER_REFERER=https://dromkok.com" >> .env

echo "[OK] OPENROUTER_API_KEY added"
echo ""
echo "Updated .env file (translation section):"
grep -A3 "AI Translation" .env || grep "OPENROUTER" .env
"@

$TEMP_SCRIPT = [System.IO.Path]::GetTempFileName()
$UPDATE_SCRIPT | Out-File -FilePath $TEMP_SCRIPT -Encoding ASCII -NoNewline

scp -P $PORT $TEMP_SCRIPT "${SERVER}:/tmp/update-api-key.sh"
Remove-Item $TEMP_SCRIPT

ssh -p $PORT $SERVER "chmod +x /tmp/update-api-key.sh && /tmp/update-api-key.sh && rm /tmp/update-api-key.sh"

Write-Host ""
Write-Host "Step 4: Restarting PM2 to apply changes..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 restart ecommerce-monorepo"
Write-Host "[OK] PM2 restarted" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Verifying PM2 status..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 status | grep ecommerce-monorepo"
Write-Host ""

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "TRANSLATION API FIX COMPLETE!" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://dromkok.com/admin" -ForegroundColor White
Write-Host "  2. Try using the translation feature" -ForegroundColor White
Write-Host "  3. Should work without errors now" -ForegroundColor White
Write-Host ""
Write-Host "If still not working:" -ForegroundColor Yellow
Write-Host "  - Check PM2 logs: ssh -p 22 djdn@39.175.57.2 `"pm2 logs ecommerce-monorepo --lines 30`"" -ForegroundColor Gray
Write-Host "  - Check browser console for errors (F12)" -ForegroundColor Gray
Write-Host ""
