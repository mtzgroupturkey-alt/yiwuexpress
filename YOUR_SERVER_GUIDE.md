# Your Dromkok Server - Quick Reference

## Server Details

```
Server IP:   39.175.57.2
SSH User:    djdn
SSH Port:    22
Password:    [your SSH password]

Project:     /www/wwwroot/www.dromkok.com/web
Backup:      /www/backups/
Domain:      https://www.dromkok.com
```

---

## Quick Migration (5 Minutes Setup)

### 1. Update MySQL Password

Edit `deploy-to-dromkok.ps1` and set your production MySQL root password:

```powershell
# Line 9 - Update this:
[string]$MySQLPassword = "your_mysql_root_password"
```

### 2. Run Migration

**PowerShell (Run as Administrator):**
```powershell
cd c:\wamp64\www\yiwuexpress
.\deploy-to-dromkok.ps1
```

**Git Bash:**
```bash
cd /c/wamp64/www/yiwuexpress
powershell -ExecutionPolicy Bypass -File ./deploy-to-dromkok.ps1
```

Type `yes` when prompted, wait 30-60 minutes.

---

## Your Current Manual Process (What You Do Now)

```bash
# 1. Connect to server
ssh djdn@39.175.57.2 -p 22

# 2. Navigate and cleanup
cd /www/wwwroot/www.dromkok.com/web
sudo rm -rf /www/wwwroot/www.dromkok.com/yiwuexpress

# 3. Clone from GitHub
sudo git clone http://github.com/mtzgroupturkey-alt/yiwuexpress.git
cd yiwuexpress/ecommerce-monorepo

# 4. Remove old folders and move new
sudo rm -rf /www/wwwroot/www.dromkok.com/docker
sudo rm -rf /www/wwwroot/www.dromkok.com/mobile
sudo rm -rf /www/wwwroot/www.dromkok.com/web
sudo mv * /www/wwwroot/www.dromkok.com/
sudo mv .* /www/wwwroot/www.dromkok.com/ 2>/dev/null

# 5. Cleanup and setup
cd /www/wwwroot/www.dromkok.com/
sudo rm -rf /www/wwwroot/www.dromkok.com/yiwuexpress
cd /www/wwwroot/www.dromkok.com/web

# 6. Set permissions and build
sudo chown -R $(whoami):$(whoami) /www/wwwroot/www.dromkok.com/web
npm install
npm run build
```

---

## What the Script Does (Automated Version)

✅ **Backs up production** → `/www/backups/dromkok_backup_TIMESTAMP/`
✅ **Exports local database** → Entire `yiwuexpress` database
✅ **Archives project files** → All source code, excludes node_modules
✅ **Uploads to server** → Both database and files
✅ **Imports database** → Into production MySQL
✅ **Extracts files** → Into `/www/wwwroot/www.dromkok.com/web`
✅ **Installs dependencies** → `npm install`
✅ **Builds Next.js** → `npm run build`
✅ **Restarts PM2** → Restarts the application
✅ **Verifies** → Tests site is responding

---

## Essential Commands

### Connect to Server
```bash
ssh djdn@39.175.57.2 -p 22
```

### Check Server Status
```bash
# Where am I?
pwd

# List files
ls -la

# Go to project
cd /www/wwwroot/www.dromkok.com/web

# Check PM2 status
pm2 status

# View logs
pm2 logs dromkok-web --lines 50

# Restart app
pm2 restart all
```

### Database Commands
```bash
# Connect to MySQL
mysql -u root -p

# Show databases
SHOW DATABASES;

# Use database
USE yiwuexpress;

# Show tables
SHOW TABLES;

# Count products
SELECT COUNT(*) FROM products;

# Exit
exit;
```

### File Management
```bash
# Check disk space
df -h

# Check folder size
du -sh /www/wwwroot/www.dromkok.com/web

# List backups
ls -lh /www/backups/

# View recent changes
cd /www/wwwroot/www.dromkok.com/web
git log --oneline -10
```

---

## Migration Options

### Full Migration (Files + Database)
```powershell
.\deploy-to-dromkok.ps1
```

### Files Only (Skip Database)
```powershell
.\deploy-to-dromkok.ps1 -SkipDatabase
```

### Database Only
```powershell
.\deploy-to-dromkok.ps1 -OnlyDatabase
```

---

## Troubleshooting

### Site Not Loading

```bash
ssh djdn@39.175.57.2

# Check PM2
pm2 status
# Should show "online"

# Check logs
pm2 logs dromkok-web --lines 100
# Look for errors

# Restart if needed
pm2 restart all

# Check port 3001
netstat -tulpn | grep 3001
# Should show Node.js listening
```

### Nginx Issues

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View error log
sudo tail -f /var/log/nginx/error.log
```

### Database Issues

```bash
# Test database connection
mysql -u root -p yiwuexpress -e "SHOW TABLES;"

# Check database size
mysql -u root -p -e "SELECT table_schema, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'yiwuexpress';"
```

### Build Errors

```bash
cd /www/wwwroot/www.dromkok.com/web

# Clean install
rm -rf node_modules .next
npm install

# Check for errors
npm run build

# If Prisma errors
npx prisma generate
npm run build
```

---

## Rollback to Previous Version

```bash
# Connect to server
ssh djdn@39.175.57.2

# List backups
ls -lh /www/backups/

# Stop current app
pm2 stop all

# Restore from backup
cd /www/wwwroot/www.dromkok.com
sudo rm -rf web
sudo cp -r /www/backups/dromkok_backup_20260902_150000/web .

# Set permissions
sudo chown -R djdn:djdn web

# Restart
cd web
pm2 restart all
```

---

## Update .env on Production

```bash
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web

# Edit environment
nano .env

# Update these values:
NODE_ENV=production
DATABASE_URL="mysql://root:password@localhost:3306/yiwuexpress"
JWT_SECRET="generate-64-character-random-string"
NEXT_PUBLIC_API_URL="https://www.dromkok.com"
NEXT_PUBLIC_SITE_URL="https://www.dromkok.com"

# Save: Ctrl+O, Enter, Ctrl+X

# Restart to apply
pm2 restart all
```

---

## Database Migration

### Export from Windows Localhost
```bash
# In PowerShell or Git Bash
cd c:\wamp64\bin\mysql\mysql8.0.31\bin
.\mysqldump.exe -u root yiwuexpress > c:\temp\yiwuexpress_backup.sql
```

### Import to Production
```bash
# Upload to server
scp -P 22 c:\temp\yiwuexpress_backup.sql djdn@39.175.57.2:/tmp/

# SSH into server
ssh djdn@39.175.57.2

# Import
mysql -u root -p yiwuexpress < /tmp/yiwuexpress_backup.sql

# Cleanup
rm /tmp/yiwuexpress_backup.sql
```

---

## Monitoring

### Check Site Health
```bash
# From your Windows machine
curl https://www.dromkok.com
curl https://www.dromkok.com/api/health
```

### Check Server Resources
```bash
ssh djdn@39.175.57.2

# CPU and Memory
top

# Or better view
htop

# Disk space
df -h

# Memory usage
free -h
```

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Process info
pm2 info dromkok-web

# Memory usage
pm2 list
```

---

## Regular Maintenance

### Weekly Tasks

```bash
# 1. Update system packages
ssh djdn@39.175.57.2
sudo apt update && sudo apt upgrade -y

# 2. Clean PM2 logs
pm2 flush

# 3. Check disk space
df -h

# 4. Backup database
mysqldump -u root -p yiwuexpress > ~/backups/weekly_$(date +%Y%m%d).sql
```

### Monthly Tasks

```bash
# 1. Update Node.js dependencies
cd /www/wwwroot/www.dromkok.com/web
npm outdated
npm update

# 2. Rebuild application
npm run build
pm2 restart all

# 3. Clean old backups
find /www/backups -mtime +30 -type d -exec rm -rf {} \;
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Connect | `ssh djdn@39.175.57.2` |
| Go to project | `cd /www/wwwroot/www.dromkok.com/web` |
| Check status | `pm2 status` |
| View logs | `pm2 logs` |
| Restart app | `pm2 restart all` |
| Test database | `mysql -u root -p yiwuexpress` |
| Check site | `curl https://www.dromkok.com` |
| Edit .env | `nano .env` |
| Build app | `npm run build` |
| View backups | `ls /www/backups/` |

---

## Emergency Contacts

- **Hosting Provider:** [Your host support]
- **Domain Registrar:** [Your domain provider]
- **Server IP:** 39.175.57.2
- **SSH User:** djdn

---

## Files You Have

✅ `deploy-to-dromkok.ps1` - Automated migration script
✅ `YOUR_SERVER_GUIDE.md` - This file
✅ `MIGRATION_GUIDE.md` - Detailed guide
✅ `QUICK_MIGRATION_STEPS.md` - Fast reference

**Ready to migrate?**

```powershell
cd c:\wamp64\www\yiwuexpress
.\deploy-to-dromkok.ps1
```
