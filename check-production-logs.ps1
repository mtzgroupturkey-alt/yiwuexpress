# Check Production Server Logs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Server Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$server = "39.175.57.2"
$port = "22"
$user = "djdn"

Write-Host "Fetching PM2 logs..." -ForegroundColor Yellow
ssh -p $port "${user}@${server}" "pm2 logs dromkok-web --lines 50 --nostream"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PM2 Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
ssh -p $port "${user}@${server}" "pm2 status"
