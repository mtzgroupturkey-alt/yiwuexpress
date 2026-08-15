# Deployment Dashboards - Deployment Checklist

## 📋 Pre-Deployment Checklist

Before deploying the new deployment dashboards, follow these steps:

### 1. Local Testing

- [ ] **Test Local Dashboard**
  ```bash
  cd web
  npm run dev
  ```
  - [ ] Navigate to http://localhost:3001/admin/deploy/local
  - [ ] Verify all status cards load correctly
  - [ ] Test Git operations (pull, status, log)
  - [ ] Test Database operations (sync schema, show tables)
  - [ ] Test Build operations (lint, typecheck)

- [ ] **Verify Environment Variables**
  ```bash
  # Check .env.local file
  DATABASE_URL=postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce
  ```

- [ ] **Update Prisma Schema**
  ```bash
  npx prisma db push
  ```
  - [ ] Verify Deployment model created
  - [ ] Verify Backup model created

- [ ] **Run Type Check**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] No TypeScript errors

- [ ] **Run Linter**
  ```bash
  npm run lint
  ```
  - [ ] No linting errors (or acceptable warnings)

### 2. Build Verification

- [ ] **Production Build Test**
  ```bash
  npm run build
  ```
  - [ ] Build completes successfully
  - [ ] No build errors
  - [ ] Check bundle size

- [ ] **Start Production Server Locally**
  ```bash
  npm start
  ```
  - [ ] Server starts on port 3001
  - [ ] Navigate to http://localhost:3001/admin/deploy/local
  - [ ] Verify dashboards work in production mode

### 3. Code Review

- [ ] **Review New Files**
  - [ ] `types/deploy.ts` - Type definitions correct
  - [ ] `lib/deploy/*.ts` - All utility functions tested
  - [ ] `app/api/admin/local/**` - API routes working
  - [ ] `app/api/admin/online/**` - API routes working
  - [ ] `app/admin/deploy/local/page.tsx` - UI working
  - [ ] `app/admin/deploy/online/page.tsx` - UI working

- [ ] **Review Modified Files**
  - [ ] `prisma/schema.prisma` - Models added correctly
  - [ ] `app/admin/layout.tsx` - Navigation links added

- [ ] **Documentation**
  - [ ] `DEPLOYMENT_DASHBOARDS.md` - Complete
  - [ ] `DEPLOYMENT_QUICK_START.md` - Clear instructions
  - [ ] `DEPLOYMENT_IMPLEMENTATION_SUMMARY.md` - Accurate

---

## 🚀 Deployment Steps

### Step 1: Commit Changes

```bash
# Stage all new files
git add .

# Commit with descriptive message
git commit -m "feat: Add comprehensive deployment dashboards for local and production

- Add LOCAL deployment dashboard (/admin/deploy/local)
  - Git operations (pull, push, commit, log)
  - Database management (sync, seed, studio, tables)
  - Build tools (build, lint, typecheck, test)
  
- Add ONLINE deployment dashboard (/admin/deploy/online)
  - Production deployment with safety checks
  - Server status monitoring (PM2, PostgreSQL, Nginx, Disk)
  - Database backup and rollback
  - Deployment history and logs
  
- Add database models (Deployment, Backup)
- Add 11 API routes (4 local, 7 online)
- Add comprehensive documentation
- Update admin navigation

Security features:
- Lock file mechanism for concurrent deployments
- Automatic backups before deployments
- Confirmation dialogs for critical operations
- Admin authentication required"

# Push to remote
git push origin main
```

### Step 2: Backup Production Database

```bash
# SSH into production server
ssh root@www.dromkok.com

# Create manual backup BEFORE deployment
cd /www/wwwroot/www.dromkok.com/web
./prisma/migrations/backup.sh
```

### Step 3: Deploy to Production

**Option A: Using the Old Deployment Script**
```bash
# SSH into production
ssh root@www.dromkok.com

# Navigate to web directory
cd /www/wwwroot/www.dromkok.com/web

# Run deployment script
./deploy.sh
```

**Option B: Using Git Pull + Manual Steps**
```bash
# SSH into production
ssh root@www.dromkok.com

# Navigate to web directory
cd /www/wwwroot/www.dromkok.com/web

# Pull latest code
git pull origin main

# Install dependencies (if any new packages)
npm install

# Update database schema
npx prisma db push

# Rebuild application
npm run build

# Restart PM2 server
pm2 restart dromkok-shop

# Check status
pm2 status
pm2 logs dromkok-shop --lines 50
```

### Step 4: Verify Deployment

- [ ] **Check Server Status**
  ```bash
  pm2 list
  pm2 logs dromkok-shop --lines 20
  ```

- [ ] **Test Production Dashboard**
  - [ ] Navigate to https://www.dromkok.com/admin/deploy/online
  - [ ] Login with admin credentials
  - [ ] Verify all status cards show correct information
  - [ ] Check deployment history shows recent deployment

- [ ] **Verify Database Models**
  ```bash
  # Check if new tables exist
  psql -U ecommerce -d ecommerce -c "\dt"
  ```
  - [ ] `deployments` table exists
  - [ ] `backups` table exists

### Step 5: Post-Deployment Testing

- [ ] **Test Production Dashboard Features**
  - [ ] Server status displays correctly
  - [ ] Deployment history loads
  - [ ] Backups list populates
  - [ ] Server logs display
  - [ ] Create Backup button works
  - [ ] Refresh Status works

- [ ] **Test Local Dashboard (from production)**
  - [ ] Try accessing `/admin/deploy/local` on production
  - [ ] Verify it shows production environment appropriately

### Step 6: Monitor for Issues

**First 30 Minutes After Deployment:**
- [ ] Monitor PM2 logs for errors
  ```bash
  pm2 logs dromkok-shop --lines 100
  ```
- [ ] Check server CPU and memory
  ```bash
  pm2 monit
  ```
- [ ] Test a few page loads to ensure no errors
- [ ] Check database connections

**First 24 Hours:**
- [ ] Monitor error logs
- [ ] Check deployment history in dashboard
- [ ] Verify no performance degradation

---

## 🔄 Rollback Plan (If Issues Occur)

### Quick Rollback Steps

1. **Identify Issue**
   - Check PM2 logs: `pm2 logs dromkok-shop`
   - Check Nginx error logs: `tail -f /var/log/nginx/error.log`
   - Check browser console for errors

2. **Rollback Database** (if schema issue)
   ```bash
   # List backups
   ls -lh /home/djdn/backups/

   # Find backup before deployment
   # Restore backup (replace with actual filename)
   gunzip -c /home/djdn/backups/ecommerce-auto-2026-07-13T*.sql.gz | psql -U ecommerce -d ecommerce
   ```

3. **Rollback Code** (if application issue)
   ```bash
   # Check last good commit
   git log --oneline -10

   # Reset to previous commit (replace COMMIT_HASH)
   git reset --hard COMMIT_HASH

   # Rebuild
   npm install
   npm run build

   # Restart
   pm2 restart dromkok-shop
   ```

4. **Verify Rollback**
   - [ ] Server starts successfully
   - [ ] No errors in PM2 logs
   - [ ] Dashboard loads correctly

---

## 🐛 Troubleshooting

### Issue: TypeScript errors during build

**Solution:**
```bash
# Check specific errors
npx tsc --noEmit

# Fix errors in the identified files
# Rebuild
npm run build
```

### Issue: Prisma schema migration fails

**Solution:**
```bash
# Check current schema
npx prisma db pull

# Force push (careful - can lose data)
npx prisma db push --accept-data-loss

# If that fails, check database connection
psql -U ecommerce -d ecommerce -c "SELECT version();"
```

### Issue: PM2 server won't start

**Solution:**
```bash
# Check PM2 logs
pm2 logs dromkok-shop --err

# Delete PM2 process and recreate
pm2 delete dromkok-shop
pm2 start ecosystem.config.js

# Check port 3001 is not in use
netstat -tulpn | grep 3001
```

### Issue: Deployment dashboard shows errors

**Solution:**
```bash
# Check API route logs
# Look for errors in PM2 logs related to /api/admin/deploy/*

# Verify environment variables
cat .env.production | grep DATABASE_URL
cat .env.production | grep BACKUP_DIR

# Test database connection
psql -U ecommerce -d ecommerce -c "SELECT COUNT(*) FROM deployments;"
```

### Issue: Git operations fail in dashboard

**Solution:**
```bash
# Check git configuration
git config --list

# Verify remote access
git fetch --dry-run

# Check SSH keys
ssh -T git@github.com
```

---

## ✅ Post-Deployment Checklist

### Day 1
- [ ] Monitor PM2 logs for errors
- [ ] Check deployment dashboard status
- [ ] Verify backups are being created
- [ ] Test a deployment through dashboard
- [ ] Document any issues

### Week 1
- [ ] Review deployment history
- [ ] Check backup sizes and cleanup
- [ ] Verify disk space is adequate
- [ ] Test rollback procedure
- [ ] Collect user feedback

### Month 1
- [ ] Analyze deployment patterns
- [ ] Review security logs
- [ ] Optimize based on usage
- [ ] Plan enhancements

---

## 📞 Support Contacts

If you encounter critical issues:

1. **Check Documentation**
   - `DEPLOYMENT_DASHBOARDS.md` - Full documentation
   - `DEPLOYMENT_QUICK_START.md` - Quick reference
   - This checklist

2. **SSH Access**
   ```bash
   ssh root@www.dromkok.com
   ```

3. **Database Access**
   ```bash
   psql -U ecommerce -d ecommerce
   ```

4. **PM2 Commands**
   ```bash
   pm2 list          # List all processes
   pm2 logs          # View all logs
   pm2 monit         # Monitor resources
   pm2 restart all   # Restart all processes
   ```

---

## 🎯 Success Criteria

Deployment is considered successful when:

- ✅ Both dashboards load without errors
- ✅ All status indicators display correctly
- ✅ Git operations work (local dashboard)
- ✅ Deployment can be triggered (online dashboard)
- ✅ Backups can be created
- ✅ Server logs display properly
- ✅ No performance degradation
- ✅ No errors in PM2 logs
- ✅ Database models created successfully

---

**Last Updated**: 2026-07-13
**Version**: 1.0.0
**Deployment Environment**: Production (www.dromkok.com)
