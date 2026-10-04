#!/bin/bash
# ==============================================================================
# Auto-Pilot Automated Backup Script
# Dumps PostgreSQL AutoPilot and business tables, compresses, and rotates daily.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/autopilot"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/autopilot_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

echo "📦 [$(date)] Starting Auto-Pilot database backup..."

# Extract DB credentials from environment or default
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/ecommerce}"

pg_dump "${DB_URL}" \
  --table="autopilot_cycles" \
  --table="probes" \
  --table="decisions" \
  --table="action_approvals" \
  --table="audit_entries" \
  --table="domain_events" \
  --table="policy_rules" \
  --table="materialized_views" \
  --table="autopilot_notifications" \
  --table="decision_memories" \
  | gzip -9 > "${BACKUP_FILE}"

echo "✅ Backup successfully created at ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Prune backups older than 30 days
find "${BACKUP_DIR}" -type f -name "autopilot_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "🧹 Pruned backups older than ${RETENTION_DAYS} days."
