#!/bin/bash
# backup.sh - Database backup script

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/djdn/backups"
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
MAX_BACKUPS=5

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "====================================="
echo "💾 Creating Database Backup"
echo "====================================="

# Export database
export PGPASSWORD="LzZH5p5SnRtNKfMy"
if /www/server/pgsql/bin/pg_dump -U ecommerce -d ecommerce > "$BACKUP_FILE" 2>/dev/null; then
    gzip "$BACKUP_FILE"
    echo "✅ Backup created: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean old backups (keep last 5)
cd "$BACKUP_DIR"
ls -t db_backup_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
echo "✅ Old backups cleaned. Keeping last $MAX_BACKUPS backups."

echo "====================================="
echo "✅ Backup completed successfully"
echo "📁 Location: ${BACKUP_FILE}.gz"
echo "🕐 Time: $(date)"
