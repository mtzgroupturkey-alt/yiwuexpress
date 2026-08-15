# Fix: Nginx Port Mismatch Issue

## Problem Diagnosis

Your production site at `dromkok.com` shows MIME type errors and 404s for all Next.js static assets:

```
Refused to apply style from 'http://dromkok.com/_next/static/css/d4cee35c6f61a1c2.css' 
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

**Root Cause**: 
- Nginx is configured to proxy to `http://localhost:3000`
- Your production app runs on port `3001` (per `.env.production`)
- All requests are hitting a non-existent service, returning 404 HTML pages instead of JS/CSS

## Solution

### Option 1: Quick Fix via SSH (Recommended)

1. **Upload the updated nginx config:**
   ```bash
   scp dromkok.com_nginx/nginx_ssl_config.conf root@dromkok.com:/tmp/
   ```

2. **SSH into your server:**
   ```bash
   ssh root@dromkok.com
   ```

3. **Backup and update nginx config:**
   ```bash
   # Backup current config
   sudo cp /etc/nginx/sites-available/www.dromkok.com /etc/nginx/sites-available/www.dromkok.com.backup

   # Copy new config
   sudo cp /tmp/nginx_ssl_config.conf /etc/nginx/sites-available/www.dromkok.com

   # Test config
   sudo nginx -t

   # If test passes, reload nginx
   sudo systemctl reload nginx
   ```

4. **Verify the app is running:**
   ```bash
   cd /www/wwwroot/www.dromkok.com/web
   pm2 status
   
   # If not running, start it:
   pm2 restart dromkok-web
   ```

5. **Test the site:**
   ```bash
   curl -I http://localhost:3001
   curl -I https://www.dromkok.com
   ```

### Option 2: Using the Update Script

1. **Upload the script:**
   ```bash
   scp dromkok.com_nginx/update_nginx_port.sh root@dromkok.com:/tmp/
   ```

2. **SSH and run the script:**
   ```bash
   ssh root@dromkok.com
   sudo bash /tmp/update_nginx_port.sh
   ```

### Option 3: Manual Edit on Server

1. **SSH into server:**
   ```bash
   ssh root@dromkok.com
   ```

2. **Edit nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/www.dromkok.com
   ```

3. **Find and replace all instances of:**
   ```nginx
   proxy_pass http://localhost:3000;
   ```
   
   **With:**
   ```nginx
   proxy_pass http://localhost:3001;
   ```
   
   (Should be 5 locations: main `/`, `/api/`, static files, favicon, robots.txt)

4. **Test and reload:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Changes Made

The following nginx configuration changes were made:

1. **Main location block**: `localhost:3000` → `localhost:3001`
2. **API routes**: `localhost:3000` → `localhost:3001`
3. **Static files**: `localhost:3000` → `localhost:3001`
4. **Favicon**: `localhost:3000` → `localhost:3001`
5. **Robots.txt**: `localhost:3000` → `localhost:3001`

## Verification Steps

After applying the fix:

1. **Clear browser cache** (Important!)
   - Chrome: Ctrl+Shift+Del → Clear cached images and files
   - Or open in incognito mode

2. **Check site loads:**
   ```bash
   curl -I https://www.dromkok.com
   ```
   Should return `200 OK`

3. **Check static assets:**
   ```bash
   curl -I https://www.dromkok.com/_next/static/css/d4cee35c6f61a1c2.css
   ```
   Should return `200 OK` with `Content-Type: text/css`

4. **Check nginx logs:**
   ```bash
   tail -f /var/log/nginx/www.dromkok.com_error.log
   tail -f /var/log/nginx/www.dromkok.com_access.log
   ```

5. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs dromkok-web
   ```

## Rollback Plan

If something goes wrong:

```bash
# Restore backup
sudo cp /etc/nginx/sites-available/www.dromkok.com.backup /etc/nginx/sites-available/www.dromkok.com

# Reload nginx
sudo systemctl reload nginx
```

## Port Configuration Reference

**Current Setup:**
- Development (local): Port `3005` (`.env.local`)
- Production (server): Port `3001` (`.env.production`)
- Nginx proxy: Must point to `3001`

**Files Updated:**
- `dromkok.com_nginx/nginx_ssl_config.conf` - Updated to port 3001

**Files to Deploy:**
- Upload updated config to `/etc/nginx/sites-available/www.dromkok.com`

## Common Issues After Fix

### Site still shows "Loading..."
- **Cause**: Browser cached old HTML/JS
- **Fix**: Hard refresh (Ctrl+F5) or clear cache

### PM2 app not running
```bash
cd /www/wwwroot/www.dromkok.com/web
pm2 restart dromkok-web
# or if not found:
pm2 start server.js --name dromkok-web --env production
pm2 save
```

### Port 3001 not responding
```bash
# Check what's on port 3001
sudo netstat -tlnp | grep 3001

# If nothing, restart the app
cd /www/wwwroot/www.dromkok.com/web
NODE_ENV=production npm start
# or
pm2 restart dromkok-web
```

## Next Steps

After the fix is applied:

1. Monitor nginx error logs for 24 hours
2. Check Google Search Console for crawl errors
3. Consider adding health check endpoint
4. Update monitoring to alert on port mismatches

## Prevention

To prevent this in the future:

1. **Document port configuration** in deployment guide
2. **Add health checks** to deployment workflow
3. **Add port verification** to deployment script:
   ```bash
   # In deploy.yml, add after PM2 restart:
   echo "Verifying app is running on port 3001..."
   timeout 30 bash -c 'until curl -f http://localhost:3001; do sleep 1; done'
   ```

## Contact

If issues persist after applying this fix:
- Check PM2 logs: `pm2 logs dromkok-web`
- Check nginx logs: `tail -f /var/log/nginx/www.dromkok.com_error.log`
- Verify .env.production has `PORT=3001`
