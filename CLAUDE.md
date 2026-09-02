# YIWU EXPRESS - Claude Code Configuration

## Project Overview

YIWU EXPRESS is a global trade and logistics platform connecting buyers with suppliers and manufacturers in Yiwu, China. This is a monorepo containing:

- **web/** - Next.js 14 web application (port 3001)
- **mobile/** - React Native (Expo) mobile app (port 8081)

---

## Technology Stack

### Web (Next.js)
- Framework: Next.js 14.2.19 (App Router)
- Styling: Tailwind CSS 3.3.0
- Database: Prisma 6.0.0 + PostgreSQL
- State: Zustand
- Auth: JWT (jose library)
- Payments: Stripe + PayPal
- i18n: next-intl (en, ru, zh)

### Mobile (React Native)
- Framework: Expo 52.0.0
- Runtime: React Native 0.76.9
- Navigation: Expo Router
- UI: React Native Paper
- State: Zustand

---

## Project Structure

See `.kiro/steering/structure.md` for detailed directory layout.

Key directories:
- `ecommerce-monorepo/web/app/` - Next.js App Router pages
- `ecommerce-monorepo/web/components/` - React components
- `ecommerce-monorepo/web/prisma/` - Database schema and migrations
- `ecommerce-monorepo/mobile/app/` - Expo Router file-based routing
- `ecommerce-monorepo/mobile/src/` - React Native source code

---

## Development Commands

### Web Development
```bash
cd ecommerce-monorepo/web
npm install
npm run dev          # Start dev server (port 3001)
npm run build        # Build for production
npm run db:push      # Sync Prisma schema to database (LOCAL ONLY)
npm run db:studio    # Open Prisma Studio GUI
Mobile Development
bash
cd ecommerce-monorepo/mobile
npm install
npm run start        # Start Expo dev server (port 8081)
npm run android      # Build for Android
npm run ios          # Build for iOS
Server Information (Production)
Production Server
OS: Linux (Ubuntu - NOT Windows)

IP: 39.175.57.2

Domain: dromkok.com

Path: /www/wwwroot/www.dromkok.com/web

User: djdn

SSH Port: 22

Server Commands
bash
# Connect to server
ssh djdn@39.175.57.2 -p 22

# Navigate to project
cd /www/wwwroot/www.dromkok.com/web

# Check PM2 status
pm2 list

# View logs
pm2 logs

# Restart app
pm2 restart dromkok-web

# Check Nginx
sudo nginx -t
sudo systemctl reload nginx
Web Server Configuration
Web Server: Nginx as reverse proxy

SSL Certificates: /etc/nginx/ssl/dromkok.com/

Proxy: Forwards to Next.js on port 3001

Process Manager: PM2 (cluster mode, 2 instances)

Environment Separation
Environment	OS	Path	Port	Database
Development (Local)	Windows	C:\wamp64\www\yiwuexpress	3005	Local PostgreSQL
Production (Server)	Linux (Ubuntu)	/www/wwwroot/www.dromkok.com/web	3001	Production PostgreSQL
⚠️ CRITICAL: Database Migration Rules
Zero Data Loss Policy
NEVER run destructive migrations without backup! This is the #1 rule.

Before ANY Migration
1. Create Database Backup (ALWAYS)
bash
# On production server
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
pg_dump -U ecommerce ecommerce > /backup/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Or download to local machine
ssh djdn@39.175.57.2 "pg_dump -U ecommerce ecommerce" > db_backup_$(date +%Y%m%d).sql
2. Test Migration on Local First
bash
# Local development
cd C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma migrate dev --name migration_description

# Test thoroughly before deploying to production
3. Review the SQL Before Applying
bash
# Check what will change
cat prisma/migrations/*/migration.sql
# Review for any unexpected DROP or DELETE operations
Safe Migration Workflow (Production)
bash
# On production server
cd /www/wwwroot/www.dromkok.com/web

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Apply migrations (SAFE - uses migration history)
npx prisma migrate deploy

# 5. Restart application
pm2 restart dromkok-web

# 6. Verify
pm2 logs --lines 20
curl http://localhost:3001
⛔ NEVER Do This on Production
bash
# ❌ DESTRUCTIVE - WILL DELETE DATA!
npx prisma db push          # NEVER use on production

# ❌ DANGEROUS - Resets database!
npx prisma migrate reset    # NEVER use on production

# ❌ RISKY - Forces migration without backup
npx prisma migrate deploy --force  # ONLY use when absolutely sure
Migration Checklist
Before running ANY migration on production:

□ Backup created - pg_dump completed successfully
□ Tested locally - Migration works on local machine
□ SQL reviewed - Checked migration.sql for unexpected changes
□ Low traffic time - Scheduled during off-peak hours
□ Rollback plan ready - Backup location confirmed
□ Team notified - Others know about maintenance
□ Logs monitored - Ready to watch for errors
Rollback Plan (If Something Goes Wrong)
bash
# 1. Stop the application
pm2 stop dromkok-web

# 2. Restore database from backup
psql -U ecommerce ecommerce < /backup/db_backup_YYYYMMDD_HHMMSS.sql

# 3. Revert code to previous version
git checkout <previous_commit_hash>
npm install
npm run build

# 4. Restart application
pm2 start dromkok-web

# 5. Verify everything is working
pm2 logs --lines 20
curl http://localhost:3001
Prisma Configuration for Linux
prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"] // REQUIRED for Linux
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
Environment Variables
bash
# Production (.env.production)
DATABASE_URL=postgresql://ecommerce:REAL_PASSWORD@localhost:5432/ecommerce
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://dromkok.com
ALLOWED_ORIGINS=https://dromkok.com,https://www.dromkok.com

# Development (.env.local)
DATABASE_URL=postgresql://ecommerce:dev_password@localhost:5432/ecommerce_dev
NODE_ENV=development
PORT=3005
NEXT_PUBLIC_API_URL=http://localhost:3005
Common Migration Issues & Solutions
Issue	Solution
Migration fails on server	Run npx prisma generate first, check PostgreSQL permissions
Data loss risk detected	Always use --create-only to review SQL first
Connection timeout	Increase timeout: npx prisma migrate deploy --timeout 300000
Foreign key constraint error	Review relationship changes carefully
Database locked	Restart PostgreSQL: sudo systemctl restart postgresql
Migration already applied	Use npx prisma migrate resolve --applied migration_name
Deployment Process (Zero Data Loss)
Step 1: Prepare Locally
bash
# 1. Pull latest changes
git pull

# 2. Test locally
npm run dev
# Test all features, especially database operations

# 3. Create migration (if schema changed)
npx prisma migrate dev --create-only --name description

# 4. Review the migration
cat prisma/migrations/*/migration.sql

# 5. Apply to local DB
npx prisma migrate dev
Step 2: Backup Production
bash
# On production server
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web

# Create backup
./scripts/backup-db.sh
# Creates backup in /backup/ with timestamp
Step 3: Deploy to Production
bash
# On production server
cd /www/wwwroot/www.dromkok.com/web

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Build application
npm run build

# 4. Run migrations (SAFE way)
npx prisma migrate deploy

# 5. Restart app
pm2 restart dromkok-web

# 6. Verify
pm2 logs --lines 20
curl http://localhost:3001
Step 4: Verify Deployment
bash
# 1. Check application logs
pm2 logs --lines 50

# 2. Test critical flows
# - Login
# - View products
# - Add to cart
# - Checkout
# - Admin panel

# 3. Check Nginx logs (if issues)
sudo tail -f /var/log/nginx/error.log

# 4. Monitor system resources
htop
df -h
Backup Script (backup-db.sh)
bash
#!/bin/bash
# Save as: /www/wwwroot/www.dromkok.com/web/scripts/backup-db.sh

BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR
pg_dump -U ecommerce ecommerce > $FILENAME
echo "✅ Backup saved to $FILENAME"

# Keep only last 7 backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
echo "🧹 Removed backups older than 7 days"
Remote Backup Download (from local)
bash
# Download remote backup to local machine
ssh djdn@39.175.57.2 "pg_dump -U ecommerce ecommerce" > db_backup_$(date +%Y%m%d).sql
echo "✅ Downloaded backup to db_backup_$(date +%Y%m%d).sql"
Important Rules (ALWAYS Follow)
Database Rules
NEVER run prisma db push on production

NEVER run prisma migrate reset on production

ALWAYS backup before ANY database change

ALWAYS test migrations on local first

ALWAYS review SQL before applying

ALWAYS have a rollback plan ready

Security Rules
NEVER commit .env files to Git

ALWAYS use environment variables for secrets

ALWAYS use HTTPS in production

NEVER expose database ports to public

ALWAYS use strong JWT secrets (64+ chars)

Code Rules
ALWAYS use TypeScript for all files

ALWAYS use Tailwind CSS for styling

ALWAYS use Prisma for database operations

ALWAYS use next-intl for i18n

NEVER hardcode strings (use translations)

Deployment Rules
NEVER deploy without backup

NEVER deploy during peak traffic

ALWAYS test on staging first

ALWAYS monitor logs after deployment

ALWAYS have rollback plan ready

Build & Deploy
Web Production URL: https://dromkok.com

Web Dev Server: http://localhost:3001

Mobile Dev Server: http://localhost:8081

Server: Linux (Ubuntu) at 39.175.57.2

See DEPLOYMENT_GUIDE.md and DEPLOYMENT_README.md for detailed instructions.

GStack Browser Usage
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Skill Routing
When starting work on a feature:

Run /office-hours first to clarify requirements and validate the problem

For product/feature planning: /plan-ceo-review

For technical architecture: /plan-eng-review

For UI/UX work: /plan-design-review

Use /autoplan to run CEO → design → eng review automatically

Before shipping:

Run /review on any branch with changes

Run /qa on staging URLs to test functionality

Run /ship to sync main, run tests, and open PR

For security audits:

Run /cso for OWASP Top 10 + STRIDE threat modeling

For documentation:

Run /document-release after shipping to update all docs

Run /document-generate to create missing documentation

Additional Resources
Product Details: .kiro/steering/product.md

Tech Stack: .kiro/steering/tech.md

Project Structure: .kiro/steering/structure.md

Deployment Guide: DEPLOYMENT_GUIDE.md

Deployment README: DEPLOYMENT_README.md

Emergency Contacts & Commands
Scenario	Action
App crashes	pm2 restart dromkok-web
Database corrupt	Restore from backup
Migration fails	npx prisma migrate resolve --applied migration_name
Server down	ssh djdn@39.175.57.2 then sudo systemctl restart nginx
Need to rollback	git revert HEAD then pm2 restart dromkok-web
Quick Reference Card
Task	Command
SSH to server	ssh djdn@39.175.57.2 -p 22
View PM2 status	pm2 list
View logs	pm2 logs --lines 50
Restart app	pm2 restart dromkok-web
Create backup	./scripts/backup-db.sh
Run migration	npx prisma migrate deploy
Test locally	npm run dev
Build for prod	npm run build
Reload Nginx	sudo systemctl reload nginx
Check Nginx	sudo nginx -t
Last Updated: August 2026
Version: 1.0.0
Maintained by: YIWU EXPRESS Development Team

text

---

## ✅ **What This Complete CLAUDE.md Includes**

| Section | Content |
|---------|---------|
| ✅ **Project Overview** | Complete description of YIWU EXPRESS |
| ✅ **Tech Stack** | All technologies with versions |
| ✅ **Server Info** | Linux server details, SSH, paths |
| ✅ **Database Rules** | Migration rules, backup, rollback |
| ✅ **Zero Data Loss** | Backup procedures, safety checks |
| ✅ **Environment Separation** | Dev vs Production differences |
| ✅ **Deployment Process** | Step-by-step with verification |
| ✅ **Important Rules** | NEVER and ALWAYS rules |
| ✅ **Quick Reference** | Common commands |
| ✅ **Emergency Procedures** | Rollback and recovery |

---

**This complete `CLAUDE.md` file ensures Claude Code will always follow your Linux server and database migration rules!** 🚀