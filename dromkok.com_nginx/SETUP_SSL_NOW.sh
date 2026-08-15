#!/bin/bash

# SSL Setup Script for dromkok.com
# Run this on your PRODUCTION SERVER

echo "=========================================="
echo "Setting up SSL for dromkok.com"
echo "=========================================="
echo ""

# Step 1: Create SSL directory
echo "Step 1: Creating SSL directory..."
sudo mkdir -p /etc/nginx/ssl/dromkok.com
sudo chmod 755 /etc/nginx/ssl
sudo chmod 755 /etc/nginx/ssl/dromkok.com
echo "✅ SSL directory created"
echo ""

# Step 2: Upload SSL files
echo "Step 2: Upload SSL certificate files"
echo "You need to upload these files to /etc/nginx/ssl/dromkok.com/:"
echo "  - dromkok.com_bundle.crt"
echo "  - dromkok.com.key"
echo ""
echo "Use SCP or SFTP to upload from your local machine:"
echo ""
echo "From Windows (PowerShell):"
echo "  scp C:/wamp64/www/yiwuexpress/dromkok.com_nginx/dromkok.com_nginx/dromkok.com_bundle.crt root@YOUR_SERVER:/etc/nginx/ssl/dromkok.com/"
echo "  scp C:/wamp64/www/yiwuexpress/dromkok.com_nginx/dromkok.com_nginx/dromkok.com.key root@YOUR_SERVER:/etc/nginx/ssl/dromkok.com/"
echo ""
echo "Or use WinSCP to upload the files."
echo ""
read -p "Press Enter after you've uploaded the SSL files..."
echo ""

# Step 3: Set correct permissions
echo "Step 3: Setting SSL file permissions..."
sudo chmod 644 /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt
sudo chmod 600 /etc/nginx/ssl/dromkok.com/dromkok.com.key
sudo chown root:root /etc/nginx/ssl/dromkok.com/*
echo "✅ Permissions set"
echo ""

# Step 4: Verify SSL files exist
echo "Step 4: Verifying SSL files..."
if [ -f /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt ]; then
    echo "✅ Certificate file found"
else
    echo "❌ Certificate file NOT found!"
    echo "   Expected: /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt"
    exit 1
fi

if [ -f /etc/nginx/ssl/dromkok.com/dromkok.com.key ]; then
    echo "✅ Private key file found"
else
    echo "❌ Private key file NOT found!"
    echo "   Expected: /etc/nginx/ssl/dromkok.com/dromkok.com.key"
    exit 1
fi
echo ""

# Step 5: Test certificate
echo "Step 5: Testing SSL certificate..."
openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -text | grep -E "(Subject:|Issuer:|Not Before|Not After)"
echo ""

# Step 6: Update nginx config
echo "Step 6: Updating nginx configuration..."

# Backup current config
sudo cp /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-available/dromkok.com.backup.$(date +%Y%m%d_%H%M%S)

# Create new config with SSL
cat > /tmp/dromkok_ssl.conf << 'EOF'
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
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Logs
    access_log /var/log/nginx/dromkok.com_access.log;
    error_log /var/log/nginx/dromkok.com_error.log;

    # Client settings
    client_max_body_size 100M;
    
    # Root redirect to /en/
    location = / {
        return 307 /en/;
    }

    # Proxy to Next.js
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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo mv /tmp/dromkok_ssl.conf /etc/nginx/sites-available/dromkok.com
echo "✅ Nginx config updated"
echo ""

# Step 7: Test nginx configuration
echo "Step 7: Testing nginx configuration..."
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed!"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/dromkok.com.backup.* /etc/nginx/sites-available/dromkok.com
    exit 1
fi
echo ""

# Step 8: Reload nginx
echo "Step 8: Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# Step 9: Test SSL
echo "Step 9: Testing SSL connection..."
sleep 2
curl -I https://dromkok.com 2>&1 | head -5
echo ""

# Step 10: Verify certificate
echo "Step 10: Verifying SSL certificate..."
openssl s_client -connect dromkok.com:443 -servername dromkok.com < /dev/null 2>&1 | grep -E "(subject=|issuer=|Verify return code)"
echo ""

echo "=========================================="
echo "✅ SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Test your site:"
echo "  https://dromkok.com"
echo ""
echo "Check SSL:"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=dromkok.com"
echo ""
