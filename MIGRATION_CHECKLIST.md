# 📋 Localhost to Production Migration Checklist

## Pre-Migration (15 minutes)

### ✅ Local Environment
- [ ] WAMP/MySQL is running
- [ ] Database `yiwuexpress` is accessible
- [ ] All recent changes are saved
- [ ] Latest code is working on localhost
- [ ] No active development in progress

### ✅ Required Information
- [ ] Production server IP/domain: `___________________`
- [ ] SSH username: `___________________`
- [ ] SSH password or key path: `___________________`
- [ ] Production database name: `___________________`
- [ ] Production database user: `___________________`
- [ ] Production database password: `___________________`

### ✅ Tools Installed
- [ ] Git Bash or PowerShell
- [ ] MySQL command-line tools (mysqldump)
- [ ] SSH client (ssh, scp commands)
- [ ] Text editor (for editing .env)

### ✅ Access Verification
- [ ] Can SSH into production: `ssh user@server`
- [ ] Can execute commands with sudo
- [ ] Production server has enough disk space (check: `df -h`)

---

## Configuration (5 minutes)

### ✅ Update Migration Script

Edit `migrate-localhost-to-production.ps1` or `.sh`:

```powershell
# Update these values:
$ProdServer = "YOUR_SERVER_IP"              # ← Update this
$ProdUser = "root"                          # ← Update if different
$ProdTargetDir = "/www/wwwroot/www.dromkok.com/web"  # ← Verify path
$LocalDbName = "yiwuexpress"                # ← Your local DB
$ProdDbName = "dromkok"                     # ← Update this
$ProdDbUser = "dromkok_user"                # ← Update this
$ProdDbPass = "SECURE_PASSWORD"             # ← Update this
```

- [ ] All server details updated
- [ ] Database credentials correct
- [ ] Paths are correct
- [ ] Script saved

---

## Migration Process (30-60 minutes)

### ✅ Step 1: Backup Current Production
```bash
ssh user@server
cd /www/wwwroot/www.dromkok.com
tar -czf ~/production_backup_$(date +%Y%m%d).tar.gz web/
mysqldump -u user -p database > ~/database_backup_$(date +%Y%m%d).sql
exit
```
- [ ] Production files backed up
- [ ] Production database backed up

### ✅ Step 2: Run Migration Script

**PowerShell:**
```powershell
cd c:\wamp64\www\yiwuexpress
.\migrate-localhost-to-production.ps1
```

**Git Bash:**
```bash
cd /c/wamp64/www/yiwuexpress
chmod +x migrate-localhost-to-production.sh
./migrate-localhost-to-production.sh
```

- [ ] Script started successfully
- [ ] Database exported (check for errors)
- [ ] Files archived
- [ ] Upload completed
- [ ] Production deployment finished
- [ ] No error messages

### ✅ Step 3: Verify Deployment

- [ ] Script reported success
- [ ] Site loads: https://www.dromkok.com
- [ ] API responds: https://www.dromkok.com/api/health
- [ ] No 502 Bad Gateway errors
- [ ] No 404 errors on homepage

---

## Post-Migration Configuration (15 minutes)

### ✅ Update Production .env

```bash
ssh user@server
cd /www/wwwroot/www.dromkok.com/web
nano .env
```

Check/update these values:
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (correct credentials)
- [ ] `JWT_SECRET` (64+ random characters)
- [ ] `NEXT_PUBLIC_API_URL` (production domain)
- [ ] `NEXT_PUBLIC_SITE_URL` (production domain)
- [ ] Stripe/PayPal keys (production keys, not test)
- [ ] Email/SMTP settings (if applicable)
- [ ] File saved and PM2 restarted: `pm2 restart all`

### ✅ Verify Database

```bash
ssh user@server
mysql -u dromkok_user -p dromkok
```

Run these checks:
- [ ] Database exists: `SHOW TABLES;`
- [ ] Products imported: `SELECT COUNT(*) FROM products;`
- [ ] Users imported: `SELECT COUNT(*) FROM users;`
- [ ] Categories exist: `SELECT COUNT(*) FROM categories;`
- [ ] Sample data looks correct
- [ ] Exit: `exit;`

---

## Testing (15 minutes)

### ✅ Frontend Tests

Visit: `https://www.dromkok.com`

- [ ] Homepage loads without errors
- [ ] Images display correctly
- [ ] Navigation works
- [ ] Product listing shows items
- [ ] Product detail pages work
- [ ] Search functionality works
- [ ] Category pages load
- [ ] No JavaScript console errors (F12)

### ✅ User Functions

- [ ] Can register new account
- [ ] Can login with existing account
- [ ] Can view profile
- [ ] Can add items to cart
- [ ] Can view cart
- [ ] Can update cart quantities
- [ ] Can add to wishlist
- [ ] Can view orders (if any)

### ✅ Admin Panel

Visit: `https://www.dromkok.com/admin`

- [ ] Admin login works
- [ ] Dashboard displays data
- [ ] Can view products
- [ ] Can view categories
- [ ] Can view orders
- [ ] Can upload images
- [ ] All admin functions work

### ✅ API Endpoints

- [ ] `/api/health` returns 200
- [ ] `/api/products` returns data
- [ ] `/api/categories` returns data
- [ ] `/api/auth/login` accepts requests
- [ ] API responses are fast (<500ms)

---

## Production Health Checks

### ✅ Server Status

```bash
ssh user@server

# Check PM2
pm2 status
# Expected: "online" status

# Check logs
pm2 logs dromkok-web --lines 50
# Expected: No error messages

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
# Expected: Active and running

# Check disk space
df -h
# Expected: At least 10% free

# Check memory
free -h
# Expected: Some free memory available

# Check port 3001
netstat -tulpn | grep 3001
# Expected: Node.js listening on 3001
```

- [ ] PM2 status: online
- [ ] No errors in logs
- [ ] Nginx is running
- [ ] Adequate disk space
- [ ] Adequate memory
- [ ] Port 3001 listening

---

## Performance Verification

### ✅ Speed Tests

```bash
# Test response time
curl -w "@-" -o /dev/null -s "https://www.dromkok.com" <<'EOF'
Total Time: %{time_total}s
HTTP Code: %{http_code}
EOF
```

- [ ] Homepage loads in < 3 seconds
- [ ] API responds in < 500ms
- [ ] Images load quickly
- [ ] No timeout errors

### ✅ Load Testing (Optional)

```bash
# Install Apache Bench (if available)
ab -n 100 -c 10 https://www.dromkok.com/

# Check results
```

- [ ] Server handles concurrent requests
- [ ] No 500 errors under load
- [ ] Response times are consistent

---

## Security Checks

### ✅ Security Verification

- [ ] HTTPS is enabled (https://)
- [ ] SSL certificate is valid (no browser warnings)
- [ ] `.env` file is not publicly accessible
- [ ] Database has strong password
- [ ] JWT_SECRET is unique and secure (64+ chars)
- [ ] Admin panel requires authentication
- [ ] API endpoints have proper auth
- [ ] No sensitive data in browser console
- [ ] No exposed API keys in frontend code

### ✅ Firewall (Optional but Recommended)

```bash
ssh user@server

# Check firewall status
sudo ufw status

# If inactive, enable it
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw enable
```

- [ ] Firewall configured
- [ ] Required ports open (22, 80, 443)

---

## Monitoring Setup (Optional)

### ✅ Uptime Monitoring

Setup free monitoring:
- [ ] UptimeRobot account created
- [ ] Monitor added for https://www.dromkok.com
- [ ] Email alerts configured

### ✅ Error Tracking

- [ ] Sentry or similar tool configured (optional)
- [ ] Error notifications working

---

## Documentation

### ✅ Record Details

Document these for future reference:

**Production Details:**
- Server IP: `___________________`
- SSH User: `___________________`
- Database Name: `___________________`
- Database User: `___________________`
- PM2 App Name: `___________________`
- Nginx Config Path: `/etc/nginx/sites-available/___________________`
- Deployment Date: `___________________`
- Migration Time: `___________________`

**Backup Locations:**
- Production backup: `/www/backups/dromkok_backup_TIMESTAMP/`
- Database backup: Included in above
- Local backup: `c:\temp\migration_TIMESTAMP\`

- [ ] Details recorded
- [ ] Team notified (if applicable)
- [ ] Documentation updated

---

## Final Verification

### ✅ 24-Hour Check

After 24 hours:
- [ ] Site still running
- [ ] No unexpected errors in logs
- [ ] PM2 process stable
- [ ] Memory usage normal
- [ ] Disk space not filling up
- [ ] No user complaints

---

## Success Criteria

✅ **Migration is successful if:**
- [ ] Site loads at production URL
- [ ] All features work
- [ ] Database data is correct
- [ ] Images display
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] SSL certificate valid
- [ ] PM2 process stable

---

## If Something Went Wrong

### 🚨 Rollback Procedure

```bash
ssh user@server
cd /www/wwwroot/www.dromkok.com

# Stop current
pm2 stop all

# Restore from backup
rm -rf web
cp -r /www/backups/dromkok_backup_TIMESTAMP/web .

# Restore database
mysql -u dromkok_user -p dromkok < /www/backups/dromkok_backup_TIMESTAMP/database_backup.sql

# Restart
cd web
pm2 restart all
```

- [ ] Backup restored
- [ ] Site working again
- [ ] Issue documented for next attempt

---

## Migration Complete! 🎉

**Congratulations!** Your site is now live on production.

**Next Steps:**
1. Monitor for 24-48 hours
2. Setup automated backups
3. Configure monitoring/alerts
4. Update DNS if needed
5. Test from different devices/networks
6. Consider CDN for static assets (optional)

**Keep these files safe:**
- `MIGRATION_GUIDE.md` - Detailed instructions
- `migrate-localhost-to-production.ps1` - Migration script
- Production `.env` file
- Backup archives

---

**Migration Date:** ___________________  
**Migrated By:** ___________________  
**Sign Off:** ___________________
