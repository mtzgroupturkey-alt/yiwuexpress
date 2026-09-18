#!/bin/bash
###############################################################################
# rollback.sh — Rollback to a previous database backup
#
# Reads credentials from .env.production — no hardcoded passwords.
#
# Usage:
#   bash rollback.sh                                  # Restore latest backup
#   bash rollback.sh 20260919_153022                  # Restore by timestamp
#   bash rollback.sh /www/backup/dromkok/file.sql.gz  # Restore by full path
###############################################################################

set -e

# ── Configuration ─────────────────────────────────────────────────────────────
BACKUP_DIR="/www/backup/dromkok"
PROJECT_DIR="/www/wwwroot/www.dromkok.com/web"
PG_BIN="/www/server/pgsql/bin"

echo "====================================="
echo "⏪ DATABASE ROLLBACK"
echo "====================================="

# ── Load credentials from .env.production ────────────────────────────────────
ENV_FILE="${PROJECT_DIR}/.env.production"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env.production not found at $ENV_FILE" >&2
  exit 1
fi

DATABASE_URL=$(grep -v '^#' "$ENV_FILE" | grep 'DATABASE_URL' | head -1 | sed 's/DATABASE_URL=//' | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in $ENV_FILE" >&2
  exit 1
fi

DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# ── Determine backup file ─────────────────────────────────────────────────────
BACKUP_INPUT="${1:-}"

if [ -z "$BACKUP_INPUT" ]; then
  BACKUP_FILE="${BACKUP_DIR}/db_backup_latest.sql.gz"
  echo "📋 Using latest backup: $BACKUP_FILE"
elif [ -f "$BACKUP_INPUT" ]; then
  BACKUP_FILE="$BACKUP_INPUT"
  echo "📋 Using backup file: $BACKUP_FILE"
else
  BACKUP_FILE="${BACKUP_DIR}/db_backup_${BACKUP_INPUT}.sql.gz"
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE" >&2
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/db_backup_*.sql.gz 2>/dev/null | grep -v latest
    exit 1
  fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# ── Confirmation ──────────────────────────────────────────────────────────────
echo ""
echo "⚠️  WARNING: This will REPLACE all data in the database!"
echo "Database:  $DB_NAME @ $DB_HOST:$DB_PORT"
echo "Backup:    $BACKUP_FILE"
echo ""
read -p "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Rollback cancelled."
  exit 0
fi

# ── Create pre-restore backup ─────────────────────────────────────────────────
echo ""
echo "📦 Creating pre-restore backup first..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
bash "${PROJECT_DIR}/prisma/migrations/backup.sh" "pre_restore_${TIMESTAMP}" || {
  echo "⚠️ Pre-restore backup failed — proceeding with caution."
}

# ── Stop application ──────────────────────────────────────────────────────────
echo "⏸️  Stopping application..."
pm2 stop dromkok-web 2>/dev/null || echo "⚠️ App not running in PM2."

# ── Restore database ──────────────────────────────────────────────────────────
echo "🔄 Restoring database from: $BACKUP_FILE"

PSQL="${PG_BIN}/psql"
[ ! -f "$PSQL" ] && PSQL="psql"

export PGPASSWORD="$DB_PASS"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | "$PSQL" \
    -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --quiet 2>&1 | tee -a "${BACKUP_DIR}/restore.log"
else
  "$PSQL" \
    -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$BACKUP_FILE" --quiet 2>&1 | tee -a "${BACKUP_DIR}/restore.log"
fi

RESTORE_STATUS=${PIPESTATUS[0]}
unset PGPASSWORD

if [ "$RESTORE_STATUS" -ne 0 ]; then
  echo "❌ Database restore FAILED! Check: ${BACKUP_DIR}/restore.log" >&2
  pm2 restart dromkok-web 2>/dev/null || true
  exit 1
fi

echo "✅ Database restored successfully."

# ── Run migrations ─────────────────────────────────────────────────────────────
echo "🔧 Running Prisma migrate deploy..."
cd "$PROJECT_DIR"
npx prisma generate 2>/dev/null || true
npx prisma migrate deploy || echo "⚠️ Migrate deploy warning — check schema."

# ── Restart application ───────────────────────────────────────────────────────
echo "▶️  Restarting application..."
pm2 restart dromkok-web || pm2 start npm --name "dromkok-web" -- run start
pm2 save

echo ""
echo "====================================="
echo "✅ Rollback completed!"
echo "📁 Restored from: $BACKUP_FILE"
echo "🕐 Time: $(date)"
echo "====================================="
