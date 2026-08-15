# Fix for 404 Upload Errors

## Problem
Files uploaded to `/uploads/general/` return 404 errors even though they exist in `public/uploads/general/`.

## Root Cause
The production server at `www.dromkok.com` is not serving static files from the `public/uploads/` directory correctly. This happens because:
1. Nginx is handling static files but not configured for `/uploads` path
2. Or Next.js server isn't serving the public folder in production

## Solution 1: Configure Nginx (Recommended for Production)

Add this to your nginx configuration for `www.dromkok.com`:

```nginx
# Add this inside the server {} block for www.dromkok.com
location /uploads/ {
    alias /www/wwwroot/www.dromkok.com/web/public/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Make sure static files are served directly by nginx
location /_next/static/ {
    alias /www/wwwroot/www.dromkok.com/web/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

Then reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Solution 2: Fix File Permissions

The uploaded files might have incorrect permissions. Run this on the server:

```bash
cd /www/wwwroot/www.dromkok.com/web/public/uploads
chmod 755 general favicons breadcrumb products
chmod 644 general/* favicons/* breadcrumb/* products/* 2>/dev/null || true
```

## Solution 3: Check if Files Exist

SSH into your server and verify:

```bash
cd /www/wwwroot/www.dromkok.com/web/public/uploads/general
ls -la
```

If files exist but still show 404, it's an nginx configuration issue.

## Solution 4: Restart Next.js Server

After uploading files, restart the Node.js server:

```bash
cd /www/wwwroot/www.dromkok.com/web
pm2 restart www.dromkok.com  # or whatever your PM2 process name is
# OR
npm run build && npm run start
```

## Quick Test

1. Upload a logo via the admin panel
2. Check if file exists:
   ```bash
   ls -la /www/wwwroot/www.dromkok.com/web/public/uploads/general/
   ```
3. Try to access directly:
   ```
   https://www.dromkok.com/uploads/general/[filename]
   ```
4. Check nginx error log:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

## Most Likely Fix

Based on the error pattern, **you need to add nginx configuration for `/uploads/` path**. The nginx config file is probably at:
- `/etc/nginx/sites-available/www.dromkok.com`
- Or `/etc/nginx/conf.d/www.dromkok.com.conf`

Add the `location /uploads/` block from Solution 1 above.
