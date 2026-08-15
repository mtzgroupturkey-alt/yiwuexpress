# 🚀 Server Sync Guide - Yiwu Express

Complete guide for syncing your localhost project with the production server at dromkok.com.

## 📋 Prerequisites

### 1. Install Required Tools

**For Windows:**

```powershell
# Option 1: Install Git for Windows (includes SSH and Git Bash)
# Download: https://git-scm.com/downloads

# Option 2: Enable OpenSSH in Windows
# Go to Settings > Apps > Optional Features > Add OpenSSH Client

# Option 3: Install via PowerShell (Admin)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

**For better performance, install rsync:**
```bash
# Via WSL (Windows Subsystem for Linux)
wsl --install

# Or via Git Bash
# rsync comes pre-installed with Git for Windows
```

### 2. Configure SSH Key Authentication

```powershell
# Generate SSH key (if not exists)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy key to server
ssh-copy-id root@39.175.57.2

# Test connection
ssh root@39.175.57.2
```

### 3. Test Connection

```powershell
# Test SSH connection
ssh root@39.175.57.2 "echo 'Connection successful'"
```

---

## 🎯 Quick Start

### Using the Batch Script (Windows)

```cmd
# Interactive menu
sync-to-server.bat

# Direct commands
sync-to-server.bat --full      # Full sync
sync-to-server.bat --quick     # Quick sync
sync-to-server.bat --db        # Database sync
sync-to-server.bat --env       # Environment sync
sync-to-server.bat --help      # Show help
```

### Using the Bash Script (Git Bash/WSL)

```bash
# Make script executable
chmod +x sync-to-server.sh

# Interactive menu
./sync-to-server.sh

# Direct commands
./sync-to-server.sh --full     # Full sync
./sync-to-server.sh --quick    # Quick sync
./sync-to-server.sh --db       # Database sync
./sync-to-server.sh --env      # Environment sync
```

---

## 📦 Sync Options Explained

### 1. Full Sync (--full)

**What it does:**
- Builds the Next.js application locally
- Syncs all files to server (except node_modules, logs, etc.)
- Installs production dependencies on server
- Restarts the application

**When to use:**
- First deployment
- Major updates
- After package.json changes

**Command:**
```bash
./sync-to-server.sh --full
# or
sync-to-server.bat --full
```

**Time:** 3-10 minutes depending on changes

---

### 2. Quick Sync (--quick)

**What it does:**
- Syncs only changed files (app, components, lib)
- Does NOT build or install dependencies
- Restarts the application

**When to use:**
- Small code changes
- Bug fixes
- UI updates

**Command:**
```bash
./sync-to-server.sh --quick
# or
sync-to-server.bat --quick
```

**Time:** 30 seconds - 2 minutes

---

### 3. Database Sync (--db)

**What it does:**
- Syncs Prisma schema to server
- Runs `prisma db push` on server
- Applies database migrations

**When to use:**
- Schema changes
- New models added
- Database structure updates

**Command:**
```bash
./sync-to-server.sh --db
# or
sync-to-server.bat --db
```

**⚠️ Warning:** This may cause data loss in production. Always backup first!

---

### 4. Environment Sync (--env)

**What it does:**
- Syncs .env.production to server
- Overwrites production environment variables

**When to use:**
- New environment variables added
- API keys updated
- Configuration changes

**Command:**
```bash
./sync-to-server.sh --env
# or
sync-to-server.bat --env
```

**⚠️ Warning:** This will overwrite production environment files!

---

## 🗂️ Files Excluded from Sync

The following files/folders are NOT synced:

```
- node_modules/          # Reinstalled on server
- .next/cache/          # Build cache
- .env.local            # Local environment
- .env.development      # Development environment
- coverage/             # Test coverage reports
- .git/                 # Git repository
- logs/                 # Log files
- *.log                 # Log files
```

---

## 🔧 Manual Sync Commands

### Using rsync (Recommended)

```bash
# Sync all files
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next/cache' \
  --exclude '.env.local' \
  --exclude '.git' \
  ecommerce-monorepo/web/ \
  root@39.175.57.2:/www/wwwroot/www.dromkok.com/web/

# Sync specific folder
rsync -avz --progress \
  ecommerce-monorepo/web/app/ \
  root@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/
```

### Using SCP (Slower)

```bash
# Sync .next folder
scp -r ecommerce-monorepo/web/.next root@39.175.57.2:/www/wwwroot/www.dromkok.com/web/

# Sync app folder
scp -r ecommerce-monorepo/web/app root@39.175.57.2:/www/wwwroot/www.dromkok.com/web/

# Sync single file
scp ecommerce-monorepo/web/next.config.js root@39.175.57.2:/www/wwwroot/www.dromkok.com/web/
```

---

## 🔄 Typical Workflow

### Development Workflow

```bash
# 1. Make changes locally
# 2. Test locally
npm run dev

# 3. Commit changes
git add .
git commit -m "Your changes"
git push

# 4. Quick sync to server
./sync-to-server.sh --quick

# 5. Test on production
# Visit https://www.dromkok.com
```

### Major Update Workflow

```bash
# 1. Make major changes
# 2. Test locally
npm run dev
npm test

# 3. Update dependencies if needed
npm install

# 4. Commit and push
git add .
git commit -m "Major update"
git push

# 5. Full sync to server
./sync-to-server.sh --full

# 6. Verify on production
# Visit https://www.dromkok.com
```

### Database Update Workflow

```bash
# 1. Update Prisma schema
# Edit prisma/schema.prisma

# 2. Test locally
npx prisma db push
npm run dev

# 3. Commit changes
git add .
git commit -m "Database update"
git push

# 4. Sync database
./sync-to-server.sh --db

# 5. Sync code
./sync-to-server.sh --quick

# 6. Verify on production
```

---

## 🚨 Troubleshooting

### SSH Connection Issues

```bash
# Check if server is reachable
ping 39.175.57.2

# Check SSH service
ssh root@39.175.57.2 "systemctl status ssh"

# Regenerate SSH key
ssh-keygen -t rsa -b 4096
ssh-copy-id root@39.175.57.2

# Test with verbose output
ssh -v root@39.175.57.2
```

### Permission Denied

```bash
# Fix permissions on server
ssh root@39.175.57.2 "chmod -R 755 /www/wwwroot/www.dromkok.com/web"
ssh root@39.175.57.2 "chown -R www:www /www/wwwroot/www.dromkok.com/web"
```

### Application Not Starting

```bash
# Check logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/www.dromkok.com_error.log"

# Check if port 3000 is in use
ssh root@39.175.57.2 "netstat -tulpn | grep :3000"

# Restart application manually
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com/web && npm run start"

# Check PM2 status (if using PM2)
ssh root@39.175.57.2 "pm2 status"
ssh root@39.175.57.2 "pm2 logs"
```

### Database Sync Failed

```bash
# Check database connection
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com/web && npx prisma db pull"

# Reset database (⚠️ CAUTION: Data loss!)
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com/web && npx prisma migrate reset --force"

# Check database logs
ssh root@39.175.57.2 "tail -f /var/log/postgresql/postgresql-*.log"
```

### Nginx Issues

```bash
# Check nginx status
ssh root@39.175.57.2 "systemctl status nginx"

# Test nginx config
ssh root@39.175.57.2 "nginx -t"

# Restart nginx
ssh root@39.175.57.2 "systemctl restart nginx"

# Check nginx logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/error.log"
```

---

## 🔐 Security Best Practices

1. **Never commit .env files to git**
   ```bash
   # Add to .gitignore
   echo ".env.local" >> .gitignore
   echo ".env.production" >> .gitignore
   ```

2. **Use SSH keys, not passwords**
   ```bash
   # Disable password authentication on server
   ssh root@39.175.57.2 "sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config"
   ssh root@39.175.57.2 "systemctl restart sshd"
   ```

3. **Backup before major changes**
   ```bash
   # Backup database
   ssh root@39.175.57.2 "pg_dump -U postgres yiwuexpress > /backup/db_$(date +%Y%m%d).sql"

   # Backup files
   ssh root@39.175.57.2 "tar -czf /backup/files_$(date +%Y%m%d).tar.gz /www/wwwroot/www.dromkok.com/web"
   ```

4. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Application logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/www.dromkok.com_access.log"

# Error logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/www.dromkok.com_error.log"

# PM2 logs (if using PM2)
ssh root@39.175.57.2 "pm2 logs"

# System logs
ssh root@39.175.57.2 "journalctl -u nginx -f"
```

### Monitor Resources

```bash
# Server resources
ssh root@39.175.57.2 "htop"

# Disk usage
ssh root@39.175.57.2 "df -h"

# Memory usage
ssh root@39.175.57.2 "free -m"

# CPU usage
ssh root@39.175.57.2 "top"
```

---

## 🌐 Useful URLs

- **Production Site:** https://www.dromkok.com
- **SSL Check:** https://www.sslshopper.com/ssl-checker.html
- **SSL Labs:** https://www.ssllabs.com/ssltest/

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Check server logs
3. Contact server administrator
4. Check GitHub issues: https://github.com/abbasbalkhi2010/yiwuexpress/issues

---

## 📝 Notes

- Server IP: `39.175.57.2`
- Server User: `root`
- Server Path: `/www/wwwroot/www.dromkok.com/web`
- Database: PostgreSQL
- Web Server: Nginx
- Node.js Port: 3000

---

## 🔄 Automated Sync (Optional)

### Using Git Hooks

Create `.git/hooks/post-commit`:

```bash
#!/bin/bash
# Auto-sync after commit
./sync-to-server.sh --quick
```

### Using Cron (Server-side)

```bash
# Edit crontab
crontab -e

# Add daily backup
0 2 * * * pg_dump -U postgres yiwuexpress > /backup/db_$(date +\%Y\%m\%d).sql
```

---

**Happy Syncing! 🎉**
