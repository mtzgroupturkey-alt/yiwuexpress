# ==========================================
# Fix and Deploy Nginx Configuration (PowerShell)
# ==========================================
# This script will upload the fixed nginx config
# and apply it on the server via SSH

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Fix Nginx Port Mismatch - dromkok.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER = "root@dromkok.com"
$LOCAL_CONF = "nginx_ssl_config.conf"
$REMOTE_CONF = "/etc/nginx/sites-available/www.dromkok.com"

# Check if we're in the right directory
if (-not (Test-Path $LOCAL_CONF)) {
    Write-Host "ERROR: nginx_ssl_config.conf not found" -ForegroundColor Red
    Write-Host "Make sure you're running this from the dromkok.com_nginx directory"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if SSH is available
try {
    Get-Command ssh -ErrorAction Stop | Out-Null
    Get-Command scp -ErrorAction Stop | Out-Null
} catch {
    Write-Host "ERROR: SSH/SCP not found" -ForegroundColor Red
    Write-Host "Please install OpenSSH Client:"
    Write-Host "  Settings > Apps > Optional Features > Add OpenSSH Client"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Step 1: Upload nginx configuration" -ForegroundColor Green
Write-Host "----------------------------------------------------------------"
Write-Host ""

# Upload nginx config
Write-Host "Uploading configuration to server..."
& scp $LOCAL_CONF "${SERVER}:/tmp/nginx_ssl_config.conf"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to upload configuration" -ForegroundColor Red
    Write-Host "Check your SSH connection and try again"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Configuration uploaded successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Apply configuration on server" -ForegroundColor Green
Write-Host "----------------------------------------------------------------"
Write-Host ""
Write-Host "This will:"
Write-Host "  - Backup current config"
Write-Host "  - Install new config"
Write-Host "  - Test config"
Write-Host "  - Reload nginx"
Write-Host "  - Verify app is running"
Write-Host ""
Read-Host "Press Enter to continue"

# Create temporary script
$SCRIPT_CONTENT = @'
#!/bin/bash
set -e

NGINX_CONF="/etc/nginx/sites-available/www.dromkok.com"
BACKUP_FILE="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

echo "Creating backup: $BACKUP_FILE"
if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" "$BACKUP_FILE"
fi

echo "Installing new configuration..."
cp /tmp/nginx_ssl_config.conf "$NGINX_CONF"
chmod 644 "$NGINX_CONF"

echo "Testing nginx configuration..."
nginx -t || exit 1

echo "Reloading nginx..."
systemctl reload nginx

echo "Checking if app is running on port 3001..."
if curl -f -s http://localhost:3001 > /dev/null; then
    echo "✓ App is running on port 3001"
else
    echo "WARNING: App not responding on port 3001"
    echo "Checking PM2 status..."
    pm2 status || true
    echo "Attempting to restart..."
    cd /www/wwwroot/www.dromkok.com/web || exit 1
    pm2 restart dromkok-web --update-env || pm2 start server.js --name dromkok-web --env production
    pm2 save
    sleep 3
    if curl -f -s http://localhost:3001 > /dev/null; then
        echo "✓ App is now running"
    else
        echo "ERROR: App still not responding"
        pm2 logs dromkok-web --lines 20 --nostream
        exit 1
    fi
fi

echo "Testing HTTPS endpoint..."
curl -f -I https://www.dromkok.com || echo "HTTPS not responding yet"

echo ""
echo "✓ Configuration applied successfully!"
'@

# Save script to temp file
$TEMP_SCRIPT = [System.IO.Path]::GetTempFileName()
$TEMP_SCRIPT_SH = "$TEMP_SCRIPT.sh"
$SCRIPT_CONTENT | Out-File -FilePath $TEMP_SCRIPT_SH -Encoding ASCII -NoNewline

# Upload and execute script
Write-Host "Uploading fix script..."
& scp $TEMP_SCRIPT_SH "${SERVER}:/tmp/fix_nginx.sh"

Write-Host "Executing fix script on server..."
Write-Host ""
& ssh $SERVER "bash /tmp/fix_nginx.sh"

# Cleanup
Remove-Item $TEMP_SCRIPT -ErrorAction SilentlyContinue
Remove-Item $TEMP_SCRIPT_SH -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Configuration failed to apply" -ForegroundColor Red
    Write-Host "Check the error messages above"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   ✓ Configuration Applied Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "What was done:"
Write-Host "  * Nginx config updated (port 3000 -> 3001)"
Write-Host "  * Backup created on server"
Write-Host "  * Nginx reloaded"
Write-Host "  * App verified on port 3001"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Clear your browser cache (Ctrl+Shift+Del)" -ForegroundColor Yellow
Write-Host "  2. Visit https://www.dromkok.com" -ForegroundColor Yellow
Write-Host "  3. Check browser console - errors should be gone!" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you still see issues:"
Write-Host "  - Try incognito/private browsing mode"
Write-Host "  - Check server logs: ssh ${SERVER} 'pm2 logs dromkok-web'"
Write-Host ""
Read-Host "Press Enter to exit"
