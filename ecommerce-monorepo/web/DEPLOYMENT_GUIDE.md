# YIWU EXPRESS - Deployment Guide

**🚀 NEW: Automated Deployment Pipeline Available!**

> **Quick Start**: For the complete automated deployment system with database backups, rollback, and one-command deployment, see **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)**

---

Complete guide for setting up automated deployments from GitHub to production server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Server Setup](#server-setup)
4. [GitHub Configuration](#github-configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Server Requirements

- Ubuntu 24.04 LTS
- Node.js 18+ and npm
- PostgreSQL 12+
- PM2 process manager
- Nginx web server
- Git

### Required Access

- SSH access to production server
- GitHub repository access
- PostgreSQL admin credentials
- Domain: www.dromkok.com

---

## Local Setup

### 1. Review Generated Files

The following files have been created in your local project:

```
ecommerce-monorepo/web/
├── deploy.sh                          # Main deployment script
├── ecosystem.config.js                # PM2 configuration
├── webhook-server.js                  # GitHub webhook listener
├── prisma/migrations/
│   ├── backup.sh                      # Database backup script
│   └── restore.sh                     # Database restore script
└── .github/workflows/
    └── deploy.yml                     # GitHub Actions workflow
```

### 2. Make Scripts Executable

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# These commands will be run on the server, not locally on Windows
# Just ensure files are committed to Git
```

### 3. Update Configuration

Edit `ecosystem.config.js` if needed:

```javascript
// Update paths if your server setup differs
cwd: '/www/wwwroot/www.dromkok.com/web',
error_file: '/www/logs/dromkok/pm2-error.log',
// etc.
```

### 4. Commit and Push

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo

git add web/deploy.sh web/ecosystem.config.js web/webhook-server.js
git add web/prisma/migrations/backup.sh web/prisma/migrations/restore.sh
git add web/.github/workflows/deploy.yml
git add web/DEPLOYMENT_GUIDE.md

git commit -m "Add automated deployment pipeline"
git push origin main
```

---

## Server Setup

### 1. Connect to Server

```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

### 2. Create Required Directories

```bash
# Create backup directory
mkdir -p /www/backup/dromkok

# Create logs directory
mkdir -p /www/logs/dromkok

# Set permissions
chown -R www:www /www/backup/dromkok
chown -R www:www /www/logs/dromkok
chmod 755 /www/backup/dromkok
chmod 755 /www/logs/dromkok
```

### 3. Navigate to Project

```bash
cd /www/wwwroot/www.dromkok.com/web
```

### 4. Pull Latest Code

```bash
git pull origin main
```

### 5. Make Scripts Executable

```bash
chmod +x deploy.sh
chmod +x prisma/migrations/backup.sh
chmod +x prisma/migrations/restore.sh
```

### 6. Install PM2 (if not installed)

```bash
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
pm2 save
```

### 7. Test Database Backup

```bash
# Test backup script
bash prisma/migrations/backup.sh

# Verify backup was created
ls -lh /www/backup/dromkok/
```

### 8. Initial Deployment

```bash
# Run deployment script for the first time
bash deploy.sh
```

### 9. Verify Application

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dromkok-web

# Check application
curl http://localhost:3001
```

---

## GitHub Configuration

### Option 1: GitHub Actions (Recommended)

#### 1. Add Repository Secrets

Go to: `GitHub Repository → Settings → Secrets and variables → Actions`

Add the following secrets:

- **SSH_PRIVATE_KEY**: Your SSH private key for server access
- **SERVER_HOST**: Your server IP or hostname
- **SSH_USER**: SSH username (usually `root` or `www`)

#### 2. Generate SSH Key (if needed)

On your local machine:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions@dromkok.com" -f github-deploy-key

# Add public key to server
ssh-copy-id -i github-deploy-key.pub root@your-server-ip

# Copy private key to GitHub secrets
cat github-deploy-key
```

#### 3. Test GitHub Actions

Push a commit to `main` branch - deployment should trigger automatically.

Check: `GitHub Repository → Actions` tab

---

### Option 2: GitHub Webhook

#### 1. Start Webhook Server

On production server:

```bash
cd /www/wwwroot/www.dromkok.com/web

# Set environment variables
export WEBHOOK_PORT=9000
export WEBHOOK_SECRET="your-secret-here-use-long-random-string"
export ALLOWED_BRANCH="main"
export DEPLOY_SCRIPT="/www/wwwroot/www.dromkok.com/web/deploy.sh"

# Start with PM2
pm2 start webhook-server.js --name webhook-dromkok
pm2 save
```

#### 2. Configure Nginx Proxy

Add to your Nginx configuration:

```nginx
# Webhook endpoint
location /webhook {
    proxy_pass http://localhost:9000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Reload Nginx:

```bash
nginx -t
systemctl reload nginx
```

#### 3. Configure GitHub Webhook

Go to: `GitHub Repository → Settings → Webhooks → Add webhook`

- **Payload URL**: `https://www.dromkok.com/webhook`
- **Content type**: `application/json`
- **Secret**: Same as `WEBHOOK_SECRET` above
- **Events**: Just the push event
- **Active**: ✓ Checked

#### 4. Test Webhook

```bash
# Check webhook server logs
pm2 logs webhook-dromkok

# Push a commit and watch logs
git commit --allow-empty -m "Test webhook"
git push origin main
```

---

## Testing

### 1. Test Backup Script

```bash
cd /www/wwwroot/www.dromkok.com/web

# Create backup
bash prisma/migrations/backup.sh

# Verify
ls -lh /www/backup/dromkok/
```

### 2. Test Restore Script

```bash
# List available backups
ls -lh /www/backup/dromkok/

# Restore from latest backup
bash prisma/migrations/restore.sh

# Or restore specific backup
bash prisma/migrations/restore.sh 20240115_143022
```

### 3. Test Deployment Script

```bash
# Run deployment
bash deploy.sh

# Check logs
tail -f /www/logs/dromkok/deploy_*.log
```

### 4. Test Application

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs dromkok-web --lines 100

# Test HTTP endpoint
curl http://localhost:3001
curl https://www.dromkok.com
```

---

## Troubleshooting

### Deployment Fails

**Check deployment logs:**
```bash
ls -lt /www/logs/dromkok/deploy_*.log | head -5
tail -100 /www/logs/dromkok/deploy_latest.log
```

**Check PM2 logs:**
```bash
pm2 logs dromkok-web --err
```

**Manual deployment:**
```bash
cd /www/wwwroot/www.dromkok.com/web
bash deploy.sh
```

### Database Issues

**Backup failed:**
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
/www/server/pgsql/bin/psql -U your_user -d your_db -c "SELECT 1;"

# Check DATABASE_URL
cat .env.production | grep DATABASE_URL
```

**Migration failed:**
```bash
# Reset Prisma client
npx prisma generate

# Force push schema
npx prisma db push --accept-data-loss

# Or restore from backup
bash prisma/migrations/restore.sh
```

### PM2 Issues

**Application won't start:**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dromkok-web

# Restart manually
pm2 restart dromkok-web

# Or delete and restart
pm2 delete dromkok-web
pm2 start ecosystem.config.js
```

**Memory issues:**
```bash
# Check memory usage
pm2 monit

# Increase memory limit in ecosystem.config.js
max_memory_restart: '2G'

# Reload
pm2 reload ecosystem.config.js
```

### GitHub Actions Issues

**Actions not triggering:**
- Check: Repository → Settings → Actions → Allow all actions
- Verify secrets are set correctly
- Check workflow syntax: `.github/workflows/deploy.yml`

**SSH connection failed:**
- Verify SSH key is added to server
- Check SERVER_HOST and SSH_USER secrets
- Test SSH connection manually

### Webhook Issues

**Webhook not receiving events:**
```bash
# Check webhook server is running
pm2 status webhook-dromkok

# Check logs
pm2 logs webhook-dromkok

# Test webhook endpoint
curl -X POST https://www.dromkok.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"ping"}'
```

**Signature verification failed:**
- Ensure WEBHOOK_SECRET matches GitHub webhook secret
- Restart webhook server after changing secret

---

## Rollback Procedures

### 1. Rollback Code

```bash
cd /www/wwwroot/www.dromkok.com/web

# List available backups
ls -lt /www/backup/dromkok/rollback_*.tar.gz | head -5

# Restore from backup
tar -xzf /www/backup/dromkok/rollback_20240115_143022.tar.gz -C .

# Restart application
pm2 restart dromkok-web
```

### 2. Rollback Database

```bash
# Use restore script
bash prisma/migrations/restore.sh 20240115_143022

# Or manually
cd /www/backup/dromkok
gunzip -c db_backup_20240115_143022.sql.gz | \
  /www/server/pgsql/bin/psql -U your_user -d your_db
```

### 3. Rollback to Previous Commit

```bash
cd /www/wwwroot/www.dromkok.com/web

# View recent commits
git log --oneline -10

# Rollback to specific commit
git reset --hard abc1234

# Or rollback last commit
git reset --hard HEAD~1

# Run deployment
bash deploy.sh
```

---

## Maintenance

### View Logs

```bash
# Deployment logs
ls -lt /www/logs/dromkok/deploy_*.log | head -5
tail -f /www/logs/dromkok/deploy_latest.log

# Application logs
pm2 logs dromkok-web

# Webhook logs
pm2 logs webhook-dromkok

# Nginx logs
tail -f /www/wwwlogs/www.dromkok.com.log
```

### Backup Management

```bash
# List all backups
ls -lh /www/backup/dromkok/

# Manual backup
bash prisma/migrations/backup.sh

# Cleanup old backups (keeps last 10)
cd /www/backup/dromkok
ls -t rollback_*.tar.gz | tail -n +11 | xargs rm
ls -t db_backup_*.sql.gz | tail -n +11 | xargs rm
```

### Update Deployment Scripts

```bash
# Pull latest scripts
cd /www/wwwroot/www.dromkok.com/web
git pull origin main

# Make executable
chmod +x deploy.sh
chmod +x prisma/migrations/*.sh

# Test
bash deploy.sh
```

---

## Security Recommendations

1. **Use SSH Keys**: Never store passwords in scripts
2. **Restrict SSH Access**: Use firewall rules to limit SSH access
3. **Secure Webhook**: Always use WEBHOOK_SECRET
4. **HTTPS Only**: Ensure SSL certificate is valid
5. **Environment Variables**: Never commit `.env.production`
6. **Database Backups**: Store backups in secure location
7. **Log Rotation**: Set up log rotation to prevent disk space issues

---

## Support

For issues or questions:

1. Check logs in `/www/logs/dromkok/`
2. Review PM2 status: `pm2 status`
3. Verify Nginx configuration: `nginx -t`
4. Test database connection: `npx prisma db pull`

---

## Summary

**Automated Deployment Flow:**

1. Developer pushes code to GitHub main branch
2. GitHub Actions or Webhook triggers deployment
3. Deployment script runs on server:
   - Creates code backup
   - Creates database backup
   - Pulls latest code
   - Installs dependencies
   - Runs database migrations
   - Builds application
   - Restarts PM2 process
4. Application is live with zero downtime

**Manual Deployment:**

```bash
ssh root@your-server-ip
cd /www/wwwroot/www.dromkok.com/web
bash deploy.sh
```

**Emergency Rollback:**

```bash
bash prisma/migrations/restore.sh
pm2 restart dromkok-web
```

---

✅ Deployment pipeline is now complete and ready for production use!
