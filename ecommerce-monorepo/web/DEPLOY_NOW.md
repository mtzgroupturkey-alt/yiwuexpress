# Deploy Middleware Fix to Production

## The Problem

The middleware fix code is **already in your git repository** but your **production server is running old code**.

- ✅ Code changes are committed
- ✅ Files are ready
- ❌ Production server needs to pull and restart

## Quick Deploy (Option 1 - Recommended)

### Step 1: SSH into your production server

```bash
ssh root@your-server-ip
# or
ssh your-username@dromkok.com
```

### Step 2: Run the deployment script

```bash
cd /root/ecommerce-monorepo/web
bash deploy-middleware-fix.sh
```

That's it! The script will:
1. Pull latest code
2. Install dependencies
3. Build the application
4. Restart PM2
5. Verify it's running

---

## Manual Deploy (Option 2)

If you prefer to do it manually:

### Step 1: SSH into server

```bash
ssh root@your-server
```

### Step 2: Navigate to project

```bash
cd /root/ecommerce-monorepo/web
```

### Step 3: Pull latest code

```bash
git pull origin production
```

### Step 4: Install & Build

```bash
npm install
npm run build
```

### Step 5: Restart

```bash
pm2 restart ecommerce-monorepo
```

### Step 6: Check logs

```bash
pm2 logs ecommerce-monorepo --lines 50
```

---

## GitHub Actions Deploy (Option 3 - Automatic)

If you have GitHub Actions set up:

### Push to trigger deployment

```bash
# On your LOCAL machine
cd /c/wamp64/www/yiwuexpress/ecommerce-monorepo/web

# The changes are already committed, just push
git push origin production
```

GitHub Actions will automatically:
1. Build the project
2. Deploy to production server
3. Restart PM2

---

## Verify Deployment

After deploying, test these URLs:

1. **Root URL**: http://dromkok.com
   - Should redirect to `/en/`
   - No "Loading..." stuck
   - No MIME type errors in console

2. **English**: http://dromkok.com/en/
   - Should load homepage
   - All CSS/JS files load correctly

3. **Russian**: http://dromkok.com/ru/
   - Should load homepage in Russian

4. **Chinese**: http://dromkok.com/zh/
   - Should load homepage in Chinese

### Check Browser Console

Open Developer Tools (F12) and check Console:
- ✅ No MIME type errors
- ✅ No 404 errors for CSS/JS files
- ✅ No "refused to apply style" errors

### Check Network Tab

In Developer Tools → Network:
- ✅ `/` returns 307 redirect to `/en/`
- ✅ `/_next/static/*.css` returns 200 with `Content-Type: text/css`
- ✅ `/_next/static/*.js` returns 200 with `Content-Type: application/javascript`

---

## If Deployment Fails

### Check PM2 status

```bash
pm2 status
pm2 logs ecommerce-monorepo
```

### Check if app is responding

```bash
curl http://localhost:3001/api/health
```

### Check nginx logs

```bash
tail -f /var/log/nginx/www.dromkok.com_error.log
```

### Restart manually if needed

```bash
pm2 restart ecommerce-monorepo
pm2 logs ecommerce-monorepo
```

---

## Troubleshooting

### Issue: Git pull shows conflicts

```bash
# Stash local changes first
git stash
git pull origin production
git stash pop
```

### Issue: Build fails

```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Issue: PM2 not responding

```bash
# Stop and start PM2
pm2 stop ecommerce-monorepo
pm2 start ecommerce-monorepo
pm2 save
```

---

## After Successful Deployment

### Monitor for 30 minutes

```bash
# Watch PM2 logs
pm2 logs ecommerce-monorepo

# Watch nginx access logs
tail -f /var/log/nginx/www.dromkok.com_access.log

# Watch nginx error logs
tail -f /var/log/nginx/www.dromkok.com_error.log
```

### Expected log patterns

**Access log - good pattern:**
```
GET / HTTP/1.1" 307 - (redirect to /en/)
GET /en/ HTTP/1.1" 200 - (success)
GET /_next/static/css/xyz.css HTTP/1.1" 200 - (CSS loads)
```

**Error log should be quiet:**
- No 404s for public routes
- No 401s for static assets

---

## Contact

If you need help deploying:
1. Share error messages from `pm2 logs`
2. Share nginx error log output
3. Confirm which option you're using (script, manual, or GitHub Actions)

---

**Status:** Ready to Deploy  
**Risk:** Low (well-tested fix)  
**Downtime:** ~10-15 seconds during PM2 restart  
**Rollback:** Easy (`git reset --hard HEAD~1` + rebuild + restart)
