# Deployment Pipeline - Quick Reference

## 🚀 Quick Commands

### Deploy to Production
```bash
ssh djdn@your-server-ip
cd /www/wwwroot/www.dromkok.com/web
./deploy.sh
```

### Check Status
```bash
pm2 status
pm2 logs dromkok-shop
tail -f deploy.log
```

### Manual Backup
```bash
./prisma/migrations/backup.sh
```

### Rollback
```bash
./scripts/rollback.sh
```

### Restart Server
```bash
pm2 restart dromkok-shop
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `deploy.sh` | Main deployment script |
| `ecosystem.config.js` | PM2 configuration |
| `prisma/migrations/backup.sh` | Database backup |
| `scripts/rollback.sh` | Rollback to previous version |
| `deploy.log` | Deployment logs |

## 📍 Important Paths

| Path | Description |
|------|-------------|
| `/www/wwwroot/www.dromkok.com/web` | Production code |
| `/home/djdn/backups/` | Database backups |
| `/home/djdn/.pm2/logs/` | PM2 logs |
| `.next/` | Next.js build output |

## 🔄 Deployment Process

1. **Backup database** → Creates timestamped backup
2. **Pull code** → Git pull from main branch
3. **Install deps** → npm install
4. **Generate Prisma** → npx prisma generate
5. **Migrate DB** → npx prisma db push
6. **Build** → npm run build
7. **Restart** → pm2 restart
8. **Verify** → Check server status

## ⚠️ Troubleshooting

### Server Won't Start
```bash
pm2 logs dromkok-shop --lines 50
pm2 restart dromkok-shop
```

### Port Already in Use
```bash
sudo lsof -i :3001
sudo kill -9 $(sudo lsof -t -i:3001)
pm2 restart dromkok-shop
```

### Database Connection Failed
```bash
psql -U ecommerce -d ecommerce
sudo systemctl status postgresql
```

### Build Failed
```bash
npm install
npm run build
```

### Permission Denied
```bash
chmod +x deploy.sh
chmod +x prisma/migrations/backup.sh
chmod +x scripts/rollback.sh
```

## 🔐 GitHub Actions Secrets

Add these in GitHub Settings → Secrets:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | Your server IP |
| `SERVER_USER` | djdn |
| `SERVER_PASSWORD` | Your SSH password |
| `SERVER_PORT` | 22 |

## 📊 Monitoring Commands

```bash
# PM2 Status
pm2 status

# Live Logs
pm2 logs dromkok-shop --lines 50

# Deployment Log
tail -f /www/wwwroot/www.dromkok.com/web/deploy.log

# List Backups
ls -lh /home/djdn/backups/

# Disk Usage
df -h

# Memory Usage
free -h

# Check Port
sudo lsof -i :3001
```

## 🛡️ Database Safety

### ✅ Safe Commands
```bash
npx prisma db push --accept-data-loss
npx prisma generate
npx prisma studio
```

### ❌ Dangerous Commands (NEVER USE)
```bash
# DO NOT USE THESE IN PRODUCTION
npx prisma migrate reset
npx prisma db push --force-reset
```

## 🔧 Maintenance

### Update Dependencies
```bash
cd /www/wwwroot/www.dromkok.com/web
npm update
npm audit fix
```

### Clean Build
```bash
rm -rf .next
npm run build
pm2 restart dromkok-shop
```

### Reset PM2
```bash
pm2 delete dromkok-shop
pm2 start ecosystem.config.js
pm2 save
```

## 📞 Emergency Contacts

| Issue | Command |
|-------|---------|
| Server down | `pm2 restart dromkok-shop` |
| Database error | `./scripts/rollback.sh` |
| Can't connect | Check firewall/nginx |
| Build failed | `rm -rf .next && npm run build` |

## 🎯 Pre-Deployment Checklist

- [ ] Test changes locally
- [ ] Commit and push to GitHub
- [ ] Check GitHub Actions status
- [ ] Backup database manually (optional)
- [ ] Monitor deployment logs
- [ ] Verify website is accessible
- [ ] Check PM2 status

## 📝 Post-Deployment Checklist

- [ ] Check PM2 status (`pm2 status`)
- [ ] Verify website works
- [ ] Check logs for errors
- [ ] Verify database backup exists
- [ ] Test key functionality

---

**Quick Help**: For detailed instructions, see `DEPLOYMENT_SETUP.md`
