#!/bin/bash

###############################################################################
# Database Restore Script for YIWU EXPRESS
# 
# Restores PostgreSQL database from backup
# 
# Usage: 
#   bash restore.sh                    # Restore latest backup
#   bash restore.sh 20240115_143022    # Restore specific backup
#   bash restore.sh /path/to/backup.sql.gz  # Restore from file
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="/www/backup/dromkok"
PG_BIN="/www/server/pgsql/bin"
PROJECT_DIR="/www/wwwroot/www.dromkok.com/web"

# Log functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] !${NC} $1"
}

###############################################################################
# Load Database Credentials
###############################################################################

# Load environment variables
if [ -f "$PROJECT_DIR/.env.production" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env.production" | grep DATABASE_URL | xargs)
else
    log_error "Cannot find .env.production file"
    exit 1
fi

# Parse DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not found in environment"
    exit 1
fi

# Extract connection details
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

###############################################################################
# Determine Backup File
###############################################################################

BACKUP_INPUT=$1

if [ -z "$BACKUP_INPUT" ]; then
    # Use latest backup
    BACKUP_FILE="${BACKUP_DIR}/db_backup_latest.sql.gz"
    log "Using latest backup"
elif [ -f "$BACKUP_INPUT" ]; then
    # Use provided file path
    BACKUP_FILE="$BACKUP_INPUT"
    log "Using backup file: $BACKUP_FILE"
else
    # Assume it's a timestamp
    BACKUP_FILE="${BACKUP_DIR}/db_backup_${BACKUP_INPUT}.sql.gz"
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        log "Available backups:"
        ls -lh "${BACKUP_DIR}"/db_backup_*.sql.gz | grep -v latest
        exit 1
    fi
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

###############################################################################
# Confirmation
###############################################################################

log "=========================================="
log_warning "DATABASE RESTORE"
log "=========================================="
log "Database: $DB_NAME"
log "Backup: $BACKUP_FILE"
log_warning "This will REPLACE all data in the database!"
log "=========================================="

read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled"
    exit 0
fi

###############################################################################
# Create Pre-Restore Backup
###############################################################################

log "Creating pre-restore backup..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
bash "$PROJECT_DIR/prisma/migrations/backup.sh" "pre_restore_${TIMESTAMP}" || {
    log_warning "Pre-restore backup failed, but continuing..."
}

###############################################################################
# Stop Application
###############################################################################

log "Stopping application..."
pm2 stop dromkok-web 2>/dev/null || log_warning "Application not running in PM2"

###############################################################################
# Restore Database
###############################################################################

log "Restoring database from backup..."

export PGPASSWORD="$DB_PASS"

# Determine pg_restore or psql
if [ -f "$PG_BIN/psql" ]; then
    PSQL="$PG_BIN/psql"
else
    PSQL="psql"
fi

# Decompress and restore
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "Decompressing and restoring..."
    gunzip -c "$BACKUP_FILE" | $PSQL \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --quiet 2>&1 | tee -a "${BACKUP_DIR}/restore.log"
else
    log "Restoring from uncompressed backup..."
    $PSQL \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$BACKUP_FILE" \
        --quiet 2>&1 | tee -a "${BACKUP_DIR}/restore.log"
fi

if [ $? -eq 0 ]; then
    log_success "Database restored successfully"
else
    log_error "Database restore failed!"
    log_error "Check logs: ${BACKUP_DIR}/restore.log"
    unset PGPASSWORD
    exit 1
fi

unset PGPASSWORD

###############################################################################
# Run Migrations
###############################################################################

log "Running Prisma migrations..."

cd "$PROJECT_DIR"
npx prisma generate || log_warning "Prisma generate failed"
npx prisma db push --skip-generate || log_warning "Prisma db push failed"

log_success "Migrations completed"

###############################################################################
# Restart Application
###############################################################################

log "Restarting application..."
pm2 restart dromkok-web || pm2 start ecosystem.config.js

log_success "Application restarted"

###############################################################################
# Verification
###############################################################################

log "Verifying database connection..."

# Simple query to test connection
export PGPASSWORD="$DB_PASS"

if [ -f "$PG_BIN/psql" ]; then
    PSQL="$PG_BIN/psql"
else
    PSQL="psql"
fi

TABLE_COUNT=$($PSQL \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs)

unset PGPASSWORD

if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
    log_success "Database connection verified ($TABLE_COUNT tables found)"
else
    log_warning "Could not verify database tables"
fi

###############################################################################
# Summary
###############################################################################

log "=========================================="
log_success "Database restore completed!"
log "=========================================="
log "Restored from: $BACKUP_FILE"
log "Pre-restore backup: ${BACKUP_DIR}/db_backup_pre_restore_${TIMESTAMP}.sql.gz"
log "=========================================="

exit 0
