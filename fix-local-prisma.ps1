# Fix Prisma Client for Local Development
# This script regenerates Prisma client after schema changes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Prisma Client (Local Development)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$webPath = "ecommerce-monorepo\web"

Write-Host "Step 1: Stop any running dev servers..." -ForegroundColor Yellow
Write-Host "Please press Ctrl+C in your dev server terminal now, then press Enter here to continue..." -ForegroundColor Red
Read-Host

Write-Host ""
Write-Host "Step 2: Clean Prisma client cache..." -ForegroundColor Yellow
Remove-Item -Path "$webPath\node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleaned .prisma cache" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Generate Prisma client..." -ForegroundColor Yellow
Set-Location $webPath
npm run db:generate
Set-Location ..\..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Prisma Client Regenerated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can restart your dev server:" -ForegroundColor Cyan
Write-Host "  cd $webPath" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
