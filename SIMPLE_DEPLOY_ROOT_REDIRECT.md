# Simple Root Redirect Deployment

## What Was Changed

Two simple changes to force `http://dromkok.com` → `http://dromkok.com/en/`:

1. **app/page.tsx** - Simple server-side redirect
2. **nginx_ssl_config.conf** - Nginx level redirect (backup)

## Deploy Steps

### Step 1: Deploy Next.js App (Updated app/page.tsx)

```bash
# SSH into production server
ssh root@your-server

# Navigate to web directory
cd /root/ecommerce-monorepo/web

# Pull latest code
git pull origin production

# Build
npm run build

# Restart
pm2 restart ecommerce-monorepo

# Wait 10 seconds
sleep 10

# Test locally
curl -I http://localhost:3001/
# Should show: Location: /en/
```

### Step 2: Update Nginx Config (Optional but recommended)

```bash
# Still on production server
# Copy the updated nginx config
sudo cp /root/ecommerce-monorepo/dromkok.com_nginx/nginx_ssl_config.conf /etc/nginx/sites-available/dromkok.com

# Or edit directly and add this BEFORE the main location / block:
sudo nano /etc/nginx/sites-available/dromkok.com
```

Add this section:
```nginx
# Root Path Redirect - Force redirect to /en/
location = / {
    return 307 /en/;
}
```

Then reload nginx:
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 3: Test

```bash
# Test on server
curl -I http://localhost:3001/
curl -I http://dromkok.com/

# From your browser:
# Visit: http://dromkok.com
# Should redirect to: http://dromkok.com/en/
```

## Quick One-Line Deploy

```bash
ssh root@your-server "cd /root/ecommerce-monorepo/web && git pull origin production && npm run build && pm2 restart ecommerce-monorepo"
```

## Files Changed

- ✅ `ecommerce-monorepo/web/app/page.tsx` - Simple redirect('/en')
- ✅ `dromkok.com_nginx/nginx_ssl_config.conf` - Nginx redirect rule

## Verification

After deployment:

1. **Visit**: http://dromkok.com
2. **Expected**: Redirects to http://dromkok.com/en/
3. **Console**: No errors
4. **Network Tab**: See 307 redirect from / to /en/

Done! ✅
