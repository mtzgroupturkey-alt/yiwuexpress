# Testing Deployment Pipeline Locally

This guide helps you test the deployment scripts on your local Windows machine before deploying to production.

## Prerequisites

- Git Bash or WSL (Windows Subsystem for Linux)
- Node.js and npm installed
- PostgreSQL running locally

## Local Testing Steps

### 1. Install Git Bash (if not installed)

Download from: https://git-scm.com/download/win

### 2. Open Git Bash

Right-click in your project folder → "Git Bash Here"

### 3. Simulate Production Environment

```bash
cd /c/wamp64/www/yiwuexpress/ecommerce-monorepo/web

# Create mock directories
mkdir -p /c/www/backup/dromkok
mkdir -p /c/www/logs/dromkok

# Make scripts executable
chmod +x deploy.sh
chmod +x prisma/migrations/backup.sh
chmod +x prisma/migrations/restore.sh
```

### 4. Test Database Backup Script

```bash
# Set environment variable for local testing
export PROJECT_DIR="/c/wamp64/www/yiwuexpress/ecommerce-monorepo/web"
export BACKUP_DIR="/c/www/backup/dromkok"

# Run backup script
bash prisma/migrations/backup.sh test_$(date +%Y%m%d_%H%M%S)

# Check if backup was created
ls -lh /c/www/backup/dromkok/
```

Expected output:
```
✓ Backup created successfully
  - File: /c/www/backup/dromkok/db_backup_test_20240115_143022.sql.gz
  - Size: 2.3M
```

### 5. Test Deployment Script (Dry Run)

Edit `deploy.sh` and comment out production-specific sections for local testing:

```bash
# Open in editor
code deploy.sh

# Comment out these lines for local test:
# - PM2 restart commands
# - Git pull commands (or test with a test branch)
```

Then run:

```bash
# Set local environment variables
export PROJECT_DIR="/c/wamp64/www/yiwuexpress/ecommerce-monorepo/web"
export BACKUP_DIR="/c/www/backup/dromkok"
export LOG_DIR="/c/www/logs/dromkok"
export APP_NAME="dromkok-web-test"

# Run deployment script
bash deploy.sh
```

### 6. Test Webhook Server Locally

```bash
# Install dependencies first
npm install

# Start webhook server on different port
export WEBHOOK_PORT=9001
export WEBHOOK_SECRET="test-secret-local"
export ALLOWED_BRANCH="main"
export DEPLOY_SCRIPT="/c/wamp64/www/yiwuexpress/ecommerce-monorepo/web/deploy.sh"

node webhook-server.js
```

In another terminal, test the webhook:

```bash
# Test health check
curl http://localhost:9001/health

# Test webhook endpoint (without signature)
curl -X POST http://localhost:9001/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -d '{"zen": "Testing webhook"}'
```

Expected output:
```json
{"message": "Pong!"}
```

### 7. Test PM2 Configuration

```bash
# Install PM2 globally
npm install -g pm2

# Test ecosystem configuration
pm2 start ecosystem.config.js --env development

# Check status
pm2 status

# View logs
pm2 logs dromkok-web

# Stop
pm2 stop dromkok-web
pm2 delete dromkok-web
```

### 8. Verify All Scripts Work

Create a test checklist:

```bash
# Checklist script
cat > test-deployment.sh << 'EOF'
#!/bin/bash
echo "Testing Deployment Pipeline..."

# Test 1: Backup script
echo "1. Testing backup script..."
bash prisma/migrations/backup.sh test_local
[ $? -eq 0 ] && echo "✓ Backup script works" || echo "✗ Backup script failed"

# Test 2: Check backup file
echo "2. Checking backup file..."
[ -f "/c/www/backup/dromkok/db_backup_test_local.sql.gz" ] && echo "✓ Backup file created" || echo "✗ Backup file not found"

# Test 3: Prisma generate
echo "3. Testing Prisma generate..."
npx prisma generate
[ $? -eq 0 ] && echo "✓ Prisma generate works" || echo "✗ Prisma generate failed"

# Test 4: Build
echo "4. Testing build..."
npm run build
[ $? -eq 0 ] && echo "✓ Build successful" || echo "✗ Build failed"

echo "All tests completed!"
EOF

chmod +x test-deployment.sh
bash test-deployment.sh
```

## Expected Results

All tests should pass:
- ✓ Backup script works
- ✓ Backup file created
- ✓ Prisma generate works
- ✓ Build successful

## Troubleshooting Local Tests

### Issue: "Permission denied"
```bash
# Fix: Make scripts executable
chmod +x deploy.sh
chmod +x prisma/migrations/*.sh
```

### Issue: "pg_dump: command not found"
```bash
# Fix: Add PostgreSQL to PATH in Git Bash
export PATH="/c/wamp64/bin/postgres/postgres16/bin:$PATH"

# Or update backup.sh to use full path
PG_BIN="/c/wamp64/bin/postgres/postgres16/bin"
```

### Issue: "Cannot connect to database"
```bash
# Fix: Ensure PostgreSQL is running
# Check WAMP control panel
# Verify DATABASE_URL in .env.local
```

### Issue: "Deploy script fails on Git commands"
```bash
# Fix: Comment out Git commands for local testing
# Or create a test branch and use that
```

## Next Steps

Once local testing passes:

1. ✅ Commit all files to Git
2. ✅ Push to GitHub repository
3. ✅ Set up production server (see DEPLOYMENT_GUIDE.md)
4. ✅ Test on production server
5. ✅ Configure GitHub Actions or Webhook
6. ✅ Test automated deployment

## Cleanup Local Test Files

```bash
# Remove test backups
rm -rf /c/www/backup/dromkok/db_backup_test_*

# Remove test logs
rm -rf /c/www/logs/dromkok/*
```

## Production Deployment

After successful local testing, proceed to production:

1. Read: `DEPLOYMENT_GUIDE.md`
2. Set up server directories
3. Configure environment variables
4. Run initial deployment
5. Test automated deployments

---

**Remember:** Always test in a staging environment before production!
