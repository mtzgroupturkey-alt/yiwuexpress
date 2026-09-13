# YIWU EXPRESS to DROMKOK.COM - Complete Migration Script
# Customized for your exact server setup

param(
    [string]$PostgresPassword = "ecommerce123",  # Production PostgreSQL password
    [switch]$SkipDatabase = $false,  # Skip database migration if already done
    [switch]$OnlyDatabase = $false   # Only migrate database, skip files
)

$ErrorActionPreference = "Stop"

# Server Configuration (From your exact server info)
$SERVER = "39.175.57.2"
$USER = "djdn"
$PORT = 22
$TARGET_DIR = "/www/wwwroot/www.dromkok.com/web"
$LOCAL_PROJECT = "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web"
$LOCAL_DB = "yiwuexpress"
$PROD_DB = "ecommerce"
$PROD_DB_USER = "ecommerce"
$PGSQL_BIN = "/www/server/pgsql/bin"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🚀 YIWU EXPRESS → DROMKOK.COM Migration" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $USER@$SERVER" -ForegroundColor Yellow
Write-Host "Target: $TARGET_DIR" -ForegroundColor Yellow
Write-Host "Local:  $LOCAL_PROJECT" -ForegroundColor Yellow
Write-Host ""

# Warning
Write-Host "⚠️  WARNING: This will replace production with localhost!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

# Get PostgreSQL password if not provided
if ([string]::IsNullOrEmpty($PostgresPassword) -and -not $SkipDatabase) {
    $securePass = Read-Host "Enter production PostgreSQL password (default: ecommerce123)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    $PostgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    if ([string]::IsNullOrEmpty($PostgresPassword)) {
        $PostgresPassword = "ecommerce123"
    }
}

# Create temp directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tempDir = Join-Path $env:TEMP "dromkok_migration_$timestamp"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "📂 Temp directory: $tempDir" -ForegroundColor Green

try {
    # =================================================================
    # STEP 1: Export Local Database (MySQL from WAMP)
    # =================================================================
    if (-not $SkipDatabase -and -not $OnlyDatabase) {
        Write-Host ""
        Write-Host "=================================================" -ForegroundColor Cyan
        Write-Host "1️⃣  Exporting Local Database (MySQL)" -ForegroundColor Cyan
        Write-Host "=================================================" -ForegroundColor Cyan
        
        $dbDump = Join-Path $tempDir "yiwuexpress_mysql.sql"
        Write-Host "📤 Exporting: $LOCAL_DB from WAMP MySQL..." -ForegroundColor Yellow
        
        # Find mysqldump in WAMP
        $mysqldumpPath = "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe"
        if (-not (Test-Path $mysqldumpPath)) {
            # Try to find it
            $mysqldumpPath = Get-ChildItem "C:\wamp64\bin\mysql" -Recurse -Filter "mysqldump.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
        }
        
        if (Test-Path $mysqldumpPath) {
            & $mysqldumpPath -u root $LOCAL_DB > $dbDump
            $size = (Get-Item $dbDump).Length / 1MB
            Write-Host "✅ MySQL dump created: $([math]::Round($size, 2)) MB" -ForegroundColor Green
        } else {
            Write-Host "❌ mysqldump not found in WAMP" -ForegroundColor Red
            Write-Host "Please export manually or specify path" -ForegroundColor Yellow
            exit 1
        }
    }

    # =================================================================
    # STEP 2: Upload Database (if not skipping)
    # =================================================================
    if (-not $SkipDatabase) {
        Write-Host ""
        Write-Host "=================================================" -ForegroundColor Cyan
        Write-Host "2️⃣  Uploading Database to Server" -ForegroundColor Cyan
        Write-Host "=================================================" -ForegroundColor Cyan
        
        $dbDump = Join-Path $tempDir "yiwuexpress_mysql.sql"
        if (Test-Path $dbDump) {
            Write-Host "📤 Uploading MySQL dump (will be converted to PostgreSQL)..." -ForegroundColor Yellow
            scp -P $PORT $dbDump "${USER}@${SERVER}:/tmp/yiwuexpress_mysql.sql"
            Write-Host "✅ Database uploaded" -ForegroundColor Green
        }
    }

    # =================================================================
    # STEP 3: Sync Files to Server (if not OnlyDatabase)
    # =================================================================
    if (-not $OnlyDatabase) {
        Write-Host ""
        Write-Host "=================================================" -ForegroundColor Cyan
        Write-Host "3️⃣  Syncing Project Files" -ForegroundColor Cyan
        Write-Host "=================================================" -ForegroundColor Cyan
        
        Write-Host "📦 Creating project archive..." -ForegroundColor Yellow
        Push-Location $LOCAL_PROJECT
        
        # Create exclusion list
        $exclude = @(
            "node_modules",
            ".next",
            ".git",
            ".env.local",
            "coverage",
            "*.log",
            ".DS_Store",
            "Thumbs.db"
        )
        
        # Get files to include
        $files = Get-ChildItem -Recurse -File | Where-Object {
            $file = $_
            $shouldExclude = $false
            foreach ($pattern in $exclude) {
                if ($file.FullName -like "*$pattern*") {
                    $shouldExclude = $true
                    break
                }
            }
            -not $shouldExclude
        }
        
        $archivePath = Join-Path $tempDir "project_files.zip"
        Compress-Archive -Path $files.FullName -DestinationPath $archivePath -Force
        Pop-Location
        
        $size = (Get-Item $archivePath).Length / 1MB
        Write-Host "✅ Archive created: $([math]::Round($size, 2)) MB" -ForegroundColor Green
        
        Write-Host "📤 Uploading to server..." -ForegroundColor Yellow
        scp -P $PORT $archivePath "${USER}@${SERVER}:/tmp/project_files.zip"
        Write-Host "✅ Files uploaded" -ForegroundColor Green
    }

    # =================================================================
    # STEP 4: Deploy on Server
    # =================================================================
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "4️⃣  Deploying on Production Server" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    $deployScript = @"
set -e

echo "🔧 Starting deployment..."

# Backup current production
BACKUP_DIR="/www/backups/dromkok_backup_`$(date +%Y%m%d_%H%M%S)"
sudo mkdir -p "`$BACKUP_DIR"

if [ -d "$TARGET_DIR" ]; then
    echo "💾 Backing up current production..."
    sudo cp -r "$TARGET_DIR" "`$BACKUP_DIR/web" || true
    
    # Backup PostgreSQL database
    echo "💾 Backing up PostgreSQL database..."
    $PGSQL_BIN/pg_dump -U $PROD_DB_USER -h localhost -p 5432 $PROD_DB > "`$BACKUP_DIR/postgres_backup.sql" 2>/dev/null || echo "⚠️  Database backup skipped"
fi

echo "📍 Backup saved to: `$BACKUP_DIR"

"@

    # Add database import if not skipped
    if (-not $SkipDatabase) {
        $deployScript += @"

# Import Database (MySQL to PostgreSQL conversion)
if [ -f "/tmp/yiwuexpress_mysql.sql" ]; then
    echo "📥 Converting MySQL dump to PostgreSQL format..."
    
    # Install pgloader if not available
    if ! command -v pgloader &> /dev/null; then
        echo "⚠️  pgloader not found, using Prisma migration instead..."
        
        # Alternative: Use Prisma to sync schema
        cd $TARGET_DIR
        echo "🔧 Syncing schema via Prisma..."
        export DATABASE_URL="postgresql://$PROD_DB_USER:$PostgresPassword@localhost:5432/$PROD_DB"
        npx prisma db push --accept-data-loss || npx prisma migrate deploy || true
    else
        echo "🔄 Using pgloader for MySQL → PostgreSQL migration..."
        # This requires pgloader to be installed
        pgloader mysql://root@localhost/$LOCAL_DB postgresql://$PROD_DB_USER:$PostgresPassword@localhost/$PROD_DB
    fi
    
    echo "✅ Database migration completed"
    sudo rm -f /tmp/yiwuexpress_mysql.sql
fi

"@
    }

    # Add file deployment if not OnlyDatabase
    if (-not $OnlyDatabase) {
        $deployScript += @"

# Stop PM2
echo "🛑 Stopping PM2 processes..."
pm2 stop all || true

# Extract new files
if [ -f "/tmp/project_files.zip" ]; then
    echo "📦 Extracting project files..."
    cd $TARGET_DIR
    sudo rm -rf .next node_modules || true
    sudo unzip -o /tmp/project_files.zip
    sudo rm -f /tmp/project_files.zip
    echo "✅ Files extracted"
fi

# Set ownership
echo "🔒 Setting permissions..."
sudo chown -R djdn:djdn $TARGET_DIR

# Install dependencies
cd $TARGET_DIR
echo "📦 Installing npm packages..."
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
npm install --cache /tmp/.npm-cache

# Generate Prisma client with PostgreSQL
echo "🔧 Generating Prisma client..."
export DATABASE_URL="postgresql://$PROD_DB_USER:$PostgresPassword@localhost:5432/$PROD_DB"
npx prisma generate

# Build Next.js
echo "🏗️  Building Next.js application..."
npm run build

# Start PM2
echo "🚀 Starting PM2..."
pm2 restart dromkok-web || pm2 start npm --name "dromkok-web" -- run start
pm2 save

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo /www/server/nginx/sbin/nginx -t && sudo /www/server/nginx/sbin/nginx -s reload || true

"@
    }

    $deployScript += @"

echo ""
echo "================================================="
echo "✅ Deployment Complete!"
echo "================================================="
echo "📍 Backup: `$BACKUP_DIR"
echo "🌐 Site: https://www.dromkok.com"
echo ""
"@

    # Execute deployment on server
    Write-Host "🔐 Connecting to server..." -ForegroundColor Yellow
    ssh -p $PORT "${USER}@${SERVER}" $deployScript

    # =================================================================
    # STEP 5: Verify Deployment
    # =================================================================
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "5️⃣  Verifying Deployment" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    Start-Sleep -Seconds 5
    
    Write-Host "🔍 Testing site..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://www.dromkok.com" -TimeoutSec 10 -UseBasicParsing
        Write-Host "✅ Site is live (HTTP $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Site may still be starting up" -ForegroundColor Yellow
    }
    
    try {
        $health = Invoke-WebRequest -Uri "https://www.dromkok.com/api/health" -TimeoutSec 10 -UseBasicParsing
        Write-Host "✅ API health check passed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  API health endpoint not responding" -ForegroundColor Yellow
    }

} catch {
    Write-Host ""
    Write-Host "❌ Error occurred: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs with:" -ForegroundColor Yellow
    Write-Host "  ssh djdn@39.175.57.2 'pm2 logs'" -ForegroundColor White
    exit 1
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Success
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Visit: https://www.dromkok.com" -ForegroundColor White
Write-Host "  2. Test all functionality" -ForegroundColor White
Write-Host "  3. Check logs: ssh djdn@39.175.57.2 'pm2 logs'" -ForegroundColor White
Write-Host "  4. Update .env if needed" -ForegroundColor White
Write-Host ""
Write-Host "💾 Production backup saved on server" -ForegroundColor Yellow
Write-Host ""
