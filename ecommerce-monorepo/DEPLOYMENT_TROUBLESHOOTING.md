# Deployment Troubleshooting Guide

## Common Deployment Issues

### Issue 1: "App failed to start after 30 seconds" (Exit Code 7)

**Symptoms:**
- GitHub Actions shows: `curl: (7) Failed to connect to host`
- PM2 shows app as "online" but curl can't connect
- Deployment fails at verification step

**Root Cause:**
The app takes time to fully start after PM2 restart. The old verification ran immediately without waiting.

**Solution (Already Applied):**
Updated `.github/workflows/deploy.yml` to wait up to 30 seconds for the app to respond.

**Manual Check:**
```bash
ssh root@dromkok.com
pm2 status
curl -I http://localhost:3001
curl -I http://localhost:3001/api/health
```

---

### Issue 2: Port Mismatch (3000 vs 3001)

**Symptoms:**
- Browser shows "Loading..." indefinitely
- Console errors: "MIME type ('text/html') is not a supported stylesheet"
- All `_next/static/*` files return 404

**Root Cause:**
Nginx proxies to port 3000, but app runs on 3001.

**Solution:**
See `dromkok.com_nginx/FIX_NOW.txt` and run the fix scripts.

**Manual Fix:**
```bash
ssh root@dromkok.com
sudo nano /etc/nginx/sites-available/www.dromkok.com
# Change all "localhost:3000" to "localhost:3001"
sudo nginx -t && sudo systemctl reload nginx
```

---

### Issue 3: Database Connection Failed

**Symptoms:**
- Health check returns 503
- App logs show database connection errors
- Prisma errors in PM2 logs

**Diagnostic:**
```bash
ssh root@dromkok.com
cd /www/wwwroot/www.dromkok.com/web
cat .env.production | grep DATABASE_URL
pm2 logs dromkok-web | grep -i database
```

**Solution:**
```bash
# Check DATABASE_URL is correct
# Should be: postgresql://user:password@localhost:5432/ecommerce

# Test database connection
cd /www/wwwroot/www.dromkok.com/web
npx prisma db pull

# If database doesn't exist
psql -U postgres
CREATE DATABASE ecommerce;
\q

# Run migrations
npx prisma migrate deploy
```

---

### Issue 4: Build Fails on Server

**Symptoms:**
- `npm run build` fails during deployment
- Out of memory errors
- TypeScript compilation errors

**Diagnostic:**
```bash
ssh root@dromkok.com
cd /www/wwwroot/www.dromkok.com/web
npm run build
```

**Solutions:**

**Out of Memory:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Missing Dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Prisma Client Not Generated:**
```bash
npx prisma generate
npm run build
```

---

### Issue 5: PM2 Process Keeps Restarting

**Symptoms:**
- PM2 shows high restart count
- App status flips between "online" and "errored"
- Site is intermittently unavailable

**Diagnostic:**
```bash
ssh root@dromkok.com
pm2 status
pm2 logs dromkok-web --lines 100
```

**Common Causes:**

**Port Already in Use:**
```bash
# Check what's using port 3001
sudo netstat -tlnp | grep 3001
# Kill conflicting process if needed
sudo kill <PID>
pm2 restart dromkok-web
```

**Environment Variables Missing:**
```bash
cd /www/wwwroot/www.dromkok.com/web
cat .env.production
# Ensure all required vars are set:
# - DATABASE_URL
# - JWT_SECRET
# - NEXT_PUBLIC_API_URL
```

**File Permissions:**
```bash
cd /www/wwwroot/www.dromkok.com/web
sudo chown -R $USER:$USER .
chmod -R 755 .
```

---

### Issue 6: Static Files Not Loading

**Symptoms:**
- HTML loads but CSS/JS don't
- `_next/static/*` returns 404
- Images in `/uploads/` don't display

**Diagnostic:**
```bash
ssh root@dromkok.com
cd /www/wwwroot/www.dromkok.com/web
ls -la .next/
ls -la public/uploads/
```

**Solutions:**

**Missing Build Output:**
```bash
cd /www/wwwroot/www.dromkok.com/web
rm -rf .next
npm run build
pm2 restart dromkok-web
```

**Nginx Not Proxying Correctly:**
```bash
# Check nginx config
sudo nginx -t
cat /etc/nginx/sites-available/www.dromkok.com | grep proxy_pass
# Should all be localhost:3001

# Reload nginx
sudo systemctl reload nginx
```

**File Permissions:**
```bash
chmod -R 755 /www/wwwroot/www.dromkok.com/web/.next
chmod -R 755 /www/wwwroot/www.dromkok.com/web/public
```

---

### Issue 7: GitHub Actions Timeout

**Symptoms:**
- Deployment runs for 30 minutes then fails
- "command_timeout exceeded" error

**Root Cause:**
Network issues during git operations or npm install.

**Solution:**
The workflow already has retry logic for git operations. For npm:

```bash
# On server, manually update if needed
ssh root@dromkok.com
cd /www/wwwroot/www.dromkok.com/web
git pull origin production
npm install
npm run build
pm2 restart dromkok-web
```

---

### Issue 8: SSL Certificate Errors

**Symptoms:**
- Browser shows "Your connection is not private"
- SSL certificate warnings

**Diagnostic:**
```bash
# Check certificate expiry
ssh root@dromkok.com
openssl x509 -in /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt -noout -enddate

# Test SSL
curl -vI https://www.dromkok.com
```

**Solution:**
See `dromkok.com_nginx/README.md` for certificate renewal instructions.

---

## Deployment Checklist

Before deploying:

- [ ] Database backup created
- [ ] `.env.production` has all required variables
- [ ] Prisma schema is up to date
- [ ] Local build succeeds: `npm run build`
- [ ] Tests pass (if applicable)
- [ ] Nginx config is correct (port 3001)

After deploying:

- [ ] PM2 shows app as "online"
- [ ] `curl http://localhost:3001` returns 200
- [ ] Health check passes: `curl http://localhost:3001/api/health`
- [ ] Site loads in browser: https://www.dromkok.com
- [ ] No console errors in browser
- [ ] Static assets load (CSS, JS, images)
- [ ] Database operations work (login, browse products)

---

## Quick Commands Reference

```bash
# SSH to server
ssh root@dromkok.com

# Check app status
pm2 status
pm2 logs dromkok-web --lines 50

# Restart app
pm2 restart dromkok-web

# Check what's running on port 3001
sudo netstat -tlnp | grep 3001

# Test endpoints
curl -I http://localhost:3001
curl -I http://localhost:3001/api/health
curl -I https://www.dromkok.com

# Check nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl reload nginx

# View logs
tail -f /var/log/nginx/www.dromkok.com_error.log
pm2 logs dromkok-web --lines 100

# Manual deployment
cd /www/wwwroot/www.dromkok.com
git pull origin production
cd web
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart dromkok-web

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top -bn1 | head -20
```

---

## Emergency Rollback

If deployment breaks the site:

```bash
ssh root@dromkok.com
cd /www/wwwroot/www.dromkok.com

# Option 1: Git rollback
git log --oneline -10
git reset --hard <previous-working-commit>
cd web
npm install
npm run build
pm2 restart dromkok-web

# Option 2: Restore database backup
# (if migrations caused issues)
cd web
# Restore from backup file
psql -U postgres ecommerce < /path/to/backup.sql

# Option 3: Restore nginx config
sudo cp /etc/nginx/sites-available/www.dromkok.com.backup /etc/nginx/sites-available/www.dromkok.com
sudo systemctl reload nginx
```

---

## Getting Help

### Check Logs First

1. **PM2 logs:** `pm2 logs dromkok-web`
2. **Nginx error log:** `tail -f /var/log/nginx/www.dromkok.com_error.log`
3. **System logs:** `journalctl -u nginx -n 100`

### Provide This Information

When asking for help, include:

- Error message (full text)
- PM2 status: `pm2 status`
- PM2 logs: `pm2 logs dromkok-web --lines 50 --nostream`
- Nginx test: `sudo nginx -t`
- Port check: `sudo netstat -tlnp | grep 3001`
- Recent changes made
- What you've tried already

---

## Monitoring

Set up monitoring to catch issues early:

```bash
# Add to crontab to check every 5 minutes
crontab -e

# Add this line:
*/5 * * * * curl -f http://localhost:3001/api/health || echo "Health check failed" | mail -s "dromkok.com Down" your@email.com
```

Or use uptime monitoring services:
- UptimeRobot (free tier available)
- StatusCake
- Pingdom

---

## Performance Optimization

If site is slow:

```bash
# Enable PM2 cluster mode (use all CPU cores)
pm2 delete dromkok-web
pm2 start server.js --name dromkok-web -i max --env production
pm2 save

# Add Redis for caching (optional)
# See documentation for Redis setup

# Optimize database queries
# Run EXPLAIN on slow queries

# Add CDN for static assets (optional)
# Use Cloudflare or similar
```

---

**Last Updated:** 2026-08-14  
**For:** dromkok.com (YIWU EXPRESS)
