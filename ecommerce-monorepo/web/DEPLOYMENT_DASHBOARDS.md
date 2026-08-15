# Advanced Deployment Dashboards

## Overview

Two comprehensive admin deployment dashboards have been created for managing both local development and production deployments:

1. **LOCAL DEPLOYMENT DASHBOARD** (`/admin/deploy/local`) - For local development environment
2. **ONLINE DEPLOYMENT DASHBOARD** (`/admin/deploy/online`) - For production server management

---

## 1. LOCAL DEPLOYMENT DASHBOARD

**URL**: `/admin/deploy/local`

### Features

#### Status Overview
- **Dev Server Status**: Shows if local dev server is running (port 3001)
- **Database Status**: Connection status and table count
- **Git Status**: Current branch, commit, and working directory status

#### Git Operations Tab
- **Pull**: Pull latest changes from remote
- **Push**: Push local commits to remote
- **Commit**: Commit staged changes with message
- **View Log**: Display recent commit history
- **Status Display**: Shows modified files, staged files, branch info

#### Database Tab
- **Sync Schema**: Run `prisma db push` to sync schema
- **Seed Data**: Run seed scripts to populate database
- **Prisma Studio**: Open Prisma Studio on localhost:5555
- **Show Tables**: Display all database tables
- **Generate Client**: Run `prisma generate`
- **Export**: Export database to SQL file

#### Build & Test Tab
- **Build**: Run `npm run build`
- **Clean Build**: Remove `.next` and rebuild
- **Lint**: Run ESLint
- **Type Check**: Run TypeScript compiler check
- **Run Tests**: Execute test suite

#### Output Console
- Real-time command output display
- Syntax-highlighted terminal view
- Auto-scroll for long outputs

---

## 2. ONLINE DEPLOYMENT DASHBOARD

**URL**: `/admin/deploy/online`

### Features

#### Status Overview Cards
1. **PM2 Server Status**
   - Online/Offline status
   - Process status
   - Uptime

2. **PostgreSQL Status**
   - Database version
   - Database size
   - Active connections

3. **Disk Space**
   - Total/Used/Free space
   - Usage percentage
   - Visual indicator (red if >80%)

4. **Git Information**
   - Current branch
   - Latest commit hash
   - Repository status

#### Action Buttons
- **Deploy Now**: Full production deployment
  - Pulls latest code
  - Runs migrations
  - Rebuilds application
  - Restarts PM2 server
  - Creates automatic backup

- **Create Backup**: Manual database backup
- **Restart Server**: Restart PM2 process
- **Refresh Status**: Update all status information

#### System Overview Tab
- Server resources (CPU, Memory, Restarts)
- Database information (Connections, Version)
- Real-time metrics

#### Deployment History Tab
- List of all deployments with:
  - Success/Failed/In-Progress status
  - Commit information
  - Deployment duration
  - Timestamp
  - Error messages (if failed)

#### Database Backups Tab
- List of all backups with:
  - Filename
  - Size
  - Creation date
  - Type (manual/auto)
- **Rollback** button for each backup
- Critical warning confirmation for rollbacks

#### Server Logs Tab
- Real-time server logs from PM2
- Deployment logs
- Refresh functionality
- Syntax-highlighted terminal view

---

## Technical Implementation

### Database Models

Two new Prisma models were added:

```prisma
model Deployment {
  id               String   @id @default(cuid())
  deploymentNumber String   @unique
  environment      String   @default("production")
  status           String   @default("in-progress")
  type             String   // deploy, rollback, build, migration
  triggeredBy      String?
  commitHash       String?
  commitMessage    String?
  branch           String?
  startedAt        DateTime @default(now())
  completedAt      DateTime?
  duration         Int?
  logs             String?  @db.Text
  error            String?  @db.Text
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Backup {
  id          String   @id @default(cuid())
  filename    String   @unique
  filepath    String
  size        Int
  type        String   @default("database")
  environment String   @default("production")
  triggeredBy String?
  status      String   @default("completed")
  compression String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### File Structure

```
web/
├── app/
│   └── admin/
│       └── deploy/
│           ├── local/
│           │   └── page.tsx          # Local dashboard
│           └── online/
│               └── page.tsx          # Production dashboard
│
├── app/api/admin/
│   ├── local/                        # Local API routes
│   │   ├── status/route.ts          # Get local status
│   │   ├── git/route.ts             # Git operations
│   │   ├── build/route.ts           # Build operations
│   │   └── database/route.ts        # Database operations
│   │
│   └── online/                       # Production API routes
│       ├── status/route.ts          # Get server status
│       ├── deploy/route.ts          # Deploy to production
│       ├── history/route.ts         # Deployment history
│       ├── logs/route.ts            # Server logs
│       ├── backup/route.ts          # Backup operations
│       ├── rollback/route.ts        # Rollback deployment
│       └── server/route.ts          # Server control
│
├── lib/deploy/
│   ├── git.ts                       # Git utility functions
│   ├── server.ts                    # Server management
│   ├── backup.ts                    # Backup operations
│   ├── deployment.ts                # Deployment logic
│   └── local.ts                     # Local operations
│
└── types/
    └── deploy.ts                    # TypeScript types
```

### API Routes

#### Local Dashboard APIs (16 routes)
1. `GET /api/admin/local/status` - Get local server and git status
2. `POST /api/admin/local/git` - Git operations (pull, push, commit, checkout, etc.)
3. `POST /api/admin/local/build` - Build operations (build, clean, lint, typecheck, test)
4. `POST /api/admin/local/database` - Database operations (sync, seed, studio, export, tables)

#### Online Dashboard APIs (9 routes)
1. `GET /api/admin/online/status` - Get production server status
2. `GET /api/admin/online/deploy` - Check deployment status
3. `POST /api/admin/online/deploy` - Deploy to production
4. `GET /api/admin/online/history` - Get deployment history
5. `GET /api/admin/online/logs` - Get server/deployment logs
6. `GET /api/admin/online/backup` - List backups
7. `POST /api/admin/online/backup` - Create/restore/delete backup
8. `POST /api/admin/online/rollback` - Rollback deployment
9. `POST /api/admin/online/server` - Server control (restart/stop/start)

---

## Security Features

### Safety Mechanisms

1. **Lock File System**
   - Prevents concurrent deployments
   - Lock file created at `/tmp/deployment.lock`
   - Automatically removed on completion or failure

2. **Automatic Backups**
   - Backup created before every deployment
   - Keeps last 5 backups automatically
   - Manual backup option available

3. **Confirmation Dialogs**
   - Warning confirmation for production deployments
   - Critical warning for database rollbacks
   - Server action confirmations

4. **Error Handling**
   - Comprehensive try-catch blocks
   - Error logging in database
   - Failed deployments tracked

5. **Rate Limiting** (Recommended)
   - Add rate limiting middleware to deployment endpoints
   - Prevent accidental multiple clicks

### Access Control

- All routes require admin authentication
- Admin role check in middleware
- Protected routes only accessible to authenticated admins

---

## Usage Guide

### First Time Setup

1. **Update Prisma Schema**
   ```bash
   cd web
   npx prisma db push
   ```

2. **Verify Environment Variables**
   ```env
   DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"
   BACKUP_DIR="/home/djdn/backups"
   DEPLOY_SCRIPT="/www/wwwroot/www.dromkok.com/web/deploy.sh"
   ```

3. **Access Dashboards**
   - Local: `http://localhost:3001/admin/deploy/local`
   - Production: `https://www.dromkok.com/admin/deploy/online`

### Common Workflows

#### Local Development Workflow
1. Open `/admin/deploy/local`
2. Check git status
3. Pull latest changes
4. Sync database schema
5. Build and test
6. Commit and push

#### Production Deployment Workflow
1. Open `/admin/deploy/online`
2. Check server status
3. Review latest deployment history
4. Click "Deploy Now"
5. Monitor deployment logs
6. Verify deployment success

#### Emergency Rollback
1. Open `/admin/deploy/online`
2. Go to "Database Backups" tab
3. Select most recent backup
4. Click "Rollback" (with confirmation)
5. Verify system recovery

---

## Environment Differences

### Local Environment
- Works in development mode (`npm run dev`)
- Uses local PostgreSQL database
- Git operations on local repository
- No PM2 required
- File-based operations

### Production Environment
- Deployed at `https://www.dromkok.com`
- Uses production PostgreSQL database
- PM2 process management
- Nginx reverse proxy
- SSH-based operations
- Automatic backups to `/home/djdn/backups/`

---

## Troubleshooting

### Common Issues

1. **"Another deployment is already in progress"**
   - Wait for current deployment to complete
   - Or manually remove lock file: `rm /tmp/deployment.lock`

2. **Git operations failing**
   - Check git credentials
   - Verify remote repository access
   - Ensure clean working directory

3. **Database connection failed**
   - Verify DATABASE_URL environment variable
   - Check PostgreSQL service status
   - Test database credentials

4. **PM2 not responding**
   - SSH into server
   - Run `pm2 list` to check process
   - Manually restart if needed

5. **Backup/Restore failing**
   - Check backup directory permissions
   - Verify PostgreSQL user has backup privileges
   - Ensure sufficient disk space

---

## Next Steps / Enhancements

### Recommended Additions

1. **Real-time Logs** (Server-Sent Events)
   - Stream deployment logs in real-time
   - Progress indicators
   - Live status updates

2. **Deployment Queue**
   - Queue multiple deployments
   - Schedule deployments
   - Delayed deployments

3. **Rollback Testing**
   - Test restore before applying
   - Dry-run mode
   - Backup validation

4. **Notifications**
   - Email notifications on deployment completion
   - Slack/Discord webhooks
   - SMS alerts for failures

5. **Performance Metrics**
   - Deployment duration trends
   - Success/failure rates
   - Server performance graphs

6. **Multi-Environment Support**
   - Staging environment
   - Development environment
   - Testing environment

7. **Audit Trail**
   - Who deployed what and when
   - Change log
   - Approval workflow

---

## Navigation

The dashboards are accessible through the admin panel:

**Admin Panel → Settings → Deploy**
- Local Deploy (Terminal icon)
- Production Deploy (Rocket icon)
- Deployment (Old) - Legacy deployment page

---

## Credits

Created as part of the YIWU EXPRESS ecommerce platform deployment automation system.

**Version**: 1.0.0
**Date**: 2026-07-13
**Platform**: Next.js 14 + PostgreSQL + PM2 + Nginx
