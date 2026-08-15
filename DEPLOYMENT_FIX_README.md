# 🚀 SSL & Login Fix - Deployment Guide

## 🎯 Problem Summary

Your site at `http://dromkok.com` has several issues:
1. ❌ **No SSL/HTTPS** - Site only accessible via HTTP
2. ❌ **Login redirect loop** - Admin login fails because cookies require HTTPS
3. ❌ **Root URL errors** - `http://dromkok.com` shows MIME type errors
4. ❌ **Public routes redirecting** - Non-protected pages requiring login

## ✅ Solution

This deployment will:
1. ✅ Install SSL certificates on production server
2. ✅ Configure nginx to use HTTPS and redirect HTTP → HTTPS
3. ✅ Deploy latest code with debug logging
4. ✅ Fix root URL redirect to `/en/`
5. ✅ Fix middleware to allow public routes
6. ✅ Restart the application

---

## 📋 Prerequisites

Before running the deployment:
- ✅ You have PowerShell on Windows
- ✅ You have SSH access: `djdn@39.175.57.2 -p 22`
- ✅ SSL certificates exist at: `C:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\`
- ✅ Latest code is committed to `production` branch on GitHub

---

## 🚀 Deployment Steps

### Step 1: Run the Deployment Script

Open PowerShell and run:

```powershell
cd C:\wamp64\www\yiwuexpress
.\deploy-ssl-and-fix.ps1
```

This script will:
1. Upload SSL certificate files to server
2. Install them in `/etc/nginx/ssl/dromkok.com/`
3. Create nginx configuration with HTTPS
4. Test and reload nginx
5. Pull latest code from GitHub
6. Build the application
7. Restart PM2

**Expected output:**
```
=================================================================================
YIWU EXPRESS - SSL DEPLOYMENT & LOGIN FIX
=================================================================================

Step 1: Uploading SSL Certificate...
✅ Certificate uploaded

Step 2: Uploading SSL Private Key...
✅ Private key uploaded

Step 3: Running server-side installation...
========================================
Installing SSL certificates...
========================================
✅ SSL certificates installed

========================================
Configuring nginx...
========================================
✅ Nginx configuration created

========================================
Testing nginx configuration...
========================================
nginx: configuration file /etc/nginx/nginx.conf test is successful
✅ Nginx config is valid

========================================
Reloading nginx...
========================================
✅ Nginx reloaded

========================================
Deploying application...
========================================
Pulling latest code...
Building application...
Restarting PM2...
✅ Application deployed

========================================
✅✅✅ DEPLOYMENT COMPLETE! ✅✅✅
========================================
```

---

### Step 2: Verify Deployment

Run the verification script:

```powershell
.\verify-deployment.ps1
```

This will check:
- ✅ HTTPS is working
- ✅ HTTP redirects to HTTPS
- ✅ PM2 app is running
- ✅ App is listening on port 3001
- ✅ Recent logs look healthy

---

### Step 3: Test in Browser

1. **Open admin panel:** https://dromkok.com/admin
   - ⚠️ **MUST use HTTPS** (not HTTP)
   - Look for 🔒 lock icon in browser address bar

2. **Open Browser Console** (press F12)
   - Go to "Console" tab

3. **Login with credentials:**
   - Email: `djdn@domail.com` (or your admin email)
   - Password: your admin password

4. **Watch Console for debug logs:**
   ```
   [AUTH] Starting login with: djdn@domail.com
   [AUTH] Login request sent
   [AUTH] Login response received: 200
   [AUTH] Response data: {success: true, token: "...", user: {...}}
   [AUTH] Login successful! Navigating to: /admin
   [AUTH] Attempting redirect via window.location.href...
   ```

5. **Should redirect to admin dashboard** ✅

---

## 🔍 Troubleshooting

### If deployment fails:

1. **Check SSH access:**
   ```powershell
   ssh djdn@39.175.57.2 -p 22
   ```

2. **Check server manually:**
   ```bash
   # Check nginx
   sudo nginx -t
   sudo systemctl status nginx
   
   # Check PM2
   pm2 status
   pm2 logs ecommerce-monorepo --lines 50
   
   # Check port 3001
   sudo netstat -tlnp | grep :3001
   ```

3. **View logs:**
   ```powershell
   .\check-logs.ps1
   ```

### If login still fails after deployment:

1. **Check you're using HTTPS:**
   - URL must be: `https://dromkok.com/admin` (NOT `http://`)
   - Browser should show 🔒 lock icon

2. **Check browser console:**
   - Press F12 → Console tab
   - Look for errors or debug messages starting with `[AUTH]`

3. **Check cookies:**
   - F12 → Application → Cookies
   - Should see `auth-token` cookie with `Secure` flag

4. **Check PM2 logs on server:**
   ```bash
   ssh djdn@39.175.57.2 -p 22
   pm2 logs ecommerce-monorepo --lines 100
   ```

### If HTTPS doesn't work:

1. **Check SSL certificates installed:**
   ```bash
   ssh djdn@39.175.57.2 -p 22
   ls -lh /etc/nginx/ssl/dromkok.com/
   ```
   Should show:
   ```
   -rw-r--r-- 1 root root  xxx  dromkok.com_bundle.crt
   -rw------- 1 root root  xxx  dromkok.com.key
   ```

2. **Check nginx config:**
   ```bash
   sudo cat /etc/nginx/sites-available/dromkok.com
   sudo nginx -t
   ```

3. **Check nginx is listening on 443:**
   ```bash
   sudo netstat -tlnp | grep :443
   ```

### If root URL shows errors:

- The nginx config includes: `location = / { return 307 /en/; }`
- This redirects `https://dromkok.com` → `https://dromkok.com/en/`
- If still showing errors, the old Next.js `app/page.tsx` might still be deployed
- Solution: Re-run deployment to get latest code (file was deleted in commit f68ccf3)

---

## 📁 What Changed

### Code Changes (already committed to GitHub):

1. **`middleware.ts`**
   - ✅ Fixed locale-aware public route checking
   - ✅ Improved `/_next/` bypass to prevent MIME errors
   - ✅ Added HTTPS redirect for production

2. **`app/auth/login/page.tsx`**
   - ✅ Changed redirect method from `router.push()` to `window.location.href`
   - ✅ Added comprehensive debug logging

3. **`hooks/useAuth.ts`**
   - ✅ Added debug logging throughout auth flow

4. **`app/api/auth/login/route.ts`**
   - ✅ Added server-side debug logging

5. **`app/page.tsx`**
   - ✅ **DELETED** (was causing conflicts with root redirect)

### Server Changes (applied by deployment script):

1. **SSL Certificates**
   - Installed at `/etc/nginx/ssl/dromkok.com/`
   - Correct permissions set (644 for cert, 600 for key)

2. **Nginx Configuration**
   - HTTP (port 80) → HTTPS redirect
   - HTTPS (port 443) with SSL
   - Root `/` → `/en/` redirect
   - Proxy to localhost:3001

3. **Application**
   - Latest code pulled from `production` branch
   - Built with `npm run build`
   - Restarted with PM2

---

## 🎉 Success Criteria

After deployment, you should have:

- ✅ `https://dromkok.com` works with 🔒 lock icon
- ✅ `http://dromkok.com` redirects to HTTPS
- ✅ `https://dromkok.com/` redirects to `https://dromkok.com/en/`
- ✅ Admin login at `https://dromkok.com/admin` works
- ✅ Public pages (products, shop) accessible without login
- ✅ No MIME type errors
- ✅ No redirect loops

---

## 📞 Quick Commands Reference

```powershell
# Full deployment
.\deploy-ssl-and-fix.ps1

# Verify deployment
.\verify-deployment.ps1

# Check logs
.\check-logs.ps1

# SSH into server
ssh djdn@39.175.57.2 -p 22

# Manual commands on server
pm2 status
pm2 logs ecommerce-monorepo
pm2 restart ecommerce-monorepo
sudo systemctl status nginx
sudo nginx -t
```

---

## 🔐 Security Notes

After deployment:
- ✅ All traffic encrypted via HTTPS
- ✅ Authentication cookies use `Secure` flag (HTTPS only)
- ✅ HSTS header prevents HTTP fallback
- ✅ HTTP → HTTPS redirect enforced

---

## 📝 Notes

- **Server path:** `/www/wwwroot/www.dromkok.com/web`
- **PM2 app name:** `ecommerce-monorepo`
- **Port:** 3001
- **GitHub branch:** `production`
- **Nginx config:** `/etc/nginx/sites-available/dromkok.com`
- **SSL path:** `/etc/nginx/ssl/dromkok.com/`

---

## ✅ Next Steps After Successful Deployment

1. Test all critical flows:
   - Homepage → Product → Cart → Checkout
   - Login → Admin panel → Manage products
   - Language switching (EN/RU/ZH)

2. Monitor logs for first few hours:
   ```bash
   pm2 logs ecommerce-monorepo
   ```

3. Remove debug logs (optional):
   - The console debug logs can be removed later
   - They're helpful for troubleshooting but not needed in production

4. Update DNS if needed:
   - Ensure dromkok.com points to 39.175.57.2

5. Consider CDN/caching:
   - For better performance, consider adding Cloudflare

---

**Good luck with deployment! 🚀**
