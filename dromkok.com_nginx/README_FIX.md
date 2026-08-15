# 🔧 Fix Applied: dromkok.com Port Mismatch

## Summary

Your dromkok.com site was showing "Loading..." with MIME type errors because Nginx was configured to proxy to port 3000, but your app runs on port 3001.

**This has been FIXED in the repository.** You just need to apply it to the server.

---

## 🚀 Apply the Fix (Choose ONE)

### Option 1: Double-Click Fix (Windows) ⭐ EASIEST

1. Open File Explorer
2. Navigate to: `c:\wamp64\www\yiwuexpress\dromkok.com_nginx\`
3. Double-click: **`RUN_FIX.bat`**
4. Follow the prompts
5. Clear browser cache and reload dromkok.com

### Option 2: PowerShell Script

```powershell
cd c:\wamp64\www\yiwuexpress\dromkok.com_nginx
.\fix_and_deploy.ps1
```

### Option 3: Command Line (CMD)

```cmd
cd c:\wamp64\www\yiwuexpress\dromkok.com_nginx
fix_and_deploy.bat
```

### Option 4: Bash (Git Bash/Linux/Mac)

```bash
cd /c/wamp64/www/yiwuexpress/dromkok.com_nginx
bash fix_and_deploy.sh
```

### Option 5: Manual SSH

```bash
ssh root@dromkok.com
sudo nano /etc/nginx/sites-available/www.dromkok.com
# Change all "localhost:3000" to "localhost:3001"
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📁 Files Created/Updated

### Fixed Configuration:
- ✅ `nginx_ssl_config.conf` - Updated to use port 3001

### Automated Fix Scripts:
- ✅ `RUN_FIX.bat` - Double-click runner (Windows)
- ✅ `fix_and_deploy.bat` - Windows batch script
- ✅ `fix_and_deploy.ps1` - PowerShell script
- ✅ `fix_and_deploy.sh` - Bash script (Linux/Mac/Git Bash)
- ✅ `update_nginx_port.sh` - Server-side update script

### Documentation:
- ✅ `START_HERE_FIX.md` - Complete step-by-step guide
- ✅ `FIX_PORT_MISMATCH.md` - Detailed technical documentation
- ✅ `QUICK_FIX.txt` - Quick reference
- ✅ `README_FIX.md` - This file

### Utilities:
- ✅ `verify_production.sh` - Production verification script

### Updated:
- ✅ `ecommerce-monorepo/.github/workflows/deploy.yml` - Added port verification

---

## ⏱️ Time Required

- **Automated script:** 2-3 minutes
- **Manual SSH:** 3-5 minutes

---

## ✅ After Applying

1. **Clear browser cache:** Ctrl+Shift+Del
2. **Visit:** https://www.dromkok.com
3. **Verify:** No console errors, site loads completely

---

## 🔍 How to Verify It Worked

### From your browser:
- Open https://www.dromkok.com
- Press F12 (open console)
- Should see NO red errors
- Site should load fully (not stuck on "Loading...")

### From server (SSH):
```bash
ssh root@dromkok.com

# Check app is running on correct port
curl -I http://localhost:3001
# Should return: HTTP/1.1 200 OK

# Check nginx is proxying correctly
curl -I https://www.dromkok.com
# Should return: HTTP/2 200

# Check PM2 status
pm2 status
# Should show dromkok-web as "online"
```

---

## 🆘 Troubleshooting

### Script asks for password
- Normal if SSH keys aren't set up
- Enter your server root password when prompted

### "App not responding on port 3001"
```bash
ssh root@dromkok.com
cd /www/wwwroot/www.dromkok.com/web
pm2 restart dromkok-web
pm2 logs dromkok-web
```

### Still seeing errors after fix
1. Hard refresh: Ctrl+F5
2. Clear ALL browser cache
3. Try incognito mode
4. Wait 30 seconds for changes to propagate

### Permission denied
Add `sudo` to commands:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 What Changed

### Port Configuration:
```nginx
# BEFORE (wrong):
proxy_pass http://localhost:3000;

# AFTER (correct):
proxy_pass http://localhost:3001;
```

### Locations Updated (5 total):
1. Main `/` location block
2. `/api/` location block  
3. Static files location block
4. `/favicon.ico` location
5. `/robots.txt` location

---

## 🔒 Safety Features

All scripts include:
- ✅ Automatic backup of old config
- ✅ Configuration test before applying
- ✅ Rollback on failure
- ✅ App verification after deployment
- ✅ Detailed error messages

---

## 📖 Need More Details?

- **Quick Start:** See `QUICK_FIX.txt`
- **Step-by-Step:** See `START_HERE_FIX.md`
- **Technical Details:** See `FIX_PORT_MISMATCH.md`

---

## 🎯 Success Criteria

You'll know it worked when:

- ✅ dromkok.com loads completely (no "Loading..." stuck screen)
- ✅ Browser console shows ZERO errors
- ✅ CSS styles are applied correctly
- ✅ JavaScript loads and runs
- ✅ Images display properly
- ✅ Navigation works

---

## 🚨 Important Notes

1. **This is a configuration fix only** - no code changes
2. **No downtime** - nginx reloads without stopping
3. **Reversible** - automatic backup created
4. **Safe** - tests before applying
5. **Fast** - takes 2-3 minutes

---

## 📞 Still Having Issues?

Check the logs:
```bash
ssh root@dromkok.com

# Nginx error log
tail -f /var/log/nginx/www.dromkok.com_error.log

# App logs
pm2 logs dromkok-web

# Check what's running on port 3001
sudo netstat -tlnp | grep 3001
```

---

## 🎉 Ready to Fix?

**Double-click:** `RUN_FIX.bat`

**Or run:**
```cmd
cd c:\wamp64\www\yiwuexpress\dromkok.com_nginx
fix_and_deploy.bat
```

That's it! Your site will be working in 2-3 minutes. 🚀

---

**Created:** 2026-08-14  
**Status:** Ready to Deploy  
**Impact:** Fixes site loading issue  
**Risk:** Low (safe rollback available)
