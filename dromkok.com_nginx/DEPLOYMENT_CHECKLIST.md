# ✅ SSL Deployment Checklist - www.dromkok.com

Use this checklist to track your SSL deployment progress.

---

## 📋 Pre-Deployment Phase

### Preparation
- [ ] Review README.md and understand the deployment process
- [ ] Review SSL_DEPLOYMENT_GUIDE.md
- [ ] Backup current nginx configuration
- [ ] Backup application data
- [ ] Schedule deployment during low-traffic period
- [ ] Notify team about deployment window

### File Verification
- [ ] Verify dromkok.com_bundle.crt exists
- [ ] Verify dromkok.com.key exists
- [ ] Verify dromkok.com_bundle.pem exists
- [ ] Verify dromkok.com.csr exists (for reference)
- [ ] Check certificate expiration date
- [ ] Document certificate expiration date for renewal reminder

### Server Preparation
- [ ] SSH access confirmed to Ubuntu server (39.175.57.2)
- [ ] Root or sudo access available
- [ ] Nginx installed on server
- [ ] Port 80 (HTTP) is open
- [ ] Port 443 (HTTPS) is open

---

## 🚀 Deployment Phase

### File Transfer
- [ ] Create `/etc/nginx/ssl/dromkok.com/` directory on server
- [ ] Upload dromkok.com_bundle.crt to server
- [ ] Upload dromkok.com.key to server
- [ ] Upload dromkok.com_bundle.pem to server
- [ ] Verify all files uploaded successfully

### Permissions Configuration
- [ ] Set certificate permissions: `chmod 644 dromkok.com_bundle.crt`
- [ ] Set PEM permissions: `chmod 644 dromkok.com_bundle.pem`
- [ ] Set key permissions: `chmod 600 dromkok.com.key` ⚠️ CRITICAL
- [ ] Set ownership: `chown www-data:www-data /etc/nginx/ssl/dromkok.com/*`
- [ ] Verify permissions with `ls -la`

### Nginx Configuration
- [ ] Copy nginx_ssl_config.conf to server
- [ ] Place at `/etc/nginx/sites-available/dromkok.com`
- [ ] Update certificate paths in config if needed
- [ ] Update upstream server address if not localhost:3000
- [ ] Test configuration: `sudo nginx -t`
- [ ] Configuration test shows: "syntax is ok" and "test is successful"

### Enable Site
- [ ] Create symlink: `ln -s /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-enabled/`
- [ ] Disable old configuration if exists
- [ ] Test configuration again: `sudo nginx -t`

### Start Services
- [ ] Reload Nginx: `sudo systemctl reload nginx`
- [ ] Check Nginx status: `sudo systemctl status nginx`
- [ ] Verify no errors in `/var/log/nginx/error.log`
- [ ] Verify services running without issues

### Log Rotation Setup
- [ ] Log rotation configured for access.log
- [ ] Log rotation configured for error.log
- [ ] Verify logrotate configuration: `sudo logrotate -d /etc/logrotate.d/dromkok-nginx`

---

## 🧪 Testing Phase

### Basic Connectivity Tests
- [ ] Test HTTP redirect: `curl -I http://www.dromkok.com`
  - Expected: 301 redirect to https://www.dromkok.com
- [ ] Test HTTPS: `curl -I https://www.dromkok.com`
  - Expected: 200 OK response
- [ ] Browse to https://www.dromkok.com in browser
  - No certificate warnings
  - Secure lock icon visible

### SSL Certificate Tests
- [ ] Check certificate details:
  ```bash
  openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -dates
  ```
- [ ] Certificate not expired
- [ ] Valid From date is correct
- [ ] Valid Until date is in future

### Certificate Chain Tests
- [ ] Verify certificate chain: `openssl verify -CAfile [cert] [cert]`
- [ ] All certificates in chain are valid
- [ ] No certificate chain warnings

### Header Tests
- [ ] HSTS header present: `curl -I https://www.dromkok.com | grep Strict-Transport`
- [ ] X-Content-Type-Options header: `curl -I https://www.dromkok.com | grep X-Content-Type`
- [ ] X-Frame-Options header: `curl -I https://www.dromkok.com | grep X-Frame`

### Nginx Tests
- [ ] Check access logs: `tail -f /var/log/nginx/www.dromkok.com_access.log`
  - Requests logged correctly
  - No SSL errors
- [ ] Check error logs: `tail -f /var/log/nginx/www.dromkok.com_error.log`
  - No SSL handshake errors
  - No permission errors

### Application Tests
- [ ] Homepage loads correctly
- [ ] All pages work over HTTPS
- [ ] Images load without mixed content warnings
- [ ] CSS/JS files load without warnings
- [ ] Forms submit correctly
- [ ] API calls work (check Network tab in browser DevTools)
- [ ] No console errors in browser DevTools

---

## 🔍 Online Testing

### SSL Testing Services
- [ ] Visit https://www.ssllabs.com/ssltest/?d=www.dromkok.com
  - Wait for complete analysis
  - Aim for grade: **A** or **A+**
  - Note any warnings
- [ ] Visit https://www.sslshopper.com/ssl-checker.html?domain=www.dromkok.com
  - Certificate chain valid
  - No warnings
- [ ] Visit https://securityheaders.com/?q=www.dromkok.com
  - Check security headers grade
  - Review recommendations

### Browser Compatibility
- [ ] Test on Chrome/Chromium
  - No warnings
  - Secure lock icon visible
- [ ] Test on Firefox
  - No warnings
  - Secure lock icon visible
- [ ] Test on Safari
  - No warnings
  - Secure lock icon visible
- [ ] Test on Edge
  - No warnings
  - Secure lock icon visible

### Certificate Details
- [ ] Certificate domain matches: dromkok.com
- [ ] Common Name (CN) includes dromkok.com
- [ ] Alternative Names (SAN) include www.dromkok.com
- [ ] Issuer information correct
- [ ] Signature algorithm is secure

---

## 📊 Monitoring & Maintenance

### Initial Monitoring (24 hours)
- [ ] Monitor error logs for SSL issues
- [ ] Monitor application performance
- [ ] Check for any user-reported SSL warnings
- [ ] Verify redirects working properly
- [ ] Confirm HTTPS-only browsing

### Ongoing Monitoring
- [ ] Set calendar reminder for certificate renewal (90 days before expiration)
- [ ] Document certificate expiration date: __________
- [ ] Document renewal date in calendar: __________
- [ ] Setup log rotation monitoring
- [ ] Monitor disk space usage
- [ ] Review Nginx access patterns

### Certificate Renewal Preparation
- [ ] Subscribe to certificate provider notifications
- [ ] Prepare renewal process documentation
- [ ] Test renewal in staging environment first
- [ ] Have rollback plan ready

---

## 🔐 Security Verification

### Private Key Security
- [ ] Private key permissions are 600: ✓
- [ ] Private key owner is www-data: ✓
- [ ] Private key never committed to Git: ✓
- [ ] Private key backed up securely offline: ✓
- [ ] Access to private key is logged

### File System Security
- [ ] SSL directory owned by www-data
- [ ] Certificate files readable by nginx only
- [ ] No world-readable permissions on certificates
- [ ] Regular security audits scheduled

### Configuration Security
- [ ] No HTTP/unencrypted connections for protected routes
- [ ] HSTS enabled (1-year max-age)
- [ ] Security headers configured
- [ ] CSP headers configured if applicable
- [ ] CORS properly configured

---

## 📝 Documentation

### Created/Updated Documentation
- [ ] SSL_DEPLOYMENT_GUIDE.md reviewed
- [ ] README.md updated with deployment notes
- [ ] Team trained on SSL configuration
- [ ] Runbook created for certificate renewal
- [ ] Emergency contact list updated
- [ ] Change log updated

### Backups
- [ ] Original Nginx config backed up
- [ ] SSL certificates backed up (secure location)
- [ ] Database backed up
- [ ] Application code backed up

---

## ✨ Post-Deployment

### Stakeholder Notification
- [ ] Users notified of SSL deployment
- [ ] Team informed of SSL implementation
- [ ] Security team notified
- [ ] Change management log updated

### Performance Review
- [ ] HTTPS performance acceptable
- [ ] Page load times monitored
- [ ] No performance degradation
- [ ] Server resources monitored

### Success Metrics
- [ ] All HTTPS connections successful: ✓
- [ ] HTTP → HTTPS redirects working: ✓
- [ ] No certificate errors: ✓
- [ ] Security scan grade A or A+: ✓
- [ ] All user tests passing: ✓
- [ ] No support tickets about SSL: ✓

---

## 🎯 Final Sign-Off

### Deployment Completed By
- **Name:** ________________
- **Date:** ________________
- **Time:** ________________

### Verified By
- **Name:** ________________
- **Date:** ________________

### Approved By
- **Name:** ________________
- **Title:** ________________
- **Date:** ________________

---

## 📞 Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Server Admin | | | |
| SSL Provider | | | |
| Technical Lead | | | |
| Security Officer | | | |

---

## 📋 Quick Reference

### Common Commands
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View access logs
tail -f /var/log/nginx/www.dromkok.com_access.log

# View error logs
tail -f /var/log/nginx/www.dromkok.com_error.log

# Check certificate expiration
openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -enddate

# Verify certificate chain
openssl verify -CAfile /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt \
               /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt
```

### Useful URLs
- SSL Labs: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/
- SSL Checker: https://www.sslshopper.com/ssl-checker.html
- Certificate Provider: [Your provider]

---

**Deployment Date:** __________  
**Certificate Expiration:** __________  
**Next Review Date:** __________  

✅ **All checks completed successfully!**
