#!/bin/bash
# rollback.sh - Rollback to previous version

set -e

echo "====================================="
echo "⏪ ROLLBACK"
echo "====================================="

BACKUP_DIR="/home/djdn/backups"

# List available backups
echo "📋 Available backups:"
ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz 2>/dev/null | tail -5

echo ""
read -p "Enter backup filename to restore (or 'cancel'): " BACKUP_FILE

if [ "$BACKUP_FILE" = "cancel" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ Backup file not found!"
    exit 1
fi

echo ""
echo "⚠️ WARNING: This will restore the database to a previous state!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

echo ""
echo "🔄 Restoring database..."

# Restore backup
export PGPASSWORD="LzZH5p5SnRtNKfMy"
gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | \
  /www/server/pgsql/bin/psql -U ecommerce -d ecommerce

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Database restore failed!"
    exit 1
fi

# Restart PM2
cd /www/wwwroot/www.dromkok.com/web
pm2 restart dromkok-web

echo "✅ Rollback completed!"
