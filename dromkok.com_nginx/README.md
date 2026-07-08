# 🔐 YIWU EXPRESS - SSL/TLS Configuration for www.dromkok.com

## 📦 What's Included

This folder contains everything needed to deploy YIWU EXPRESS with SSL/TLS security:

```
dromkok.com_nginx/
├── README.md                      ← You are here
├── SSL_DEPLOYMENT_GUIDE.md        ← Detailed deployment guide
├── nginx_ssl_config.conf          ← Nginx configuration file
├── deploy_ssl.sh                  ← Linux deployment script
├── deploy_ssl.bat                 ← Windows helper script
├── verify_certificate.sh          ← Certificate verification script
└── dromkok.com_nginx/
    ├── dromkok.com_bundle.crt     ← SSL Certificate (with CA chain)
    ├── dromkok.com.key            ← Private Key (KEEP SECURE!)
    ├── dromkok.com_bundle.pem     ← Certificate in PEM format
    └── dromkok.com.csr            ← Certificate Signing Request (reference)
```

---

## 🚀 Quick Start (5 Minutes)

### For Windows Users:

1. **Open Command Prompt** and navigate to this folder
2. **Run the helper script:**
   ```cmd
   deploy_ssl.bat
   ```
3. **Follow the prompts** to upload certificates to your server

### For Linux Users (on Ubuntu server):

1. **Upload all files to your server**
2. **Make script executable:**
   ```bash
   chmod +x deploy_ssl.sh
   ```
3. **Run deployment script:**
   ```bash
   sudo bash deploy_ssl.sh
   ```

---

## 📋 Certificate Information

| Property | Value |
|----------|-------|
| **Domain** | www.dromkok.com, dromkok.com |
| **Common Name** | dromkok.com |
| **Issuer** | QCloud (Tencent Cloud) |
| **Country** | CN (China) |
| **City** | Beijing |
| **Organization** | qcloud |
| **Key Type** | RSA 2048-bit |

**⚠️ IMPORTANT:** Check certificate expiration date and plan renewal accordingly!

```bash
openssl x509 -in dromkok.com_nginx/dromkok.com_bundle.crt -noout -dates
```

---

## 🔍 File Descriptions

### 1. **dromkok.com_bundle.crt** (SSL Certificate)
- Contains your SSL certificate + intermediate CA certificates
- Used by Nginx for HTTPS connections
- **Permission:** 644 (readable by all)
- **Usage:** `ssl_certificate` in nginx config

### 2. **dromkok.com.key** (Private Key) ⚠️
- Your private encryption key
- **MUST** be kept secure and confidential
- **Never** share, commit to Git, or expose
- **Permission:** 600 (readable only by owner)
- **Usage:** `ssl_certificate_key` in nginx config

### 3. **dromkok.com_bundle.pem** (PEM Format)
- Same certificate in PEM format
- Alternative format for compatibility
- May be used by some applications

### 4. **dromkok.com.csr** (Certificate Request)
- Historical file - used to create the certificate
- Kept for reference and renewal
- Not needed for deployment

---

## 🛠️ Deployment Steps

### Step 1: Prepare Ubuntu Server
```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl/dromkok.com

# Set permissions
sudo chmod 700 /etc/nginx/ssl/dromkok.com
```

### Step 2: Upload Certificate Files

**Using SCP (from Windows PowerShell):**
```powershell
scp -r "c:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\*" `
    root@39.175.57.2:/etc/nginx/ssl/dromkok.com/
```

**Or use WinSCP/FileZilla GUI**

### Step 3: Set Permissions (on Ubuntu)
```bash
ssh root@39.175.57.2

# Set certificate permissions (readable by nginx)
chmod 644 /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt
chmod 644 /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.pem

# Set private key permissions (readable ONLY by owner)
chmod 600 /etc/nginx/ssl/dromkok.com/dromkok.com.key

# Set ownership to nginx user
sudo chown www-data:www-data /etc/nginx/ssl/dromkok.com/*

# Verify
ls -la /etc/nginx/ssl/dromkok.com/
```

### Step 4: Deploy Nginx Configuration
```bash
# Copy configuration to sites-available
sudo cp nginx_ssl_config.conf /etc/nginx/sites-available/dromkok.com

# Make it executable
sudo chmod 644 /etc/nginx/sites-available/dromkok.com

# Enable the site (create symlink)
sudo ln -s /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t
```

### Step 5: Start/Reload Nginx
```bash
# Reload without stopping service
sudo systemctl reload nginx

# Or restart
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## ✅ Verification Checklist

### Local Testing (Before Deployment)
```bash
# Check certificate validity
openssl x509 -in dromkok.com_nginx/dromkok.com_bundle.crt -text -noout

# Verify certificate matches key
openssl x509 -noout -modulus -in dromkok.com_nginx/dromkok.com_bundle.crt | openssl md5
openssl rsa -noout -modulus -in dromkok.com_nginx/dromkok.com.key | openssl md5
# Both should have the same MD5 hash
```

### After Deployment (on Ubuntu)
```bash
# Test HTTPS connection
curl -vI https://www.dromkok.com

# Check SSL certificate chain
openssl s_client -connect www.dromkok.com:443

# Verify HSTS header
curl -I https://www.dromkok.com | grep Strict-Transport

# Test redirect from HTTP to HTTPS
curl -I http://www.dromkok.com
```

### Online Testing
1. **SSL Checker:** https://www.sslshopper.com/ssl-checker.html
2. **SSL Labs:** https://www.ssllabs.com/ssltest/
3. **Security Headers:** https://securityheaders.com/?q=www.dromkok.com

---

## 🔒 Security Configuration

The `nginx_ssl_config.conf` includes:

### ✅ SSL/TLS Security
- **TLS 1.2 & 1.3 only** - No weak protocols
- **Strong cipher suites** - ECDHE, ChaCha20
- **Perfect Forward Secrecy** - Enhanced security
- **Session caching** - Performance optimization

### ✅ HTTP Security Headers
- **HSTS** - Forces HTTPS for 1 year
- **X-Content-Type-Options** - Prevents MIME sniffing
- **X-Frame-Options** - Prevents clickjacking
- **X-XSS-Protection** - XSS attack prevention
- **Referrer-Policy** - Controls referrer info
- **Permissions-Policy** - Browser feature control

### ✅ Performance Features
- **HTTP/2** - Faster multiplexed connections
- **Gzip compression** - Reduces bandwidth
- **Static file caching** - Browser caching for assets
- **Connection pooling** - Efficient server resources

---

## 📊 Configuration Details

### Nginx Configuration Structure
```nginx
# HTTP → HTTPS redirect (Port 80 → 443)
server { listen 80; return 301 https://... }

# HTTPS server with SSL certificates
server {
    listen 443 ssl http2;
    
    # SSL certificates
    ssl_certificate /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/dromkok.com/dromkok.com.key;
    
    # Security settings & headers
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security ...
    
    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### Port Configuration
- **Port 80** (HTTP) - Redirects to HTTPS
- **Port 443** (HTTPS) - Main application server

### Upstream Application
- **Default:** localhost:3000 (Next.js)
- **Configurable:** Change in `nginx_ssl_config.conf`

---

## 🔄 Certificate Renewal

### Timeline
- ⏰ Mark renewal date **90 days before expiration**
- ⚠️ Most SSL providers send renewal notice at 30 days

### Renewal Process
1. Contact certificate provider (Tencent Cloud/QCloud)
2. Generate new CSR or renew existing
3. Receive new certificate bundle
4. Replace files in `/etc/nginx/ssl/dromkok.com/`
5. Reload Nginx: `sudo systemctl reload nginx`

### Check Expiration
```bash
# On Ubuntu server
openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -enddate

# Calculate days remaining
echo "Days remaining: $(( ( $(date -d "$(openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -enddate | cut -d= -f 2)" +%s) - $(date +%s) ) / 86400 ))"
```

---

## 🐛 Troubleshooting

### Issue: Nginx won't start
```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log

# Common issues:
# - Port 443 already in use: sudo lsof -i :443
# - Certificate path wrong: check config file
# - Permission denied: check file ownership/permissions
```

### Issue: Browser shows certificate warning
- Check certificate domain matches
- Verify certificate chain is complete
- Check certificate isn't expired
- Clear browser cache

### Issue: Mixed content warning
- Update app to use HTTPS for all resources
- Use relative URLs for assets
- Configure proper X-Forwarded-Proto headers

### Issue: Slow HTTPS performance
- ✅ HTTP/2 is enabled
- ✅ Gzip compression enabled
- Add CDN for static files
- Check server resources (CPU/memory)

---

## 📞 Support & Resources

### Documentation Files
- **SSL_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **nginx_ssl_config.conf** - Configuration reference
- **deploy_ssl.sh** - Automated Linux setup
- **deploy_ssl.bat** - Windows helper

### Useful Commands
```bash
# Check Nginx status
systemctl status nginx

# View access logs
tail -f /var/log/nginx/www.dromkok.com_access.log

# View error logs
tail -f /var/log/nginx/www.dromkok.com_error.log

# Restart Nginx
sudo systemctl restart nginx

# Test configuration
sudo nginx -t
```

### SSL Testing Tools
- **SSL Labs** - https://www.ssllabs.com/ssltest/
- **Security Headers** - https://securityheaders.com/
- **SSL Checker** - https://www.sslshopper.com/ssl-checker.html
- **Mozilla SSL Config** - https://ssl-config.mozilla.org/

### Certificate Provider
- **Tencent Cloud (QCloud)** - https://cloud.tencent.com/
- **Support URL** - [Your provider's support]

---

## 🎯 Success Criteria

After deployment, verify:

- ✅ HTTPS connection works (https://www.dromkok.com)
- ✅ HTTP redirects to HTTPS
- ✅ Certificate is valid and not expired
- ✅ Certificate chain is complete
- ✅ Security headers are present
- ✅ SSL Labs rating is A or A+
- ✅ No browser warnings or errors
- ✅ Nginx restart successful
- ✅ Logs show no SSL errors

---

## 📄 License & Security Note

⚠️ **SECURITY NOTICE:**

This folder contains sensitive SSL/TLS certificates and private keys. 

**DO:**
- Keep private keys secure offline
- Use secure channels for file transfer
- Restrict file access (chmod 600 for keys)
- Backup certificates securely
- Monitor certificate expiration

**DON'T:**
- Share private keys via email
- Commit to public Git repositories
- Expose keys in logs or configs
- Leave unencrypted on shared computers
- Forget to renew certificates

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-08 | Initial SSL deployment package |

---

**Last Updated:** July 8, 2026  
**For:** www.dromkok.com (YIWU EXPRESS)  
**Status:** ✅ Production Ready

---

## 🚀 Next Steps

1. **Review** SSL_DEPLOYMENT_GUIDE.md
2. **Prepare** your Ubuntu server
3. **Upload** certificate files
4. **Deploy** nginx configuration
5. **Test** and verify
6. **Monitor** logs and certificate expiration

**Questions?** Check the SSL_DEPLOYMENT_GUIDE.md or contact your server administrator.
