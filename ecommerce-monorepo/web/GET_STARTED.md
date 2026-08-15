# 🚀 Get Started in 5 Minutes

## ✅ Files Already Created

All deployment pipeline files are ready in your local machine:

```
✅ deploy.sh                    - Main deployment script
✅ ecosystem.config.js          - PM2 configuration  
✅ test-deployment.sh           - Testing script
✅ server-setup.sh              - Server setup
✅ backup.sh                    - Database backup
✅ rollback.sh                  - Rollback script
✅ .github/workflows/deploy.yml - GitHub Actions
✅ webhook-config.json          - Webhook config
✅ Complete documentation       - 4 detailed guides
```

## 📍 Quick Steps

### Step 1: Sync to GitHub (30 seconds)

On Windows:
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo
sync-deployment.bat
```

Or manually:
```bash
git add .
git commit -m "Add deployment pipeline"
git push origin main
```

### Step 2: Setup Server (2 minutes)

```bash
# Connect
ssh djdn@your-server-ip

# Navigate
cd /www/wwwroot/www.dromkok.com/web

# Pull
git pull origin main

# Setup
chmod +x server-setup.sh
./server-setup.sh
```

### Step 3: Deploy (1 minute)

```bash
./deploy.sh
```

## 🎉 Done!

Your automated deployment pipeline is now active.

## 📖 Learn More

- **Quick Start**: [README_DEPLOYMENT.md](./README_DEPLOYMENT.md)
- **Full Setup**: [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
- **Commands**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Overview**: [DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md)

## 🆘 Need Help?

```bash
# Test setup
./test-deployment.sh

# Check status
pm2 status

# View logs
pm2 logs dromkok-shop
```

---

**Total Time**: ~5 minutes  
**Next Deploy**: Just push to GitHub or run `./deploy.sh`
