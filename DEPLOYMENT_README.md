# 🚀 Deployment Guide - Yiwu Express to dromkok.com

Quick guide to sync your localhost project with your production server.

## 📍 Server Details

- **Domain:** https://www.dromkok.com
- **Server IP:** 39.175.57.2
- **Server Path:** `/www/wwwroot/www.dromkok.com/web`
- **Server User:** `root`

---

## 🎯 Quick Start (3 Simple Steps)

### Step 1: Setup SSH Access (One-time)

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096

# Copy to server
ssh-copy-id root@39.175.57.2

# Test connection
ssh root@39.175.57.2
```

### Step 2: First Time Setup

Follow the complete checklist:
```bash
# Open the checklist
SERVER_SETUP_CHECKLIST.md
```

### Step 3: Deploy

**Option A: Quick Sync (Fastest)**
```bash
# Double-click this file for instant sync
quick-sync.bat
```

**Option B: Full Sync (Complete deployment)**
```bash
# Interactive menu
sync-to-server.bat

# Or directly
sync-to-server.bat --full
```

---

## 📂 Available Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `quick-sync.bat` | Fast sync of code changes | After small code changes |
| `sync-to-server.bat` | Full deployment tool | Major updates, first deployment |
| `sync-to-server.sh` | Bash version (Git Bash/WSL) | Same as above |
| `connect-server.bat` | Quick SSH connection | Access server terminal |
| `SYNC_GUIDE.md` | Complete documentation | Learn all sync options |
| `SERVER_SETUP_CHECKLIST.md` | Server setup guide | First-time server setup |

---

## 🔄 Common Workflows

### Workflow 1: Quick Code Update
```bash
# Make your changes
# Test locally: npm run dev

# Quick sync (30 seconds)
quick-sync.bat

# Done! Check: https://www.dromkok.com
```

### Workflow 2: Major Update
```bash
# Make changes
# Update dependencies if needed

# Full sync (3-5 minutes)
sync-to-server.bat --full

# Verify deployment
```

### Workflow 3: Database Update
```bash
# Update Prisma schema
# Edit: ecommerce-monorepo/web/prisma/schema.prisma

# Sync database
sync-to-server.bat --db

# Sync code
sync-to-server.bat --quick
```

### Workflow 4: Environment Variables
```bash
# Update .env.production locally

# Sync to server
sync-to-server.bat --env

# Restart application
ssh root@39.175.57.2 "pm2 restart all"
```

---

## 🛠️ Useful Commands

### Connect to Server
```bash
# Quick SSH connection
connect-server.bat

# Or manually
ssh root@39.175.57.2
```

### Check Application Status
```bash
ssh root@39.175.57.2 "pm2 status"
ssh root@39.175.57.2 "pm2 logs yiwuexpress"
```

### View Logs
```bash
# Application logs
ssh root@39.175.57.2 "pm2 logs yiwuexpress --lines 50"

# Nginx error logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/www.dromkok.com_error.log"

# Nginx access logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/www.dromkok.com_access.log"
```

### Restart Application
```bash
ssh root@39.175.57.2 "pm2 restart yiwuexpress"

# Or restart Nginx
ssh root@39.175.57.2 "systemctl restart nginx"
```

---

## 🚨 Troubleshooting

### Problem: SSH Connection Failed

**Solution:**
```bash
# Check if server is reachable
ping 39.175.57.2

# Try manual SSH
ssh root@39.175.57.2

# If password asked, setup SSH key again
ssh-copy-id root@39.175.57.2
```

### Problem: Sync Failed

**Solution:**
```bash
# Check SSH connection first
ssh root@39.175.57.2 "echo 'Connected'"

# Try manual sync
cd ecommerce-monorepo\web
scp -r app root@39.175.57.2:/www/wwwroot/www.dromkok.com/
```

### Problem: Website Not Loading

**Solution:**
```bash
# Check if application is running
ssh root@39.175.57.2 "pm2 status"

# Check if port 3000 is listening
ssh root@39.175.57.2 "netstat -tulpn | grep :3000"

# Restart application
ssh root@39.175.57.2 "pm2 restart yiwuexpress"

# Check Nginx
ssh root@39.175.57.2 "systemctl status nginx"
```

### Problem: Database Error

**Solution:**
```bash
# Check database connection
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com && npx prisma db pull"

# Check PostgreSQL
ssh root@39.175.57.2 "systemctl status postgresql"

# View database logs
ssh root@39.175.57.2 "tail -f /var/log/postgresql/postgresql-*.log"
```

---

## 📚 Documentation

- **Complete Sync Guide:** [SYNC_GUIDE.md](SYNC_GUIDE.md)
- **Server Setup:** [SERVER_SETUP_CHECKLIST.md](SERVER_SETUP_CHECKLIST.md)
- **SSL Deployment:** [dromkok.com_nginx/SSL_DEPLOYMENT_GUIDE.md](dromkok.com_nginx/SSL_DEPLOYMENT_GUIDE.md)

---

## 🔐 Security Notes

1. **Never commit .env files**
   ```bash
   # Already in .gitignore
   .env.local
   .env.production
   ```

2. **Use SSH keys, not passwords**
   ```bash
   ssh-keygen -t rsa -b 4096
   ssh-copy-id root@39.175.57.2
   ```

3. **Backup before major changes**
   ```bash
   # Database backup
   ssh root@39.175.57.2 "pg_dump -U postgres yiwuexpress > /backup/db_$(date +%Y%m%d).sql"
   
   # File backup
   ssh root@39.175.57.2 "tar -czf /backup/files_$(date +%Y%m%d).tar.gz /www/wwwroot/www.dromkok.com"
   ```

---

## 📊 Monitoring

### Check Website Health
- https://www.dromkok.com
- https://www.sslshopper.com/ssl-checker.html#hostname=www.dromkok.com

### Server Resources
```bash
ssh root@39.175.57.2 "htop"          # CPU/Memory
ssh root@39.175.57.2 "df -h"         # Disk space
ssh root@39.175.57.2 "pm2 monit"     # Application monitoring
```

---

## 🎯 Next Steps

1. ✅ **Complete initial setup:** `SERVER_SETUP_CHECKLIST.md`
2. ✅ **Test quick sync:** `quick-sync.bat`
3. ✅ **Verify deployment:** Visit https://www.dromkok.com
4. ✅ **Setup monitoring:** Configure alerts
5. ✅ **Schedule backups:** Daily database backups

---

## 💡 Tips

- Use `quick-sync.bat` for fast updates (recommended for daily work)
- Use `sync-to-server.bat --full` for complete deployments
- Always test locally before syncing: `npm run dev`
- Check logs after deployment: `ssh root@39.175.57.2 "pm2 logs"`
- Backup before major changes

---

## 📞 Support

- **GitHub Issues:** https://github.com/abbasbalkhi2010/yiwuexpress/issues
- **Documentation:** This folder contains all guides
- **Server Access:** SSH to 39.175.57.2

---

**Happy Deploying! 🎉**

*Last Updated: $(date)*
