# 🔒 SSL/TLS Deployment Guide for www.dromkok.com

## Overview
This guide explains how to deploy your YIWU EXPRESS e-commerce application with SSL/TLS encryption on Ubuntu server with Nginx.

---

## 📋 What You Have

### SSL Certificate Files Located At:
```
c:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\
├── dromkok.com_bundle.crt    (SSL Certificate Bundle - includes CA chain)
├── dromkok.com.key           (Private Key - KEEP SECURE!)
├── dromkok.com_bundle.pem    (PEM format of certificate)
└── dromkok.com.csr           (Certificate Signing Request - for reference)
```

---

## 🚀 Deployment Steps

### Step 1: Copy Files to Ubuntu Server

**On Your Windows Machine:**
Use SCP or SFTP to copy the certificate files to your Ubuntu server.

```bash
# Using SCP from Windows Command Prompt or PowerShell
scp -r "c:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\*" \
    root@39.175.57.2:/etc/nginx/ssl/dromkok.com/
```

**Or manually:**
1. Connect via SFTP (WinSCP, FileZilla)
2. Navigate to `/etc/nginx/ssl/dromkok.com/`
3. Upload the certificate files

### Step 2: Set Correct Permissions on Server

SSH into your Ubuntu server and set proper permissions:

```bash
ssh root@39.175.57.2

# Navigate to SSL directory
cd /etc/nginx/ssl/dromkok.com/

# Set permissions (certificate files)
chmod 644 dromkok.com_bundle.crt
chmod 644 dromkok.com_bundle.pem

# Set permissions (private key - SECURE!)
chmod 600 dromkok.com.key

# Verify owner is nginx/www-data
chown www-data:www-data /etc/nginx/ssl/dromkok.com/*

# List to verify
ls -la
```

### Step 3: Create Nginx Configuration

**Option A: Using the provided config file**

1. Copy the `nginx_ssl_config.conf` to your server:
```bash
scp "c:\wamp64\www\yiwuexpress\dromkok.com_nginx\nginx_ssl_config.conf" \
    root@39.175.57.2:/etc/nginx/sites-available/dromkok.com
```

2. On the server, enable the site:
```bash
cd /etc/nginx/sites-available
# Create symlink to sites-enabled
ln -s /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-enabled/
```

**Option B: Manual Configuration**

Create the file on server:
```bash
nano /etc/nginx/sites-available/dromkok.com
```

Then paste the configuration from `nginx_ssl_config.conf`.

### Step 4: Verify Nginx Configuration

```bash
# Test nginx configuration syntax
nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Reload Nginx

```bash
# Reload nginx without dropping connections
systemctl reload nginx

# Or restart if needed
systemctl restart nginx

# Check status
systemctl status nginx
```

### Step 6: Verify Firewall Rules

Ensure your firewall allows HTTPS traffic:

```bash
# UFW (if using UFW firewall)
ufw allow 'Nginx Full'
ufw allow 443/tcp
ufw allow 80/tcp

# Check status
ufw status
```

---

## ✅ Verification & Testing

### 1. Test SSL Certificate Online
Visit: https://www.sslshopper.com/ssl-checker.html
Enter: `www.dromkok.com`

### 2. Test via Command Line

```bash
# From your local machine, test SSL connection
openssl s_client -connect www.dromkok.com:443

# Or using curl
curl -vI https://www.dromkok.com

# Check certificate details
openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -text -noout
```

### 3. Check HTTP to HTTPS Redirect

```bash
# Should redirect to HTTPS
curl -I http://www.dromkok.com

# Expected: 301 redirect to https://www.dromkok.com
```

### 4. Verify Security Headers

```bash
curl -I https://www.dromkok.com | grep -E "Strict-Transport|X-Content-Type|X-Frame"
```

---

## 🔒 Security Best Practices

### Certificate Renewal (Important!)
SSL certificates expire and must be renewed. Set a calendar reminder:

**Certificate Expiration Date:** Check with:
```bash
openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -dates
```

**Renewal Process:**
1. Contact your certificate provider 90 days before expiration
2. Generate new CSR (use `dromkok.com.csr` as template)
3. Obtain new certificate bundle
4. Replace files in `/etc/nginx/ssl/dromkok.com/`
5. Test and reload nginx

### SSL Configuration Review

The provided nginx config includes:

✅ **TLS 1.2 & 1.3** - Only secure protocols  
✅ **Strong Ciphers** - ECDHE, ChaCha20, no weak ciphers  
✅ **HSTS Headers** - Forces HTTPS for 1 year  
✅ **Security Headers** - X-Frame-Options, X-Content-Type-Options, etc.  
✅ **Session Caching** - Improves performance  
✅ **Gzip Compression** - Reduces bandwidth  
✅ **HTTP/2 Support** - Faster loading  

### Private Key Protection

⚠️ **CRITICAL:** The `.key` file contains your private key
- **Never** share it
- **Never** commit to Git
- **Only** chmod 600 on the server
- **Backup** securely offline
- **Monitor** file access logs

---

## 🐛 Troubleshooting

### Issue: Nginx won't start
```bash
# Check error logs
tail -f /var/log/nginx/error.log

# Test configuration
nginx -t

# Common issues:
# - Port 443 already in use: sudo lsof -i :443
# - Permission denied on cert files: check ownership and permissions
```

### Issue: Certificate verification fails
```bash
# Verify certificate chain
openssl verify -CAfile /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt \
               /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt

# Check if bundle has all certificates
openssl crl2pkcs7 -nocrl -certfile /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt | \
        openssl pkcs7 -print_certs -text -noout
```

### Issue: Mixed content warning in browser
Ensure all resources are loaded via HTTPS:
1. Check for hardcoded `http://` URLs in your app
2. Use relative URLs where possible
3. Configure your app to use `X-Forwarded-Proto` header

### Issue: Slow HTTPS connection
1. Enable HTTP/2: ✅ Already configured
2. Enable gzip: ✅ Already configured
3. Add CDN for static files
4. Check server resources (CPU, Memory)

---

## 📊 Performance Monitoring

### Check Certificate Expiration
```bash
# Days until expiration
echo "Your certificate expires in $(( ( $(date -d "$(openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -enddate | cut -d= -f 2)" +%s) - $(date +%s) ) / 86400 )) days"
```

### Monitor Nginx Logs
```bash
# Real-time access log
tail -f /var/log/nginx/www.dromkok.com_access.log

# Error log
tail -f /var/log/nginx/www.dromkok.com_error.log

# Check for SSL handshake errors
grep "SSL" /var/log/nginx/error.log
```

### SSL Test Grade
Keep checking your SSL rating at:
- https://www.ssllabs.com/ssltest/analyze.html?d=www.dromkok.com

Aim for **A+** grade!

---

## 🔄 Next Steps

1. **Copy files to server** (Step 1-2)
2. **Deploy nginx configuration** (Step 3)
3. **Test and verify** (Verification section)
4. **Monitor certificate expiration** (Set calendar reminder)
5. **Document renewal process** for your team

---

## 📞 Quick Reference

| Component | Location | Permission |
|-----------|----------|-----------|
| Certificate Bundle | `/etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt` | 644 |
| Private Key | `/etc/nginx/ssl/dromkok.com/dromkok.com.key` | 600 |
| Nginx Config | `/etc/nginx/sites-available/dromkok.com` | 644 |
| Access Log | `/var/log/nginx/www.dromkok.com_access.log` | 640 |
| Error Log | `/var/log/nginx/www.dromkok.com_error.log` | 640 |

---

## ✨ Success Checklist

- [ ] SSL files copied to `/etc/nginx/ssl/dromkok.com/`
- [ ] File permissions set correctly (644 for certs, 600 for key)
- [ ] Nginx configuration deployed and tested
- [ ] Nginx reloaded without errors
- [ ] HTTP redirects to HTTPS (301)
- [ ] HTTPS connection successful
- [ ] Security headers present
- [ ] Certificate chain valid
- [ ] Certificate expiration date noted
- [ ] Logs monitored for errors

---

**Last Updated:** July 8, 2026  
**For Support:** Contact your server administrator
