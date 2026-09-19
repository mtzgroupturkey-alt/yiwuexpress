#!/bin/bash
###############################################################################
# backup.sh — PostgreSQL backup for dromkok.com
#
# Reads credentials from .env.production — no hardcoded passwords.
# Keeps the last MAX_BACKUPS backups (default: 5).
#
# Usage:
#   bash backup.sh               # Standard timestamped backup
#   bash backup.sh my_label      # Backup with custom label suffix
###############################################################################

set -e

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_DIR="/www/wwwroot/www.dromkok.com/web"
BACKUP_DIR="/www/backup/dromkok"
if ! mkdir -p "$BACKUP_DIR" 2>/dev/null; then
  BACKUP_DIR="${PROJECT_DIR}/backups"
  mkdir -p "$BACKUP_DIR" 2>/dev/null || BACKUP_DIR="/tmp/backups"
  mkdir -p "$BACKUP_DIR" 2>/dev/null || true
fi
PG_BIN="/www/server/pgsql/bin"
MAX_BACKUPS=7
LABEL="${1:-}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="db_backup_${TIMESTAMP}${LABEL:+_$LABEL}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

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

# Parse components from DATABASE_URL
# Format: postgresql://user:password@host:port/dbname?params
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
  echo "ERROR: Could not parse DATABASE_URL" >&2
  exit 1
fi

# ── Create backup directory ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "====================================="
echo "📦 Creating Database Backup"
echo "====================================="
echo "Database:  $DB_NAME @ $DB_HOST:$DB_PORT"
echo "Output:    ${BACKUP_FILE}.gz"
echo "Time:      $(date)"

# ── Run pg_dump ───────────────────────────────────────────────────────────────
PG_DUMP="${PG_BIN}/pg_dump"
if [ ! -f "$PG_DUMP" ]; then
  PG_DUMP="pg_dump"  # fall back to PATH
fi

export PGPASSWORD="$DB_PASS"

if $PG_DUMP \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    > "$BACKUP_FILE" 2>/dev/null; then
  gzip "$BACKUP_FILE"
  FINAL_FILE="${BACKUP_FILE}.gz"
  echo "✅ Backup created: $FINAL_FILE"
else
  echo "❌ Backup failed!" >&2
  unset PGPASSWORD
  exit 1
fi

unset PGPASSWORD

# ── Update latest symlink ─────────────────────────────────────────────────────
ln -sf "$FINAL_FILE" "${BACKUP_DIR}/db_backup_latest.sql.gz"

# ── Prune old backups (keep last MAX_BACKUPS) ─────────────────────────────────
cd "$BACKUP_DIR"
ls -t db_backup_*.sql.gz 2>/dev/null | grep -v 'latest' | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
echo "✅ Old backups pruned. Keeping last $MAX_BACKUPS backups."

echo "====================================="
echo "✅ Backup completed successfully"
echo "📁 Location: $FINAL_FILE"
echo "🕐 Time: $(date)"
echo "====================================="
