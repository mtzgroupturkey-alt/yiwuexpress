# ================================================================================
# CHECK LOGS - Quick Log Viewer
# ================================================================================

param(
    [int]$Lines = 50
)

$SERVER = "djdn@39.175.57.2"
$PORT = "22"

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "LOG VIEWER - Last $Lines lines" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PM2 Application Logs:" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Gray
ssh -p $PORT $SERVER "pm2 logs ecommerce-monorepo --lines $Lines --nostream"

Write-Host ""
Write-Host ""
Write-Host "Nginx Error Log:" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Gray
ssh -p $PORT $SERVER "sudo tail -$Lines /var/log/nginx/dromkok.com_error.log"

Write-Host ""
Write-Host ""
Write-Host "Nginx Access Log (last 10):" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Gray
ssh -p $PORT $SERVER "sudo tail -10 /var/log/nginx/dromkok.com_access.log"

Write-Host ""
