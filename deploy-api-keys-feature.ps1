# ================================================================================
# DEPLOY API KEYS MANAGEMENT FEATURE
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING API KEYS MANAGEMENT FEATURE" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "djdn@39.175.57.2"
$PORT = "22"

Write-Host "Step 1: Updating local database schema..." -ForegroundColor Yellow
cd ecommerce-monorepo\web
npm run db:push
cd ..\..
Write-Host "[OK] Local database updated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Committing changes to Git..." -ForegroundColor Yellow
git add .
git commit -m "feat: Add AI API keys management in admin panel System Settings"
Write-Host "[OK] Changes committed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Pushing to production branch..." -ForegroundColor Yellow
git push origin production
Write-Host "[OK] Pushed to GitHub" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Deploying to production server..." -ForegroundColor Yellow
ssh -p $PORT $SERVER @"
cd /www/wwwroot/www.dromkok.com/web && \
echo 'Pulling latest code...' && \
git pull origin production && \
echo 'Updating database schema...' && \
npm run db:push && \
echo 'Building application...' && \
npm run build && \
echo 'Restarting PM2...' && \
pm2 restart ecommerce-monorepo && \
echo '[OK] Deployment complete!'
"@
Write-Host ""

Write-Host "Step 5: Checking deployment status..." -ForegroundColor Yellow
ssh -p $PORT $SERVER "pm2 status | grep ecommerce-monorepo"
Write-Host ""

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://dromkok.com/admin/settings/system" -ForegroundColor White
Write-Host "  2. Enter your OpenRouter API Key:" -ForegroundColor White
Write-Host "     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" -ForegroundColor Gray
Write-Host "  3. Click 'Save Settings'" -ForegroundColor White
Write-Host "  4. Test translation feature - should work now!" -ForegroundColor White
Write-Host ""
Write-Host "API Key will be stored in database and work immediately!" -ForegroundColor Green
Write-Host ""
