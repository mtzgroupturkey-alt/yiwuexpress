# Quick Fix: Git TLS Error

## Immediate Actions (Choose One)

### 🚀 Method 1: Push Updated Workflow (Automatic Fix)
```bash
git add .github/workflows/deploy.yml deploy-manual.sh diagnose-git-tls.sh
git commit -m "fix: add TLS retry logic and deployment fallbacks"
git push origin main
```
The updated workflow includes automatic retry and fallback strategies.

---

### 🔧 Method 2: Fix on Server (Manual)
SSH into your production server and run:

```bash
# Quick git TLS fix
cd /www/wwwroot/www.dromkok.com/web
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
git config --global http.sslBackend openssl

# Update system
sudo apt update && sudo apt install -y git libcurl4-openssl-dev

# Retry deployment
git fetch origin --depth=1
git reset --hard origin/production
npm install && npm run build
pm2 restart all
```

---

### 📋 Method 3: Use Manual Deploy Script
```bash
# On your production server
cd /www/wwwroot/www.dromkok.com/web
wget https://raw.githubusercontent.com/mtzgroupturkey-alt/dromkok/main/deploy-manual.sh
chmod +x deploy-manual.sh
./deploy-manual.sh
```

---

## Root Cause

The error `GnuTLS recv error (-110): The TLS connection was non-properly terminated` occurs because:

1. **Outdated GnuTLS library** on Ubuntu server
2. **Network instability** between server and GitHub
3. **TLS handshake timeout**

## What Was Fixed

The updated deployment workflow now:
- ✅ Configures git for better TLS handling
- ✅ Retries failed fetches 3 times
- ✅ Falls back to full re-clone if fetch fails
- ✅ Uses `--depth=1` for faster operations
- ✅ Includes better error messages

## Verify the Fix

After pushing or manual deployment:

```bash
# Check if site is up
curl https://www.dromkok.com

# Check API health
curl https://www.dromkok.com/api/health

# View PM2 status
pm2 status

# View logs
pm2 logs dromkok-web --lines 50
```

## If Still Failing

1. **Run diagnostic:**
   ```bash
   curl -O https://raw.githubusercontent.com/mtzgroupturkey-alt/dromkok/main/diagnose-git-tls.sh
   chmod +x diagnose-git-tls.sh
   ./diagnose-git-tls.sh
   ```

2. **Check full troubleshooting guide:**
   See `DEPLOYMENT_TROUBLESHOOTING.md`

3. **Switch to SSH authentication** (most reliable):
   ```bash
   ssh-keygen -t ed25519 -C "deploy@dromkok.com"
   # Add public key to GitHub
   git remote set-url origin git@github.com:mtzgroupturkey-alt/dromkok.git
   ```

## Emergency Contact

- **GitHub Actions Logs:** https://github.com/mtzgroupturkey-alt/dromkok/actions
- **Server Logs:** `ssh user@server && pm2 logs`
- **Nginx Logs:** `sudo tail -f /var/log/nginx/error.log`
