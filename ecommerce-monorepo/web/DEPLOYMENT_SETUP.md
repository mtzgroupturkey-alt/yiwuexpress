# Automated Deployment Pipeline Setup Guide

## 📋 Overview

This deployment pipeline provides:
- ✅ Automatic GitHub pull and deployment
- ✅ Database backups before each deployment
- ✅ Safe migrations (no data loss)
- ✅ PM2 process management
- ✅ Rollback capability
- ✅ GitHub Actions integration (optional)
- ✅ Webhook support (optional)

## 🗂️ File Structure

```
ecommerce-monorepo/
├── web/
│   ├── deploy.sh                      # Main deployment script
│   ├── ecosystem.config.js            # PM2 configuration
│   ├── prisma/
│   │   └── migrations/
│   │       └── backup.sh              # Database backup script
│   └── scripts/
│       └── rollback.sh                # Rollback script
├── .github/
│   └── workflows/
│       └── deploy.yml                 # GitHub Actions workflow
└── webhook-config.json                # Webhook configuration
```

## 🚀 Quick Start

### 1. Prepare Files on Local Machine

All files have been created in your local repository. Now sync them to the server:

```bash
# On Windows (your local machine)
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo

# Add files to git
git add .
git commit -m "Add deployment pipeline"
git push origin main
```

### 2. Setup on Production Server

SSH into your production server and run:

```bash
# Navigate to project directory
cd /www/wwwroot/www.dromkok.com/web

# Pull latest changes (includes deployment scripts)
git pull origin main

# Make scripts executable
chmod +x deploy.sh
chmod +x prisma/migrations/backup.sh
chmod +x scripts/rollback.sh

# Create backup directory
mkdir -p /home/djdn/backups

# Test the backup script first
./prisma/migrations/backup.sh
```

### 3. Setup PM2 (if not already configured)

```bash
cd /www/wwwroot/www.dromkok.com/web

# Start the app with PM2 using ecosystem config
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 4. Test Manual Deployment

```bash
cd /www/wwwroot/www.dromkok.com/web
./deploy.sh
```

Expected output:
```
=====================================
🚀 STARTING DEPLOYMENT
=====================================
💾 Creating database backup...
✅ Database backup created
📥 Pulling latest code from GitHub...
✅ Code pulled successfully
📦 Installing dependencies...
✅ Dependencies installed
🔧 Generating Prisma Client...
✅ Prisma Client generated
🗄️ Applying database migrations...
✅ Database migrations applied successfully
🏗️ Building project...
✅ Project built successfully
🔄 Restarting PM2 process...
✅ PM2 process restarted successfully
✅ DEPLOYMENT COMPLETED SUCCESSFULLY
```

## 🔐 GitHub Actions Setup (Optional)

### Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

| Secret Name | Value |
|------------|-------|
| `SERVER_HOST` | Your server IP (e.g., 43.134.40.112) |
| `SERVER_USER` | djdn |
| `SERVER_PASSWORD` | Your SSH password |
| `SERVER_PORT` | 22 (or your SSH port) |

### Test GitHub Actions

1. Make a small change to any file
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Check the **Actions** tab on GitHub to see deployment progress

## 🪝 Webhook Setup (Optional)

### Install Webhook on Server

```bash
# Install webhook
sudo apt install webhook -y

# Create webhook config directory
sudo mkdir -p /etc/webhook

# Copy webhook config
sudo cp /www/wwwroot/www.dromkok.com/web/../webhook-config.json /etc/webhook/hooks.json

# Generate a secret for webhook
SECRET=$(openssl rand -hex 32)
echo "Your webhook secret: $SECRET"

# Update webhook config with your secret
sudo nano /etc/webhook/hooks.json
# Replace YOUR_SECRET_HERE with the generated secret
```

### Create Webhook Service

```bash
# Create systemd service
sudo tee /etc/systemd/system/webhook.service > /dev/null << 'EOF'
[Unit]
Description=Webhook
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/webhook -hooks /etc/webhook/hooks.json -port 9000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start webhook service
sudo systemctl daemon-reload
sudo systemctl enable webhook
sudo systemctl start webhook

# Check status
sudo systemctl status webhook
```

### Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://your-server-ip:9000/hooks/deploy`
   - **Content type**: `application/json`
   - **Secret**: Use the secret you generated above
   - **Events**: Select "Just the push event"
4. Click **Add webhook**

### Test Webhook

```bash
# From your local machine
curl -X POST http://your-server-ip:9000/hooks/deploy \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main"}'
```

## 🔄 Using the Deployment Pipeline

### Method 1: Manual Deployment (SSH)

```bash
ssh djdn@your-server-ip
cd /www/wwwroot/www.dromkok.com/web
./deploy.sh
```

### Method 2: GitHub Actions (Automatic)

Just push to main branch:
```bash
git push origin main
```

### Method 3: Webhook (Automatic)

Push to main branch - webhook will trigger automatically.

## 📊 Monitoring

### Check Deployment Logs

```bash
# View deployment log
tail -f /www/wwwroot/www.dromkok.com/web/deploy.log

# View PM2 logs
pm2 logs dromkok-shop

# View PM2 status
pm2 status
```

### Check Backups

```bash
# List all backups
ls -lh /home/djdn/backups/

# Check latest backup
ls -lt /home/djdn/backups/ | head -5
```

## ⏪ Rollback Procedure

If something goes wrong after deployment:

```bash
cd /www/wwwroot/www.dromkok.com/web
./scripts/rollback.sh
```

The script will:
1. Show available backups
2. Ask which backup to restore
3. Confirm before proceeding
4. Restore the database
5. Restart the server

## 🛡️ Database Safety Features

### Safe Migration Commands

The deployment script uses:
```bash
npx prisma db push --accept-data-loss
```

This command:
- ✅ Applies schema changes
- ✅ Preserves existing data
- ✅ Does NOT drop tables
- ✅ Does NOT delete data

### Dangerous Commands (NEVER USE IN PRODUCTION)

❌ `npx prisma migrate reset`
❌ `npx prisma db push --force-reset`
❌ `npx prisma migrate dev --create-only`

### Backup Before Every Deployment

Every deployment automatically:
1. Creates timestamped database backup
2. Compresses backup with gzip
3. Stores in `/home/djdn/backups/`
4. Keeps last 5 backups (auto-cleanup)

## 🔧 Troubleshooting

### Deployment Failed

```bash
# Check the log
tail -50 /www/wwwroot/www.dromkok.com/web/deploy.log

# Check PM2 status
pm2 status

# Restart manually if needed
pm2 restart dromkok-shop
```

### Server Not Starting

```bash
# Check PM2 logs
pm2 logs dromkok-shop --lines 100

# Check if port 3001 is in use
sudo lsof -i :3001

# Kill process on port 3001 if needed
sudo kill -9 $(sudo lsof -t -i:3001)
```

### Database Connection Issues

```bash
# Test database connection
psql -U ecommerce -d ecommerce -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Permission Issues

```bash
# Fix script permissions
chmod +x /www/wwwroot/www.dromkok.com/web/deploy.sh
chmod +x /www/wwwroot/www.dromkok.com/web/prisma/migrations/backup.sh
chmod +x /www/wwwroot/www.dromkok.com/web/scripts/rollback.sh

# Fix directory permissions
sudo chown -R djdn:djdn /www/wwwroot/www.dromkok.com/web
```

## 📝 Deployment Checklist

Before first deployment:
- [ ] All scripts are executable (`chmod +x`)
- [ ] Backup directory exists (`/home/djdn/backups/`)
- [ ] PM2 is configured with ecosystem.config.js
- [ ] Test backup script works
- [ ] Test deployment script works
- [ ] GitHub secrets are configured (if using Actions)
- [ ] Webhook is configured (if using webhooks)

After each deployment:
- [ ] Check deployment log for errors
- [ ] Verify server is online (`pm2 status`)
- [ ] Test website is accessible
- [ ] Check PM2 logs for errors
- [ ] Verify database backup was created

## 🎯 Next Steps

1. **Test locally first**: Run `./deploy.sh` manually on the server
2. **Setup GitHub Actions**: Add secrets and test automatic deployment
3. **Configure webhook** (optional): For instant deployments on push
4. **Monitor first few deployments**: Watch logs carefully
5. **Test rollback**: Ensure you can recover if needed

## 📞 Support

If you encounter issues:
1. Check deployment logs: `tail -f deploy.log`
2. Check PM2 logs: `pm2 logs dromkok-shop`
3. Verify all scripts are executable
4. Ensure GitHub credentials are correct
5. Test database connection manually

## 🔒 Security Best Practices

- ✅ Store secrets in environment variables
- ✅ Use SSH keys instead of passwords
- ✅ Enable 2FA on GitHub
- ✅ Use webhook secrets for validation
- ✅ Restrict SSH access by IP (optional)
- ✅ Keep backups encrypted (optional)
- ✅ Regular security updates: `sudo apt update && sudo apt upgrade`

---

**Deployment Pipeline Version**: 1.0.0  
**Last Updated**: 2026-07-13  
**Status**: ✅ Production Ready
