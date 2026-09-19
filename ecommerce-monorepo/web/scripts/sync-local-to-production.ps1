#!/usr/bin/env pwsh
###############################################################################
# sync-local-to-production.ps1
#
# Dumps your local PostgreSQL database and restores it on the production server.
# Run this from PowerShell in the project root.
#
# Usage:
#   .\scripts\sync-local-to-production.ps1
#   .\scripts\sync-local-to-production.ps1 -DryRun      # Show steps only, don't execute
###############################################################################

param(
    [switch]$DryRun
)

# ── Configuration ─────────────────────────────────────────────────────────────
$PG_BIN     = "C:\Program Files\PostgreSQL\18\bin"
$LOCAL_DB   = "ecommerce"
$LOCAL_USER = "postgres"
$LOCAL_PASS = "balkhi123"
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"

# Production SSH details — set these or export as env vars before running
$SERVER_HOST = $env:SERVER_HOST
$SERVER_USER = $env:SERVER_USER
$SERVER_PASS = $env:SERVER_PASSWORD
$SERVER_PORT = if ($env:SERVER_PORT) { $env:SERVER_PORT } else { "22" }
$SERVER_PATH = "/www/wwwroot/www.dromkok.com/web"
$PG_REMOTE   = "/www/server/pgsql/bin"

$DUMP_FILE   = "$env:TEMP\dromkok_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# ── Colours ───────────────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red ; exit 1 }

# ── Validate credentials are set ─────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   LOCAL → PRODUCTION  Database Sync             ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Magenta

if (-not $SERVER_HOST) {
    Write-Host ""
    Write-Host "SERVER_HOST is not set. Please provide your server details:" -ForegroundColor Yellow
    $SERVER_HOST = Read-Host "  Server IP / hostname"
    $SERVER_USER = Read-Host "  SSH username"
    $SERVER_PASS = Read-Host "  SSH password"
    $SERVER_PORT = Read-Host "  SSH port (press Enter for 22)"
    if (-not $SERVER_PORT) { $SERVER_PORT = "22" }
}

Write-Host ""
Write-Host "  Source (local):  $LOCAL_USER@$LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB" -ForegroundColor Gray
Write-Host "  Target (server): $SERVER_USER@$SERVER_HOST:$SERVER_PORT $SERVER_PATH" -ForegroundColor Gray
Write-Host "  Dump file:       $DUMP_FILE" -ForegroundColor Gray

if ($DryRun) {
    Write-Warn "DRY RUN mode — no changes will be made."
}

Write-Host ""
Write-Host "⚠️  This will REPLACE all data on the production server with your local data." -ForegroundColor Red
$confirm = Read-Host "Type SYNC-TO-PRODUCTION to confirm"
if ($confirm -ne "SYNC-TO-PRODUCTION") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# ── Step 1: Dump local database ───────────────────────────────────────────────
Write-Step "Step 1: Dumping local database..."

if (-not $DryRun) {
    $env:PGPASSWORD = $LOCAL_PASS
    & "$PG_BIN\pg_dump.exe" `
        -h $LOCAL_HOST `
        -p $LOCAL_PORT `
        -U $LOCAL_USER `
        -d $LOCAL_DB `
        --no-owner `
        --no-acl `
        -F p `
        -f $DUMP_FILE

    if ($LASTEXITCODE -ne 0) { Write-Fail "pg_dump failed (exit $LASTEXITCODE)" }
    $env:PGPASSWORD = ""

    $sizeMB = [math]::Round((Get-Item $DUMP_FILE).Length / 1MB, 2)
    Write-OK "Dump created: $DUMP_FILE ($sizeMB MB)"
} else {
    Write-OK "[DRY RUN] Would dump to: $DUMP_FILE"
}

# ── Step 2: Upload dump to server ─────────────────────────────────────────────
Write-Step "Step 2: Uploading dump to server..."

$REMOTE_TMP = "/tmp/dromkok_sync.sql"

if (-not $DryRun) {
    # Try scp first; fall back to sshpass+scp
    $scpResult = & scp -P $SERVER_PORT -o StrictHostKeyChecking=no `
        $DUMP_FILE "${SERVER_USER}@${SERVER_HOST}:${REMOTE_TMP}" 2>&1

    if ($LASTEXITCODE -ne 0) {
        # Try with sshpass
        $scpResult2 = & sshpass -p $SERVER_PASS scp -P $SERVER_PORT `
            -o StrictHostKeyChecking=no `
            $DUMP_FILE "${SERVER_USER}@${SERVER_HOST}:${REMOTE_TMP}" 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Upload failed. Make sure scp or sshpass is available.`nError: $scpResult2"
        }
    }
    Write-OK "Dump uploaded to server: $REMOTE_TMP"
} else {
    Write-OK "[DRY RUN] Would upload to: ${SERVER_USER}@${SERVER_HOST}:${REMOTE_TMP}"
}

# ── Step 3: Restore on server ─────────────────────────────────────────────────
Write-Step "Step 3: Restoring database on server..."

$RESTORE_SCRIPT = @"
set -e
TARGET="$SERVER_PATH"
PG_BIN="$PG_REMOTE"
DUMP_FILE="$REMOTE_TMP"

echo '📋 Reading DB credentials from .env.production...'
ENV_FILE="\$TARGET/.env.production"
if [ ! -f "\$ENV_FILE" ]; then
    echo 'ERROR: .env.production not found' >&2
    exit 1
fi

DATABASE_URL=\$(grep -v '^#' "\$ENV_FILE" | grep 'DATABASE_URL' | head -1 | sed 's/DATABASE_URL=//' | tr -d '"' | tr -d "'")
DB_USER=\$(echo "\$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=\$(echo "\$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=\$(echo "\$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=\$(echo "\$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=\$(echo "\$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_HOST="\${DB_HOST:-localhost}"
DB_PORT="\${DB_PORT:-5432}"

echo "Database: \$DB_NAME @ \$DB_HOST:\$DB_PORT"

PSQL="\${PG_BIN}/psql"
[ ! -f "\$PSQL" ] && PSQL="psql"

echo '⏸️  Stopping app...'
pm2 stop dromkok-web 2>/dev/null || true

echo '🔄 Dropping and recreating database...'
export PGPASSWORD="\$DB_PASS"
\$PSQL -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d postgres --quiet -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='\$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true
\$PSQL -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d postgres --quiet -c "DROP DATABASE IF EXISTS \"\$DB_NAME\";"
\$PSQL -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d postgres --quiet -c "CREATE DATABASE \"\$DB_NAME\" WITH OWNER \"\$DB_USER\";"

echo '📥 Restoring dump...'
\$PSQL -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d "\$DB_NAME" --quiet < "\$DUMP_FILE"
unset PGPASSWORD

echo '🔧 Running prisma generate + migrate deploy...'
cd "\$TARGET"
npx prisma generate 2>/dev/null || true
npx prisma migrate deploy || true

echo '▶️  Restarting app...'
pm2 restart dromkok-web || pm2 start npm --name "dromkok-web" -- run start
pm2 save

echo ''
echo '✅ Sync complete! Local data is now live on production.'

# Cleanup
rm -f "\$DUMP_FILE"
"@

if (-not $DryRun) {
    $sshCmd = "ssh -p $SERVER_PORT -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST}"

    # Try without password first (key auth), then with sshpass
    echo $RESTORE_SCRIPT | & ssh -p $SERVER_PORT -o StrictHostKeyChecking=no `
        "${SERVER_USER}@${SERVER_HOST}" "bash -s" 2>&1

    if ($LASTEXITCODE -ne 0) {
        # Try with sshpass
        echo $RESTORE_SCRIPT | & sshpass -p $SERVER_PASS ssh -p $SERVER_PORT `
            -o StrictHostKeyChecking=no `
            "${SERVER_USER}@${SERVER_HOST}" "bash -s" 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Remote restore failed."
        }
    }

    Write-OK "Database restored on production server."
} else {
    Write-OK "[DRY RUN] Would restore dump on server and restart PM2."
}

# ── Cleanup ───────────────────────────────────────────────────────────────────
if (-not $DryRun -and (Test-Path $DUMP_FILE)) {
    Remove-Item $DUMP_FILE -Force
    Write-OK "Local dump file cleaned up."
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅  SYNC COMPLETE                              ║" -ForegroundColor Green
Write-Host "║   Your local data is now live on dromkok.com    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
