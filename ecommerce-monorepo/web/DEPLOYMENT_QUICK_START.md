# Deployment Dashboards - Quick Start Guide

## 🚀 Setup (One-Time)

### 1. Update Database Schema
```bash
cd web
npx prisma db push
```

### 2. Verify Environment Variables
Make sure these are set in your `.env` file:
```env
DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"
BACKUP_DIR="/home/djdn/backups"
DEPLOY_SCRIPT="/www/wwwroot/www.dromkok.com/web/deploy.sh"
DB_NAME="ecommerce"
DB_USER="ecommerce"
DB_PASSWORD="LzZH5p5SnRtNKfMy"
```

### 3. Access the Dashboards
- **Local**: http://localhost:3001/admin/deploy/local
- **Production**: https://www.dromkok.com/admin/deploy/online

---

## 📋 Quick Actions

### Local Development

#### Start Working
1. Open `/admin/deploy/local`
2. Click **Git Tab** → **Pull** to get latest code
3. Click **Database Tab** → **Sync Schema** if schema changed
4. Start coding!

#### Before Committing
1. **Build Tab** → **Lint** to check code quality
2. **Build Tab** → **Type Check** to verify TypeScript
3. **Git Tab** → **Commit** with message
4. **Git Tab** → **Push** to remote

### Production Deployment

#### Deploy New Version
1. Open `/admin/deploy/online`
2. Check **Server Status** (all green)
3. Click **Deploy Now**
4. Confirm deployment warning
5. Wait for completion (~2-5 minutes)
6. Verify in **Deployment History** tab

#### Emergency Rollback
1. Open `/admin/deploy/online`
2. Go to **Database Backups** tab
3. Find most recent backup before issue
4. Click **Rollback**
5. Confirm critical warning
6. Wait for restoration

---

## 🎯 Common Workflows

### Workflow 1: Local Development Cycle
```
Pull → Code → Sync DB → Build → Test → Commit → Push
```

1. **Pull** latest changes
2. Make your code changes
3. **Sync Schema** if models changed
4. **Build** to verify no errors
5. **Lint** and **Type Check**
6. **Commit** with descriptive message
7. **Push** to remote

### Workflow 2: Production Deployment
```
Verify Local → Check Status → Deploy → Monitor → Verify
```

1. Test locally first
2. Check production **Status Overview**
3. Review **Deployment History**
4. Click **Deploy Now**
5. Monitor **Server Logs** tab
6. Verify deployment success

### Workflow 3: Database Management
```
Backup → Make Changes → Test → Deploy
```

1. **Create Backup** before risky changes
2. Make database schema changes
3. Test locally
4. Deploy to production
5. Keep backup for 24h before cleanup

---

## ⚡ Keyboard Shortcuts

While we don't have built-in shortcuts yet, you can bookmark:
- **Local**: `Ctrl+D` → localhost:3001/admin/deploy/local
- **Production**: `Ctrl+D` → www.dromkok.com/admin/deploy/online

---

## 🔔 Status Indicators

### Green (✓)
- ✅ Server online
- ✅ Database connected
- ✅ Git clean
- ✅ Deployment successful

### Yellow (⚠️)
- ⚠️ Git has uncommitted changes
- ⚠️ Deployment in progress
- ⚠️ Disk space >70%

### Red (✗)
- ❌ Server offline
- ❌ Database disconnected
- ❌ Deployment failed
- ❌ Disk space >80%

---

## 🚨 Emergency Procedures

### Server Down
1. Open `/admin/deploy/online`
2. Check **PM2 Server** status
3. Click **Restart Server**
4. Wait 30 seconds
5. Refresh page to verify

### Deployment Failed
1. Check **Deployment History** for error
2. Review **Server Logs** for details
3. Fix issue locally
4. Re-deploy

### Database Corruption
1. Go to **Database Backups** tab
2. Select latest good backup
3. Click **Rollback**
4. Confirm restoration
5. Verify data integrity

### Can't Access Dashboard
1. SSH into server: `ssh root@www.dromkok.com`
2. Check PM2: `pm2 list`
3. View logs: `pm2 logs dromkok-shop`
4. Restart: `pm2 restart dromkok-shop`

---

## 📊 Dashboard Features at a Glance

### Local Dashboard
| Feature | Action | Tab |
|---------|--------|-----|
| Pull code | Git → Pull | Git |
| Push code | Git → Push | Git |
| Commit | Git → Commit | Git |
| View history | Git → View Log | Git |
| Sync schema | Database → Sync Schema | Database |
| Seed data | Database → Seed Data | Database |
| Open Prisma | Database → Prisma Studio | Database |
| Build project | Build → Build | Build |
| Run tests | Build → Run Tests | Build |
| Lint code | Build → Lint | Build |

### Online Dashboard
| Feature | Action | Location |
|---------|--------|----------|
| Deploy | Deploy Now button | Top |
| Backup | Create Backup button | Top |
| Restart | Restart Server button | Top |
| View status | System Overview tab | Tab 1 |
| Check history | Deployment History tab | Tab 2 |
| Manage backups | Database Backups tab | Tab 3 |
| View logs | Server Logs tab | Tab 4 |

---

## 💡 Pro Tips

1. **Always backup before major changes**
   - Click "Create Backup" before deploying schema changes
   - Backups are automatic on deploy, but manual is safer

2. **Check logs if something fails**
   - Server Logs tab shows real-time issues
   - Deployment History shows past errors

3. **Test locally first**
   - Use Local Dashboard to verify changes
   - Build and test before deploying

4. **Monitor disk space**
   - Red indicator means >80% usage
   - Clean up old backups if needed

5. **Use commit messages wisely**
   - They appear in Deployment History
   - Make them descriptive

6. **Refresh status regularly**
   - Auto-refreshes every 30 seconds
   - Manual refresh with "Refresh Status" button

---

## 🔗 Quick Links

- **Local Dashboard**: `/admin/deploy/local`
- **Production Dashboard**: `/admin/deploy/online`
- **Old Deployment Page**: `/admin/deployment`
- **Full Documentation**: See `DEPLOYMENT_DASHBOARDS.md`

---

## 📞 Support

If you encounter issues:
1. Check **Server Logs** tab
2. Review **Deployment History** for errors
3. Consult `DEPLOYMENT_DASHBOARDS.md` for troubleshooting
4. SSH into server for direct debugging

---

**Last Updated**: 2026-07-13
**Version**: 1.0.0
