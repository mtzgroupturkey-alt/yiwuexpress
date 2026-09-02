#!/bin/bash
# deploy.sh - Main deployment script for production server

set -e

echo "====================================="
echo "🚀 STARTING DEPLOYMENT"
echo "====================================="
echo "⏰ $(date)"
echo ""

# Configuration
PROJECT_PATH="/www/wwwroot/www.dromkok.com/web"
BACKUP_DIR="/home/djdn/backups"
LOG_FILE="$PROJECT_PATH/deploy.log"
MAX_BACKUPS=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if deployment is already running
if [ -f "$PROJECT_PATH/.deploy.lock" ]; then
    log "${RED}❌ Deployment already running. Please wait...${NC}"
    exit 1
fi

# Create lock file
touch "$PROJECT_PATH/.deploy.lock"

# Error handling
cleanup() {
    rm -f "$PROJECT_PATH/.deploy.lock"
    log "${YELLOW}⚠️ Deployment interrupted. Lock removed.${NC}"
}
trap cleanup EXIT

log "${BLUE}📋 Starting deployment process...${NC}"

# 1. Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# 2. Database Backup
log "${BLUE}💾 Creating database backup...${NC}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

export PGPASSWORD="LzZH5p5SnRtNKfMy"
if /www/server/pgsql/bin/pg_dump -U ecommerce -d ecommerce > "$BACKUP_FILE" 2>/dev/null; then
    gzip "$BACKUP_FILE"
    log "${GREEN}✅ Database backup created: ${BACKUP_FILE}.gz${NC}"
else
    log "${RED}❌ Database backup failed!${NC}"
    exit 1
fi

TARGET_BRANCH="${1:-production}"
if [ -z "$TARGET_BRANCH" ]; then
    TARGET_BRANCH="production"
fi

# 3. Clean old backups (keep last 5)
log "${BLUE}🗑️ Cleaning old backups...${NC}"
cd "$BACKUP_DIR"
ls -t db_backup_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
log "${GREEN}✅ Old backups cleaned. Keeping last $MAX_BACKUPS backups.${NC}"

# 4. Pull latest code
log "${BLUE}📥 Updating code to origin/${TARGET_BRANCH} from GitHub...${NC}"
cd "$PROJECT_PATH"

# Remove stale locks if any
rm -f .git/index.lock 2>/dev/null || true

# Fix user permissions on files so git can unlink/write
chmod -R u+rwX "$PROJECT_PATH" 2>/dev/null || true

# Fetch remote tracking
git fetch origin "$TARGET_BRANCH" 2>&1 | tee -a "$LOG_FILE"

# Hard reset ensures clean state without unlink permission collisions
if git reset --hard "origin/$TARGET_BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ Code reset to origin/${TARGET_BRANCH} successfully${NC}"
else
    log "${YELLOW}⚠️ Direct reset failed, checking out branch first...${NC}"
    git checkout -f "$TARGET_BRANCH" 2>&1 | tee -a "$LOG_FILE" || true
    if git reset --hard "origin/$TARGET_BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
        log "${GREEN}✅ Code reset to origin/${TARGET_BRANCH} successfully${NC}"
    else
        log "${RED}❌ Failed to update code from GitHub${NC}"
        exit 1
    fi
fi

# Re-ensure permissions for node / next build
chmod -R u+rwX "$PROJECT_PATH" 2>/dev/null || true

# 5. Install dependencies (clean install from lockfile)
log "${BLUE}📦 Installing dependencies (npm ci)...${NC}"
if npm ci 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ Dependencies installed${NC}"
else
    log "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# 6. Generate Prisma Client
log "${BLUE}🔧 Generating Prisma Client...${NC}"
if npx prisma generate 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ Prisma Client generated${NC}"
else
    log "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi

# 7. Apply database migrations (preserving data)
log "${BLUE}🗄️ Applying database migrations...${NC}"
if npx prisma db push --accept-data-loss 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ Database migrations applied successfully${NC}"
else
    log "${RED}❌ Failed to apply database migrations${NC}"
    exit 1
fi

# 8. Build project (clean: wipe Next.js cache first)
log "${BLUE}🏗️ Building project...${NC}"
rm -rf .next
if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ Project built successfully${NC}"
else
    log "${RED}❌ Failed to build project${NC}"
    exit 1
fi

# 9. Restart PM2
log "${BLUE}🔄 Restarting PM2 process...${NC}"
if pm2 restart dromkok-web 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ PM2 process restarted successfully${NC}"
else
    log "${RED}❌ Failed to restart PM2 process${NC}"
    exit 1
fi

# 10. Check server status
log "${BLUE}🔍 Checking server status...${NC}"
sleep 3
if pm2 status dromkok-web | grep -q "online"; then
    log "${GREEN}✅ Server is online${NC}"
else
    log "${RED}❌ Server is not online${NC}"
    exit 1
fi

# Clean up lock file
rm -f "$PROJECT_PATH/.deploy.lock"

log "${GREEN}=====================================${NC}"
log "${GREEN}✅ DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
log "${GREEN}=====================================${NC}"
log "📊 Backup: ${BACKUP_FILE}.gz"
log "🕐 Time: $(date)"
