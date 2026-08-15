# ✅ Deployment Checklist

Print this page or keep it open while deploying.

---

## 📋 Pre-Deployment Checklist

- [ ] I have PowerShell access on Windows
- [ ] I have SSH access to server: `djdn@39.175.57.2 -p 22`
- [ ] SSL certificate files exist at: `C:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx\`
- [ ] Latest code changes are committed to `production` branch on GitHub
- [ ] I have admin login credentials ready for testing

---

## 🚀 Deployment Steps

### Step 1: Run Deployment
- [ ] Open PowerShell (Windows Key + X → PowerShell)
- [ ] Navigate to project: `cd C:\wamp64\www\yiwuexpress`
- [ ] Run deployment: `.\deploy-ssl-and-fix.ps1`
- [ ] Wait for completion (2-3 minutes)
- [ ] See "✅ DEPLOYMENT COMPLETE!" message

### Step 2: Verify Deployment
- [ ] Run verification: `.\verify-deployment.ps1`
- [ ] Check HTTPS is working: ✅
- [ ] Check HTTP redirects to HTTPS: ✅
- [ ] Check PM2 app is running: ✅
- [ ] Check app on port 3001: ✅

---

## 🧪 Testing Checklist

### Test 1: SSL/HTTPS
- [ ] Open browser
- [ ] Navigate to: `https://dromkok.com`
- [ ] See 🔒 lock icon in address bar
- [ ] Page loads without errors
- [ ] Redirects to: `https://dromkok.com/en/`

### Test 2: HTTP Redirect
- [ ] Navigate to: `http://dromkok.com`
- [ ] Browser automatically redirects to HTTPS
- [ ] See 🔒 lock icon after redirect

### Test 3: Admin Login
- [ ] Navigate to: `https://dromkok.com/admin`
- [ ] See login page (no errors)
- [ ] Open browser console (F12 → Console tab)
- [ ] Enter admin credentials
- [ ] Click "Login"
- [ ] See debug logs in console starting with `[AUTH]`
- [ ] Successfully redirects to admin dashboard
- [ ] Can navigate admin panel
- [ ] No redirect loop

### Test 4: Public Routes
- [ ] Navigate to: `https://dromkok.com/en/shop`
- [ ] Page loads without requiring login
- [ ] Navigate to: `https://dromkok.com/en/products`
- [ ] Page loads without requiring login

### Test 5: Language Switching
- [ ] Click language switcher
- [ ] Switch to Russian (RU)
- [ ] URL changes to: `https://dromkok.com/ru/`
- [ ] Content changes to Russian
- [ ] Switch to Chinese (ZH)
- [ ] URL changes to: `https://dromkok.com/zh/`
- [ ] Content changes to Chinese
- [ ] Switch back to English (EN)

---

## 🔍 Verification Checklist

### Console Output (During Login)
- [ ] See: `[AUTH] Starting login with: [email]`
- [ ] See: `[AUTH] Login request sent`
- [ ] See: `[AUTH] Login response received: 200`
- [ ] See: `[AUTH] Response data: {success: true, ...}`
- [ ] See: `[AUTH] Login successful! Navigating to: /admin`
- [ ] See: `[AUTH] Attempting redirect via window.location.href...`
- [ ] No error messages

### Browser Cookies
- [ ] Open: F12 → Application → Cookies
- [ ] See: `auth-token` cookie
- [ ] Cookie has `Secure` flag: ✅
- [ ] Cookie has `HttpOnly` flag: ✅
- [ ] Cookie domain is `dromkok.com`

### Server Health
- [ ] Run: `ssh djdn@39.175.57.2 -p 22 'pm2 status'`
- [ ] See: `ecommerce-monorepo` status: `online`
- [ ] Run: `ssh djdn@39.175.57.2 -p 22 'sudo netstat -tlnp | grep :3001'`
- [ ] See process listening on port 3001
- [ ] Run: `ssh djdn@39.175.57.2 -p 22 'sudo nginx -t'`
- [ ] See: "nginx: configuration file ... test is successful"

---

## ❌ Troubleshooting Checklist

### If Deployment Fails
- [ ] Check SSH access: `ssh djdn@39.175.57.2 -p 22`
- [ ] Check SSL files exist locally
- [ ] Check server has internet connection
- [ ] Check nginx is installed: `nginx -v`
- [ ] Check PM2 is installed: `pm2 -v`
- [ ] View deployment logs in PowerShell output

### If HTTPS Doesn't Work
- [ ] Check SSL files uploaded: `ls -l /etc/nginx/ssl/dromkok.com/`
- [ ] Check nginx config: `sudo cat /etc/nginx/sites-available/dromkok.com`
- [ ] Check nginx syntax: `sudo nginx -t`
- [ ] Check nginx is running: `sudo systemctl status nginx`
- [ ] Check port 443 open: `sudo netstat -tlnp | grep :443`
- [ ] Restart nginx: `sudo systemctl restart nginx`

### If Login Fails
- [ ] Verify using HTTPS (not HTTP)
- [ ] Check browser console for errors (F12)
- [ ] Check cookies are set (F12 → Application → Cookies)
- [ ] Clear browser cache and cookies
- [ ] Try incognito/private window
- [ ] Check PM2 logs: `pm2 logs ecommerce-monorepo --lines 50`
- [ ] Check credentials are correct
- [ ] Check database connection works

### If Root URL Shows Errors
- [ ] Check nginx root redirect: `location = / { return 307 /en/; }`
- [ ] Verify old `app/page.tsx` is deleted
- [ ] Rebuild app: `npm run build`
- [ ] Restart PM2: `pm2 restart ecommerce-monorepo`
- [ ] Check for MIME type errors in console
- [ ] Check nginx proxy settings

---

## 📊 Success Metrics

### All These Should Work:

| URL | Expected Result | Status |
|-----|----------------|--------|
| `http://dromkok.com` | → `https://dromkok.com/en/` | [ ] |
| `https://dromkok.com` | → `https://dromkok.com/en/` | [ ] |
| `https://dromkok.com/en/` | Homepage loads | [ ] |
| `https://dromkok.com/admin` | Login → Dashboard | [ ] |
| `https://dromkok.com/en/shop` | Products page | [ ] |
| `https://dromkok.com/ru/` | Russian homepage | [ ] |
| `https://dromkok.com/zh/` | Chinese homepage | [ ] |

### Security Checks:

- [ ] All URLs use HTTPS
- [ ] See 🔒 lock icon on all pages
- [ ] HTTP automatically redirects to HTTPS
- [ ] Cookies have `Secure` flag
- [ ] HSTS header is set
- [ ] TLS 1.2+ is used

---

## 📝 Post-Deployment Notes

### Date Deployed: _______________

### Issues Encountered:
```
[Write any issues you encountered here]




```

### Resolution:
```
[Write how you resolved them]




```

### Performance Notes:
```
[Note any performance observations]




```

---

## ✅ Final Sign-Off

- [ ] Deployment completed successfully
- [ ] All tests passed
- [ ] SSL/HTTPS working
- [ ] Admin login working
- [ ] Public routes accessible
- [ ] No console errors
- [ ] Server logs clean
- [ ] Ready for production use

**Deployed by:** _______________

**Date:** _______________

**Time:** _______________

**Sign:** _______________

---

## 📞 Quick Reference

```powershell
# Deploy
.\deploy-ssl-and-fix.ps1

# Verify
.\verify-deployment.ps1

# Check logs
.\check-logs.ps1

# SSH
ssh djdn@39.175.57.2 -p 22

# PM2 commands (on server)
pm2 status
pm2 logs ecommerce-monorepo
pm2 restart ecommerce-monorepo
pm2 stop ecommerce-monorepo
pm2 start ecommerce-monorepo

# Nginx commands (on server)
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
```

---

**Keep this checklist for future reference!**
