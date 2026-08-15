# 🚀 Automated Deployment Pipeline

Complete automated deployment system for Next.js 14 e-commerce platform with database safety, backups, and rollback capabilities.

## ✨ Features

- ✅ **Automated GitHub Deployment** - Push to main → Auto-deploy
- ✅ **Database Backups** - Automatic backup before each deployment
- ✅ **Safe Migrations** - Never lose production data
- ✅ **Rollback Support** - Restore to previous version anytime
- ✅ **PM2 Management** - Process monitoring and auto-restart
- ✅ **Deployment Logs** - Track every deployment
- ✅ **GitHub Actions** - CI/CD integration
- ✅ **Webhook Support** - Instant deployments
- ✅ **Lock Mechanism** - Prevent concurrent deployments

## 📦 What's Included

```
web/
├── deploy.sh                    # Main deployment script
├── ecosystem.config.js          # PM2 configuration
├── test-deployment.sh           # Testing script
├── DEPLOYMENT_SETUP.md          # Detailed setup guide
├── QUICK_REFERENCE.md           # Command reference
├── prisma/migrations/
│   └── backup.sh               # Database backup script
└── scripts/
    └── rollback.sh             # Rollback script
```

## 🚀 Quick Start (3 Steps)

### Step 1: Sync to GitHub (On Local Machine - Windows)

```bash
# Run the sync script
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo
sync-deployment.bat
```

### Step 2: Setup on Server (SSH)

```bash
# Connect to server
ssh djdn@your-server-ip

# Navigate to project
cd /www/wwwroot/www.dromkok.com/web

# Pull deployment files
git pull origin main

# Make scripts executable
chmod +x deploy.sh
chmod +x prisma/migrations/backup.sh
chmod +x scripts/rollback.sh
chmod +x test-deployment.sh

# Create backup directory
mkdir -p /home/djdn/backups

# Test the setup
./test-deployment.sh
```

### Step 3: Deploy!

```bash
# Run deployment
./deploy.sh
```

That's it! Your deployment pipeline is ready. 🎉

## 📖 Documentation

- **[DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)** - Complete setup guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command reference
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Original deployment docs

## 🎯 Common Tasks

### Deploy to Production
```bash
ssh djdn@your-server-ip
cd /www/wwwroot/www.dromkok.com/web
./deploy.sh
```

### Check Server Status
```bash
pm2 status
pm2 logs dromkok-shop
```

### Create Manual Backup
```bash
./prisma/migrations/backup.sh
```

### Rollback to Previous Version
```bash
./scripts/rollback.sh
```

### View Deployment Logs
```bash
tail -f deploy.log
```

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Process                        │
└─────────────────────────────────────────────────────────────┘

1. 🔒 Check Lock        → Prevent concurrent deployments
2. 💾 Backup Database   → Create timestamped backup
3. 📥 Pull Code         → Git pull from main branch
4. 📦 Install Deps      → npm install
5. 🔧 Generate Prisma   → npx prisma generate
6. 🗄️ Migrate DB        → npx prisma db push (safe)
7. 🏗️ Build Project     → npm run build
8. 🔄 Restart PM2       → pm2 restart dromkok-shop
9. ✅ Verify Status     → Check server is online
10. 🧹 Cleanup          → Remove lock, log completion
```

## 🛡️ Database Safety

### What We Use (Safe) ✅
```bash
npx prisma db push --accept-data-loss
```
- Applies schema changes
- Preserves all existing data
- Never drops tables
- Safe for production

### What We NEVER Use (Dangerous) ❌
```bash
npx prisma migrate reset          # Deletes ALL data
npx prisma db push --force-reset  # Drops tables
```

### Automatic Backups
- Created before every deployment
- Timestamped filenames
- Compressed with gzip
- Stored in `/home/djdn/backups/`
- Keeps last 5 backups automatically

## 📊 Monitoring

### Real-Time Logs
```bash
# Deployment log
tail -f /www/wwwroot/www.dromkok.com/web/deploy.log

# PM2 logs
pm2 logs dromkok-shop

# PM2 monitoring
pm2 monit
```

### Check Backups
```bash
ls -lh /home/djdn/backups/
```

### Server Status
```bash
pm2 status
pm2 describe dromkok-shop
```

## ⚠️ Troubleshooting

### Deployment Failed
```bash
# Check logs
tail -50 deploy.log
pm2 logs dromkok-shop --lines 100

# Restart manually
pm2 restart dromkok-shop
```

### Port Already in Use
```bash
sudo lsof -i :3001
pm2 restart dromkok-shop
```

### Permission Denied
```bash
chmod +x deploy.sh
chmod +x prisma/migrations/backup.sh
chmod +x scripts/rollback.sh
```

### Build Error
```bash
rm -rf .next
npm install
npm run build
```

## 🔐 GitHub Actions Setup

### Add Secrets to GitHub

1. Go to repository **Settings** → **Secrets** → **Actions**
2. Add these secrets:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | Your server IP |
| `SERVER_USER` | djdn |
| `SERVER_PASSWORD` | SSH password |
| `SERVER_PORT` | 22 |

### Test GitHub Actions

```bash
# Make a small change
git add .
git commit -m "Test deployment"
git push origin main
```

Check the **Actions** tab on GitHub to monitor deployment.

## 🪝 Webhook Setup (Optional)

For instant deployments on every push:

```bash
# Install webhook
sudo apt install webhook -y

# Setup webhook service
sudo cp webhook-config.json /etc/webhook/hooks.json

# Generate secret
openssl rand -hex 32

# Update webhook config with secret
sudo nano /etc/webhook/hooks.json

# Start webhook service
sudo systemctl enable webhook
sudo systemctl start webhook
```

Add webhook to GitHub:
- URL: `http://your-server-ip:9000/hooks/deploy`
- Content type: `application/json`
- Secret: Your generated secret
- Event: Push events

## 📝 Deployment Checklist

### Before Deployment
- [ ] Test changes locally
- [ ] Commit to Git
- [ ] Push to GitHub
- [ ] Review GitHub Actions (if enabled)

### After Deployment
- [ ] Check PM2 status
- [ ] Test website functionality
- [ ] Review deployment logs
- [ ] Verify database backup exists

## 🎓 Learn More

- **Full Setup**: See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
- **Commands**: See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Original Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🆘 Need Help?

```bash
# Test deployment setup
./test-deployment.sh

# View deployment log
cat deploy.log

# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs dromkok-shop
```

## 📈 Version History

- **v1.0.0** (2026-07-13) - Initial release
  - Automated deployment script
  - Database backup system
  - Rollback capability
  - GitHub Actions integration
  - Webhook support
  - Comprehensive documentation

## 🤝 Support

For issues or questions:
1. Check `deploy.log` for errors
2. Review `DEPLOYMENT_SETUP.md`
3. Test with `./test-deployment.sh`
4. Check PM2 logs: `pm2 logs dromkok-shop`

---

**Status**: ✅ Production Ready  
**Platform**: Next.js 14, PostgreSQL, PM2, Ubuntu 24.04  
**Last Updated**: July 13, 2026
