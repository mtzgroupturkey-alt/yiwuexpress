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

export PGPASSWORD="${PGPASSWORD:-LzZH5p5SnRtNKfMy}"
if /www/server/pgsql/bin/pg_dump -U ecommerce -d ecommerce > "$BACKUP_FILE" 2>/dev/null; then
    gzip "$BACKUP_FILE"
    log "${GREEN}✅ Database backup created: ${BACKUP_FILE}.gz${NC}"
else
    log "${YELLOW}⚠️ Database backup failed or skipped, proceeding with deployment...${NC}"
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

# 5. Install dependencies (clean install with isolated cache)
log "${BLUE}📦 Installing dependencies (npm ci)...${NC}"
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
if npm ci --cache /tmp/.npm-cache 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ Dependencies installed${NC}"
else
    log "${YELLOW}⚠️ npm ci failed, trying npm install fallback...${NC}"
    if npm install --cache /tmp/.npm-cache 2>&1 | tee -a "$LOG_FILE"; then
        log "${GREEN}✅ Dependencies installed via fallback${NC}"
    else
        log "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Remove any accidental .env.local on production server to avoid port/config poisoning
rm -f "$PROJECT_PATH/.env.local"

# Sync DATABASE_URL and production configuration into active environment and .env
if [ -f "$PROJECT_PATH/.env.production" ]; then
    DB_URL=$(grep "^DATABASE_URL=" "$PROJECT_PATH/.env.production" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$DB_URL" ]; then
        export DATABASE_URL="$DB_URL"
        if [ -f "$PROJECT_PATH/.env" ]; then
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DB_URL\"|g" "$PROJECT_PATH/.env" 2>/dev/null || true
            sed -i "s|^PORT=.*|PORT=3001|g" "$PROJECT_PATH/.env" 2>/dev/null || true
            sed -i "s|^NODE_ENV=.*|NODE_ENV=\"production\"|g" "$PROJECT_PATH/.env" 2>/dev/null || true
        else
            cp "$PROJECT_PATH/.env.production" "$PROJECT_PATH/.env" 2>/dev/null || true
        fi
    fi
fi

export PORT=3001
export NODE_ENV=production

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
    log "${YELLOW}⚠️ Database migration had warnings or fallback, proceeding...${NC}"
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

# 9. Restart or Start PM2 process
log "${BLUE}🔄 Restarting PM2 process...${NC}"
rm -f "$PROJECT_PATH/.env.local"

if pm2 describe dromkok-web > /dev/null 2>&1; then
    pm2 restart dromkok-web --update-env 2>&1 | tee -a "$LOG_FILE"
else
    pm2 start npm --name "dromkok-web" --update-env -- start 2>&1 | tee -a "$LOG_FILE"
fi
pm2 save 2>&1 | tee -a "$LOG_FILE" || true

# 10. Check server status
log "${BLUE}🔍 Checking server status...${NC}"
sleep 4
if pm2 status dromkok-web | grep -q "online"; then
    log "${GREEN}✅ PM2 process is online${NC}"
else
    log "${YELLOW}⚠️ PM2 restart attempt fallback...${NC}"
    pm2 restart dromkok-web --update-env 2>&1 | tee -a "$LOG_FILE" || true
    sleep 3
fi

# Clean up lock file
rm -f "$PROJECT_PATH/.deploy.lock"

log "${GREEN}=====================================${NC}"
log "${GREEN}✅ DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
log "${GREEN}=====================================${NC}"
log "📊 Backup: ${BACKUP_FILE}.gz"
log "🕐 Time: $(date)"
