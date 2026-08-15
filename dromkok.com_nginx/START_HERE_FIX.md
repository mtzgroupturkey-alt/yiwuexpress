# 🚨 URGENT FIX: dromkok.com Not Loading

## The Problem

Your site at **dromkok.com** is stuck on "Loading..." with these errors in the browser console:

```
Refused to apply style... MIME type ('text/html') is not a supported stylesheet
404 errors for all _next/static/* files
```

**Root Cause**: Nginx is configured to proxy requests to `localhost:3000`, but your production app runs on `localhost:3001`. All requests are hitting a non-existent service, so Nginx returns 404 HTML pages instead of your actual JavaScript and CSS files.

---

## ✅ The Solution (Choose ONE Method)

### 🌟 Method 1: Automated Fix Script (EASIEST - RECOMMENDED)

This is the fastest and safest way. The script will:
- Upload the corrected config
- Backup the old config
- Test before applying
- Reload nginx
- Verify everything works

**On Windows (PowerShell):**

1. Open PowerShell
2. Navigate to the nginx folder:
   ```powershell
   cd c:\wamp64\www\yiwuexpress\dromkok.com_nginx
   ```
3. Run the fix script:
   ```powershell
   .\fix_and_deploy.ps1
   ```
   
   **OR if you prefer batch:**
   ```cmd
   fix_and_deploy.bat
   ```

**On Linux/Mac or Git Bash:**

```bash
cd /c/wamp64/www/yiwuexpress/dromkok.com_nginx
bash fix_and_deploy.sh
```

4. **After the script completes:**
   - Clear your browser cache (Ctrl+Shift+Del)
   - Reload dromkok.com
   - Site should load properly!

---

### 🔧 Method 2: Manual SSH Fix (If You Prefer)

**Step-by-step:**

1. **Connect to your server:**
   ```bash
   ssh root@dromkok.com
   ```

2. **Edit the nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/www.dromkok.com
   ```

3. **Find and replace** (press Ctrl+\ in nano):
   - Find: `localhost:3000`
   - Replace with: `localhost:3001`
   - Press `A` to replace all
   
   You should find 5 instances:
   - Main location `/` block
   - `/api/` location block
   - Static files location block
   - `/favicon.ico` location
   - `/robots.txt` location

4. **Save and exit:**
   - Press `Ctrl+O` (write out)
   - Press `Enter` (confirm)
   - Press `Ctrl+X` (exit)

5. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```
   Should say: "syntax is ok" and "test is successful"

6. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

7. **Verify the app is running:**
   ```bash
   curl -I http://localhost:3001
   pm2 status
   ```
   
   If app is not running:
   ```bash
   cd /www/wwwroot/www.dromkok.com/web
   pm2 restart dromkok-web
   ```

8. **Test the site:**
   ```bash
   curl -I https://www.dromkok.com
   ```

9. **Clear your browser cache and reload!**

---

### 📤 Method 3: Upload Fixed Config

If you just want to upload the already-fixed config file:

```bash
# Upload the config
scp dromkok.com_nginx/nginx_ssl_config.conf root@dromkok.com:/tmp/

# SSH to server
ssh root@dromkok.com

# Backup and apply
sudo cp /etc/nginx/sites-available/www.dromkok.com /etc/nginx/sites-available/www.dromkok.com.backup
sudo cp /tmp/nginx_ssl_config.conf /etc/nginx/sites-available/www.dromkok.com
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔍 Verification Steps

After applying ANY of the above methods:

### 1. Check from server:
```bash
ssh root@dromkok.com

# Check app is running
curl -I http://localhost:3001

# Check nginx is serving correctly
curl -I https://www.dromkok.com

# Check PM2 status
pm2 status

# Check nginx logs (should see successful requests)
tail -n 50 /var/log/nginx/www.dromkok.com_access.log
```

### 2. Check from browser:
1. **Clear your browser cache** (IMPORTANT!)
   - Chrome: Ctrl+Shift+Del
   - Check "Cached images and files"
   - Click "Clear data"
   
2. **Or use Incognito/Private mode** to test

3. **Visit:** https://www.dromkok.com

4. **Open browser console** (F12):
   - Should see NO red errors
   - No MIME type errors
   - No 404 errors for _next/static/* files

### 3. Expected results:
- ✅ Site loads completely (no "Loading..." stuck screen)
- ✅ Images, styles, and animations work
- ✅ Navigation works
- ✅ No console errors

---

## ❌ Troubleshooting

### Issue: "App not responding on port 3001"

**Check if app is running:**
```bash
ssh root@dromkok.com
pm2 status
```

**If not running, start it:**
```bash
cd /www/wwwroot/www.dromkok.com/web
pm2 restart dromkok-web --update-env

# Or if not found:
pm2 start server.js --name dromkok-web --env production
pm2 save
```

**Check logs:**
```bash
pm2 logs dromkok-web --lines 50
```

### Issue: "Still seeing errors after fix"

1. **Hard refresh browser:** Ctrl+F5 or Cmd+Shift+R
2. **Clear browser cache completely**
3. **Try incognito/private mode**
4. **Wait 30 seconds** for DNS/CDN propagation

### Issue: "Permission denied" when editing nginx config

Use `sudo`:
```bash
sudo nano /etc/nginx/sites-available/www.dromkok.com
```

### Issue: "nginx: configuration test failed"

Check the error message:
```bash
sudo nginx -t
```

Common issues:
- Missing semicolon
- Typo in configuration
- Wrong file path

**Restore backup:**
```bash
sudo cp /etc/nginx/sites-available/www.dromkok.com.backup /etc/nginx/sites-available/www.dromkok.com
sudo systemctl reload nginx
```

---

## 📋 What Changed

The following locations in `nginx_ssl_config.conf` were updated:

| Location | Before | After |
|----------|--------|-------|
| Main `/` | `proxy_pass http://localhost:3000;` | `proxy_pass http://localhost:3001;` |
| API `/api/` | `proxy_pass http://localhost:3000;` | `proxy_pass http://localhost:3001;` |
| Static files | `proxy_pass http://localhost:3000;` | `proxy_pass http://localhost:3001;` |
| Favicon | `proxy_pass http://localhost:3000;` | `proxy_pass http://localhost:3001;` |
| Robots.txt | `proxy_pass http://localhost:3000;` | `proxy_pass http://localhost:3001;` |

---

## 🎯 Success Criteria

You'll know the fix worked when:

- ✅ Website loads completely (not stuck on "Loading...")
- ✅ Browser console shows NO errors
- ✅ CSS/JavaScript files load properly
- ✅ Images display correctly
- ✅ `curl -I https://www.dromkok.com/_next/static/...css` returns `200 OK` with `Content-Type: text/css`

---

## 🔐 Important Notes

1. **Backup Created**: All methods create a backup of your old config before making changes
2. **Safe Rollback**: If something goes wrong, you can restore from backup
3. **No Downtime**: Nginx reload happens without stopping the service
4. **Future Deploys**: Updated deployment workflow now verifies the correct port

---

## 📞 Need Help?

If you're still experiencing issues after trying these fixes:

1. **Check the logs:**
   ```bash
   ssh root@dromkok.com
   
   # Nginx error log
   tail -f /var/log/nginx/www.dromkok.com_error.log
   
   # PM2 app logs
   pm2 logs dromkok-web
   
   # System logs
   journalctl -u nginx -n 50
   ```

2. **Verify configurations:**
   ```bash
   # Check nginx config
   sudo nginx -t
   
   # Check what's running on port 3001
   sudo netstat -tlnp | grep 3001
   
   # Check PM2 environment
   pm2 env dromkok-web
   ```

3. **Full restart (last resort):**
   ```bash
   pm2 restart dromkok-web
   sudo systemctl restart nginx
   ```

---

## 📚 Related Files

- `nginx_ssl_config.conf` - Updated nginx configuration (port 3000→3001)
- `fix_and_deploy.sh` - Automated fix script (Linux/Mac/Git Bash)
- `fix_and_deploy.ps1` - Automated fix script (PowerShell)
- `fix_and_deploy.bat` - Automated fix script (Windows CMD)
- `update_nginx_port.sh` - Server-side update script
- `QUICK_FIX.txt` - Quick reference guide
- `FIX_PORT_MISMATCH.md` - Detailed documentation

---

**Last Updated:** 2026-08-14  
**Status:** Ready to deploy  
**Estimated Time:** 2-5 minutes

---

## ✨ Quick Commands Reference

```bash
# Upload and apply fix (one command)
cd c:\wamp64\www\yiwuexpress\dromkok.com_nginx && fix_and_deploy.bat

# Or manual SSH fix
ssh root@dromkok.com "sudo sed -i 's/localhost:3000/localhost:3001/g' /etc/nginx/sites-available/www.dromkok.com && sudo nginx -t && sudo systemctl reload nginx"

# Verify it worked
curl -I https://www.dromkok.com
```

Good luck! Your site should be working in just a few minutes. 🚀
