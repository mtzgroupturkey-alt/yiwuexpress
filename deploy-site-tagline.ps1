# Deploy Site Tagline Feature to Production
# This script deploys the siteTagline field update

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy Site Tagline Feature" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# SSH connection details
$server = "39.175.57.2"
$port = "22"
$user = "djdn"
$webPath = "/www/wwwroot/www.dromkok.com/web"

Write-Host "Step 1: Pull latest code from production branch..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "cd $webPath && git pull origin production"

Write-Host ""
Write-Host "Step 2: Generate Prisma client with new schema..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "cd $webPath && npm run db:generate"

Write-Host ""
Write-Host "Step 3: Sync database schema (db:push)..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "cd $webPath && npm run db:push"

Write-Host ""
Write-Host "Step 4: Build Next.js application..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "cd $webPath && npm run build"

Write-Host ""
Write-Host "Step 5: Restart PM2 process (dromkok-web)..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "pm2 restart dromkok-web"

Write-Host ""
Write-Host "Step 6: Check PM2 status..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "pm2 status dromkok-web"

Write-Host ""
Write-Host "Step 7: View logs (last 20 lines)..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "pm2 logs dromkok-web --lines 20 --nostream"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit https://dromkok.com/admin/settings/company" -ForegroundColor White
Write-Host "2. Add your site tagline in the new field" -ForegroundColor White
Write-Host "3. Save changes" -ForegroundColor White
Write-Host "4. Check browser tab titles show: 'Page | Your Tagline'" -ForegroundColor White
Write-Host ""
