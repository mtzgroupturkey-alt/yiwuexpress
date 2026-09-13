# Complete Localhost to Production Migration Guide

## Overview

This guide will help you copy **everything** from your Windows localhost to your Ubuntu production server:
- ✅ All project files
- ✅ Complete database with all data
- ✅ Uploaded images and media
- ✅ Configuration (with backup of production settings)

---

## Prerequisites

### On Windows (Localhost)

1. **WAMP/MySQL Running**
   - Make sure MySQL service is running
   - Your database should be accessible

2. **Command Line Tools**
   - Git Bash (comes with Git for Windows) - **Recommended**
   - OR Windows PowerShell
   - OR WSL (Windows Subsystem for Linux)

3. **SSH Access to Production**
   - Server IP or domain
   - SSH username and password/key
   - SSH port (usually 22)

### On Production Server (Ubuntu)

1. **Server Access**
   - Root or sudo access
   - SSH enabled

2. **Required Software**
   - Node.js (v22)
   - PM2 (process manager)
   - Nginx (web server)
   - MySQL or PostgreSQL
   - Git

---

## Step 1: Configure Migration Script

Open `migrate-localhost-to-production.ps1` (for PowerShell) or `migrate-localhost-to-production.sh` (for Git Bash/Linux).

Update these values:

```powershell
# Production Server Details
$ProdServer = "123.456.789.0"          # Your server IP or domain
$ProdUser = "root"                      # SSH username
$ProdPort = 22                          # SSH port
$ProdTargetDir = "/www/wwwroot/www.dromkok.com/web"  # Production path

# Local Paths
$LocalProjectDir = "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web"

# Database Configuration
$LocalDbName = "yiwuexpress"           # Your local database name
$LocalDbUser = "root"                   # Usually "root" for WAMP
$LocalDbPass = ""                       # Usually empty for WAMP

# Production Database
$ProdDbName = "dromkok"                 # Production database name
$ProdDbUser = "dromkok_user"            # Production DB user
$ProdDbPass = "YOUR_SECURE_PASSWORD"    # Production DB password
```

---

## Step 2: Prepare Local Environment

### A. Ensure Database is Ready

```powershell
# Test database connection
cd c:\wamp64\bin\mysql\mysql8.0.X\bin
.\mysql.exe -u root -e "SHOW DATABASES;"

# Verify your database exists
.\mysql.exe -u root -e "USE yiwuexpress; SHOW TABLES;"
```

### B. Clean Local Project (Optional)

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Remove build artifacts (they'll be rebuilt on production)
rm -rf .next node_modules coverage
```

### C. Test SSH Connection

```bash
# Test you can connect to production
ssh root@your-server-ip

# If successful, exit
exit
```

---

## Step 3: Run Migration

### Option A: Using PowerShell (Recommended for Windows)

```powershell
# Open PowerShell as Administrator
cd c:\wamp64\www\yiwuexpress

# Run migration script
.\migrate-localhost-to-production.ps1

# Or with custom parameters
.\migrate-localhost-to-production.ps1 -ProdServer "123.456.789.0" -ProdUser "root"
```

### Option B: Using Git Bash

```bash
# Open Git Bash
cd /c/wamp64/www/yiwuexpress

# Make script executable
chmod +x migrate-localhost-to-production.sh

# Run migration
./migrate-localhost-to-production.sh
```

---

## Step 4: What Happens During Migration

### 1. Database Export (1-5 minutes)
- Exports your entire local database to SQL file
- Includes all tables, data, and structure
- File saved to temporary directory

### 2. File Archive (2-10 minutes)
- Creates compressed archive of all project files
- Excludes: node_modules, .next, .git, logs
- Includes: source code, uploads, public files

### 3. Upload to Production (5-30 minutes)
- Depends on your internet speed
- Uploads database dump (~10-100MB)
- Uploads project archive (~50-500MB)

### 4. Production Deployment (10-20 minutes)
- **Backs up current production** (important!)
- Stops PM2 processes
- Extracts new files
- Imports database
- Installs npm dependencies
- Generates Prisma client
- Builds Next.js application
- Starts PM2 processes
- Reloads Nginx

### 5. Verification
- Tests site is accessible
- Checks API health endpoint
- Reports any issues

---

## Step 5: Post-Migration Checklist

### A. Verify Site is Working

1. **Visit Production URL**
   ```
   https://www.dromkok.com
   ```

2. **Test Key Features**
   - [ ] Homepage loads
   - [ ] Can browse products
   - [ ] Can view product details
   - [ ] Search works
   - [ ] Categories load
   - [ ] User login works
   - [ ] Admin panel accessible
   - [ ] Images display correctly

### B. Check Production Environment

```bash
# SSH into production
ssh root@your-server-ip

# Check PM2 status
pm2 status

# View logs
pm2 logs dromkok-web --lines 50

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check disk space
df -h

# View database
mysql -u dromkok_user -p
> USE dromkok;
> SHOW TABLES;
> SELECT COUNT(*) FROM products;
> exit;
```

### C. Update Production .env

```bash
# SSH into server
cd /www/wwwroot/www.dromkok.com/web

# Edit environment file
nano .env

# Essential variables to check/update:
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
JWT_SECRET="your-64-character-secret"
NEXT_PUBLIC_API_URL="https://www.dromkok.com"
NEXT_PUBLIC_SITE_URL="https://www.dromkok.com"

# Stripe keys (if using payments)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_live_..."

# Email (if configured)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Save and exit (Ctrl+O, Enter, Ctrl+X)

# Restart to apply changes
pm2 restart all
```

---

## Troubleshooting

### Issue: "mysqldump not found"

**Solution:**
```bash
# Add MySQL to PATH (Git Bash)
export PATH="/c/wamp64/bin/mysql/mysql8.0.31/bin:$PATH"

# Or use full path
/c/wamp64/bin/mysql/mysql8.0.31/bin/mysqldump.exe -u root yiwuexpress > dump.sql
```

### Issue: "ssh: command not found"

**Solution for PowerShell:**
```powershell
# Install OpenSSH
Add-WindowsCapability -Online -Name OpenSSH.Client*
```

**Solution: Use Git Bash** (easier)
- Download: https://git-scm.com/download/win
- Includes ssh, scp, and Linux tools

### Issue: "Permission denied (publickey)"

**Solution:**
```bash
# Use password authentication
ssh -o PreferredAuthentications=password root@your-server-ip

# Or setup SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"
ssh-copy-id root@your-server-ip
```

### Issue: Database Import Fails

**Check production database exists:**
```bash
ssh root@your-server-ip

# For MySQL
mysql -u root -p
CREATE DATABASE IF NOT EXISTS dromkok;
GRANT ALL ON dromkok.* TO 'dromkok_user'@'localhost' IDENTIFIED BY 'password';
exit;

# For PostgreSQL
sudo -u postgres psql
CREATE DATABASE dromkok;
CREATE USER dromkok_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE dromkok TO dromkok_user;
\q
```

### Issue: PM2 Process Won't Start

**Solution:**
```bash
ssh root@your-server-ip
cd /www/wwwroot/www.dromkok.com/web

# Check for errors
npm run build

# Check .env exists
cat .env

# Start manually
pm2 delete all
pm2 start npm --name "dromkok-web" -- run start
pm2 save

# View logs
pm2 logs
```

### Issue: Site Returns 502 Bad Gateway

**Causes:**
1. PM2 process not running
2. Wrong port in Nginx config
3. Firewall blocking

**Solution:**
```bash
# Check PM2
pm2 status
pm2 restart all

# Check Nginx config
sudo nginx -t
cat /etc/nginx/sites-available/dromkok.com

# Should proxy to localhost:3001
location / {
    proxy_pass http://localhost:3001;
    ...
}

# Reload Nginx
sudo systemctl reload nginx

# Check port 3001
netstat -tulpn | grep 3001
```

---

## Rollback Procedure

If something goes wrong, you can restore the backup:

```bash
# SSH into server
ssh root@your-server-ip

# Find latest backup
ls -lah /www/backups/

# Example: /www/backups/dromkok_backup_20260902_150000

# Stop current process
pm2 stop all

# Restore files
cd /www/wwwroot/www.dromkok.com
rm -rf web
cp -r /www/backups/dromkok_backup_TIMESTAMP/web .

# Restore database
mysql -u dromkok_user -p dromkok < /www/backups/dromkok_backup_TIMESTAMP/database_backup.sql

# Restart
cd web
pm2 restart all
```

---

## Manual Migration (Alternative Method)

If the script fails, you can migrate manually:

### 1. Export Database Locally

```bash
cd c:\wamp64\bin\mysql\mysql8.0.31\bin
.\mysqldump.exe -u root yiwuexpress > c:\temp\database.sql
```

### 2. Create Archive

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
tar -czf c:\temp\project.tar.gz --exclude=node_modules --exclude=.next .
```

### 3. Upload via SFTP

Use FileZilla, WinSCP, or command line:
```bash
scp c:\temp\database.sql root@server:/tmp/
scp c:\temp\project.tar.gz root@server:/tmp/
```

### 4. Deploy on Server

```bash
ssh root@server

# Extract
cd /www/wwwroot/www.dromkok.com/web
tar -xzf /tmp/project.tar.gz

# Import DB
mysql -u dromkok_user -p dromkok < /tmp/database.sql

# Build
npm install
npx prisma generate
npm run build

# Restart
pm2 restart all
```

---

## Performance Tips

### Speed Up Future Migrations

1. **Use rsync instead of full archive:**
   ```bash
   rsync -avz --exclude=node_modules \
     c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/ \
     root@server:/www/wwwroot/www.dromkok.com/web/
   ```

2. **Incremental database dumps:**
   ```bash
   # Only dump changed data
   mysqldump --single-transaction --quick yiwuexpress > dump.sql
   ```

3. **Compress uploads separately:**
   ```bash
   # Upload images less frequently
   tar -czf uploads.tar.gz public/uploads/
   ```

---

## Security Considerations

1. **Use SSH Keys** (not passwords)
2. **Strong Database Passwords** in production
3. **Different JWT_SECRET** than localhost
4. **Update .env** with production values
5. **Enable Firewall** (ufw on Ubuntu)
6. **SSL Certificate** via Let's Encrypt
7. **Regular Backups** (automate with cron)

---

## Automated Backups

Setup daily backups on production:

```bash
# Create backup script
sudo nano /root/backup-dromkok.sh

#!/bin/bash
BACKUP_DIR="/www/backups/daily_$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
mysqldump -u dromkok_user -pPASSWORD dromkok > "$BACKUP_DIR/database.sql"
tar -czf "$BACKUP_DIR/web.tar.gz" /www/wwwroot/www.dromkok.com/web
# Keep only last 7 days
find /www/backups -name "daily_*" -mtime +7 -exec rm -rf {} \;

# Make executable
chmod +x /root/backup-dromkok.sh

# Add to crontab (daily at 3 AM)
crontab -e
0 3 * * * /root/backup-dromkok.sh
```

---

## Summary

✅ **What Gets Migrated:**
- All source code files
- Complete database with all data
- Uploaded images and files
- Public assets

✅ **What Gets Rebuilt:**
- node_modules (fresh install)
- .next build (fresh build)
- Prisma client (regenerated)

✅ **What You Must Update:**
- Production .env file
- Database credentials
- API URLs
- Payment gateway keys

---

## Need Help?

1. **Check logs:**
   - `pm2 logs` on production
   - Migration script output
   - `/var/log/nginx/error.log`

2. **Common issues:** See Troubleshooting section above

3. **Test locally first:** Try migration to a test server

4. **Backup before migrating:** Script automatically creates backups

---

**Ready to migrate? Run the script and follow the prompts!**

```powershell
.\migrate-localhost-to-production.ps1
```
