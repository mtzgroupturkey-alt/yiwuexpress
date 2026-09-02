# Deployment Troubleshooting Guide

## Current Issue: Git TLS Connection Error

**Error Message:**
```
fatal: 无法访问 'https://github.com/mtzgroupturkey-alt/dromkok.git/'：
GnuTLS recv error (-110): The TLS connection was non-properly terminated.
```

This error occurs when the production server cannot establish a secure connection to GitHub due to TLS/network issues.

---

## Quick Fix Options (In Order of Preference)

### Option 1: Run Diagnostic Script (Recommended First Step)

SSH into your server and run:

```bash
# Download and run diagnostic script
curl -O https://raw.githubusercontent.com/mtzgroupturkey-alt/dromkok/main/diagnose-git-tls.sh
chmod +x diagnose-git-tls.sh
./diagnose-git-tls.sh
```

This will identify the exact cause and provide specific recommendations.

---

### Option 2: Update Git and TLS Libraries

The most common cause is outdated Git or TLS libraries.

```bash
# SSH into production server
ssh user@your-server.com

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install/update git with OpenSSL support
sudo apt install -y git libcurl4-openssl-dev ca-certificates

# Verify git version (should be 2.30+)
git --version
```

---

### Option 3: Configure Git to Handle TLS Issues

```bash
# SSH into production server
cd /www/wwwroot/www.dromkok.com/web  # or your target directory

# Configure git for better TLS handling
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
git config --global http.sslVerify true

# If OpenSSL is available, prefer it over GnuTLS
git config --global http.sslBackend openssl

# Test connection
git ls-remote origin
```

---

### Option 4: Use Manual Deployment Script

If GitHub Actions keeps failing, use the manual deployment script:

```bash
# SSH into production server
cd /www/wwwroot/www.dromkok.com/web

# Download manual deploy script
curl -O https://raw.githubusercontent.com/mtzgroupturkey-alt/dromkok/main/deploy-manual.sh
chmod +x deploy-manual.sh

# Run deployment
./deploy-manual.sh
```

The manual script includes:
- Multiple retry attempts
- Fallback strategies
- Automatic backup before changes
- Health checks

---

### Option 5: Switch to SSH Instead of HTTPS

SSH connections are more reliable for git operations:

```bash
# SSH into production server
cd /www/wwwroot/www.dromkok.com/web

# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "deploy@dromkok.com"

# Display public key
cat ~/.ssh/id_ed25519.pub
```

Then:
1. Add this public key to GitHub: Settings → SSH and GPG keys → New SSH key
2. Update git remote:
```bash
git remote set-url origin git@github.com:mtzgroupturkey-alt/dromkok.git
```

3. Update `.github/workflows/deploy.yml` to use SSH authentication

---

## Root Causes and Solutions

### Cause 1: Outdated GnuTLS Library

**Symptoms:** `GnuTLS recv error (-110)`

**Solution:**
```bash
sudo apt update
sudo apt install -y gnutls-bin libgnutls30
```

### Cause 2: Network/DNS Issues

**Symptoms:** Intermittent failures, timeouts

**Solution:**
```bash
# Test DNS resolution
host github.com

# If DNS fails, update /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf
```

### Cause 3: Firewall Blocking

**Symptoms:** Connection timeouts, port blocking

**Solution:**
```bash
# Check if port 443 (HTTPS) is open
sudo ufw status
sudo ufw allow 443/tcp

# Or for firewalld
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### Cause 4: Certificate Issues

**Symptoms:** SSL verification errors

**Solution:**
```bash
# Update CA certificates
sudo apt install -y ca-certificates
sudo update-ca-certificates

# If still failing, temporarily disable SSL verify (NOT recommended)
git config --global http.sslVerify false
```

---

## Monitoring Deployment

### Check GitHub Actions Status

1. Go to: https://github.com/mtzgroupturkey-alt/dromkok/actions
2. Click on the latest workflow run
3. Review the "Deploy to Server via SSH" step

### Check Server Logs

```bash
# SSH into server
ssh user@your-server.com

# Check PM2 logs
pm2 logs dromkok-web --lines 100

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check system logs
sudo journalctl -xe -u nginx
```

### Verify Deployment Success

```bash
# Check if process is running
pm2 status

# Test health endpoint
curl http://localhost:3001/api/health

# Test from outside
curl https://www.dromkok.com
```

---

## Prevention

### 1. Add Health Monitoring

Consider adding uptime monitoring:
- UptimeRobot (free)
- Pingdom
- StatusCake

### 2. Setup Deployment Notifications

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Notify on Failure
  if: failure()
  run: |
    # Send email, Slack, or Discord notification
```

### 3. Regular Server Maintenance

```bash
# Weekly maintenance script
#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
git config --global http.postBuffer 524288000
```

---

## Emergency Rollback

If deployment breaks the site:

```bash
# SSH into server
cd /www/wwwroot/www.dromkok.com/web

# Rollback to previous commit
git reset --hard HEAD~1

# Rebuild
npm install
npm run build

# Restart
pm2 restart all
```

---

## Getting Help

If issues persist:

1. **Share diagnostic output:**
   ```bash
   ./diagnose-git-tls.sh > diagnostic-report.txt
   ```

2. **Check GitHub Actions logs:**
   - Download workflow logs from GitHub Actions tab

3. **Server access logs:**
   ```bash
   pm2 logs --lines 200 > pm2-logs.txt
   sudo tail -200 /var/log/nginx/error.log > nginx-logs.txt
   ```

4. **Contact hosting provider** if network issues persist

---

## Updated Workflow

The deployment workflow has been updated with:
- ✅ Automatic retry logic (3 attempts)
- ✅ Git TLS configuration
- ✅ Fallback to re-clone if fetch fails
- ✅ Better error messages

Push to `production` or `main` branch to trigger the updated deployment.

---

## Testing the Fix

1. **Commit the updated workflow:**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "fix: add TLS retry logic and fallback strategies"
   git push origin main
   ```

2. **Monitor the deployment:**
   - Watch GitHub Actions: https://github.com/mtzgroupturkey-alt/dromkok/actions
   - Check server: `ssh user@server && pm2 logs`

3. **Verify site is live:**
   - Open: https://www.dromkok.com
   - Check API: https://www.dromkok.com/api/health

---

## Additional Resources

- [GitHub Actions SSH Debugging](https://github.com/appleboy/ssh-action#debugging)
- [Git TLS Troubleshooting](https://git-scm.com/docs/git-config#Documentation/git-config.txt-httpsslVerify)
- [Ubuntu Server Network Troubleshooting](https://ubuntu.com/server/docs/network-configuration)
