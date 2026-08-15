# ================================================================================
# DEPLOY SSL AND FIX LOGIN - Complete Deployment Script
# ================================================================================
# Run this from PowerShell on Windows
# This will:
# 1. Upload SSL certificates to server
# 2. Configure nginx with HTTPS
# 3. Deploy latest code with debug logs
# 4. Restart the application
# ================================================================================

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "YIWU EXPRESS - SSL DEPLOYMENT & LOGIN FIX" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

# Server details
$SERVER_USER = "djdn"
$SERVER_IP = "39.175.57.2"
$SERVER_PORT = "22"
$SERVER = "${SERVER_USER}@${SERVER_IP}"

# Local SSL file paths
$SSL_CERT = "C:/wamp64/www/yiwuexpress/dromkok.com_nginx/dromkok.com_nginx/dromkok.com_bundle.crt"
$SSL_KEY = "C:/wamp64/www/yiwuexpress/dromkok.com_nginx/dromkok.com_nginx/dromkok.com.key"

Write-Host "Step 1: Uploading SSL Certificate..." -ForegroundColor Yellow
scp -P $SERVER_PORT $SSL_CERT "${SERVER}:/tmp/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Certificate uploaded" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to upload certificate" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Uploading SSL Private Key..." -ForegroundColor Yellow
scp -P $SERVER_PORT $SSL_KEY "${SERVER}:/tmp/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Private key uploaded" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to upload private key" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Running server-side installation..." -ForegroundColor Yellow
Write-Host "(This will install SSL, configure nginx, and deploy the app)" -ForegroundColor Gray

# Create the server-side script
$SERVER_SCRIPT = @'
#!/bin/bash
set -e

echo "========================================"
echo "Installing SSL certificates..."
echo "========================================"

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl/dromkok.com

# Move certificates
sudo mv /tmp/dromkok.com_bundle.crt /etc/nginx/ssl/dromkok.com/
sudo mv /tmp/dromkok.com.key /etc/nginx/ssl/dromkok.com/

# Set permissions
sudo chmod 644 /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt
sudo chmod 600 /etc/nginx/ssl/dromkok.com/dromkok.com.key

echo "✅ SSL certificates installed"
echo ""

echo "========================================"
echo "Configuring nginx..."
echo "========================================"

# Create nginx configuration
sudo tee /etc/nginx/sites-available/dromkok.com > /dev/null << 'NGINX_EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dromkok.com www.dromkok.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dromkok.com www.dromkok.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/dromkok.com/dromkok.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    
    # Session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/dromkok.com_access.log;
    error_log /var/log/nginx/dromkok.com_error.log;

    # Upload size
    client_max_body_size 100M;
    
    # Root redirect to /en/
    location = / {
        return 307 /en/;
    }

    # Proxy to Next.js on port 3001
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }
}
NGINX_EOF

echo "✅ Nginx configuration created"
echo ""

echo "========================================"
echo "Testing nginx configuration..."
echo "========================================"
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
else
    echo "❌ Nginx config has errors!"
    exit 1
fi

echo ""
echo "========================================"
echo "Reloading nginx..."
echo "========================================"
sudo systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""
echo "========================================"
echo "Deploying application..."
echo "========================================"
cd /www/wwwroot/www.dromkok.com/web

# Pull latest code
echo "Pulling latest code..."
git pull origin production

# Install dependencies (if needed)
if [ -f "package.json" ]; then
    echo "Checking dependencies..."
    npm install --production=false
fi

# Build the app
echo "Building application..."
npm run build

# Restart PM2
echo "Restarting PM2..."
pm2 restart ecommerce-monorepo

echo "✅ Application deployed"
echo ""

echo "========================================"
echo "Checking PM2 status..."
echo "========================================"
pm2 status

echo ""
echo "========================================"
echo "Recent PM2 logs..."
echo "========================================"
pm2 logs ecommerce-monorepo --lines 10 --nostream

echo ""
echo "========================================"
echo "Checking if app is running on port 3001..."
echo "========================================"
sudo netstat -tlnp | grep :3001 || echo "⚠️  Warning: No process on port 3001"

echo ""
echo "========================================"
echo "✅✅✅ DEPLOYMENT COMPLETE! ✅✅✅"
echo "========================================"
echo ""
echo "Now test your site:"
echo "  1. Visit: https://dromkok.com/admin"
echo "  2. Check for 🔒 lock icon in browser"
echo "  3. Open Console (F12) to see debug logs"
echo "  4. Login with your credentials"
echo "  5. Should redirect to admin panel ✅"
echo ""
echo "If login still fails, check browser console for errors"
echo ""
'@

# Save script to temp file and upload
$TEMP_SCRIPT = [System.IO.Path]::GetTempFileName()
$SERVER_SCRIPT | Out-File -FilePath $TEMP_SCRIPT -Encoding ASCII -NoNewline

Write-Host "Uploading deployment script..." -ForegroundColor Gray
scp -P $SERVER_PORT $TEMP_SCRIPT "${SERVER}:/tmp/deploy.sh"
Remove-Item $TEMP_SCRIPT

# Execute the script on server
ssh -p $SERVER_PORT $SERVER "chmod +x /tmp/deploy.sh && /tmp/deploy.sh && rm /tmp/deploy.sh"

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT FINISHED!" -ForegroundColor Green
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open browser and go to: https://dromkok.com/admin" -ForegroundColor White
Write-Host "  2. Check for lock icon (SSL is working)" -ForegroundColor White
Write-Host "  3. Open Console (F12) to see debug logs" -ForegroundColor White
Write-Host "  4. Login with admin credentials" -ForegroundColor White
Write-Host "  5. Watch console for: [AUTH] Login successful" -ForegroundColor White
Write-Host ""
Write-Host "If you see issues:" -ForegroundColor Yellow
Write-Host "  - Check PM2 logs: ssh -p 22 djdn@39.175.57.2 `"pm2 logs ecommerce-monorepo --lines 50`"" -ForegroundColor Gray
Write-Host "  - Check nginx logs: ssh -p 22 djdn@39.175.57.2 `"sudo tail -50 /var/log/nginx/dromkok.com_error.log`"" -ForegroundColor Gray
Write-Host ""
