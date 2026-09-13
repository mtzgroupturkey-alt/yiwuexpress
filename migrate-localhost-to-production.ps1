# PowerShell Script: Complete Localhost to Production Migration
# Run this on your Windows localhost machine

param(
    [string]$ProdServer = "39.175.57.2",
    [string]$ProdUser = "djdn",
    [int]$ProdPort = 22,
    [string]$ProdTargetDir = "/www/wwwroot/www.dromkok.com/web",
    [string]$LocalProjectDir = "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web",
    [string]$LocalDbName = "ecommerce",
    [string]$LocalDbUser = "ecommerce",
    [string]$LocalDbPass = "",
    [string]$ProdDbName = "dromkok",
    [string]$ProdDbUser = "ecommerce",
    [string]$ProdDbPass = "ecommerce123"
)

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🚀 Complete Localhost to Production Migration" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will OVERWRITE production data!" -ForegroundColor Yellow
Write-Host "    - All files will be replaced"
Write-Host "    - Database will be replaced"
Write-Host "    - Uploads will be replaced"
Write-Host ""

$confirm = Read-Host "Are you sure you want to continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 1
}

# Check prerequisites
Write-Host ""
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan

# Check for mysqldump
if (-not (Get-Command mysqldump -ErrorAction SilentlyContinue)) {
    Write-Host "❌ mysqldump not found. Please install MySQL and add to PATH." -ForegroundColor Red
    Write-Host "   MySQL is in: C:\wamp64\bin\mysql\mysqlX.X.X\bin" -ForegroundColor Yellow
    exit 1
}

# Check for ssh/scp (Git Bash, WSL, or OpenSSH)
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ssh not found. Please install:" -ForegroundColor Red
    Write-Host "   - Git for Windows (includes Git Bash with ssh)" -ForegroundColor Yellow
    Write-Host "   - or OpenSSH: Install-WindowsCapability -Online -Name OpenSSH.Client*" -ForegroundColor Yellow
    exit 1
}

# Create temporary directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tempDir = Join-Path $env:TEMP "migration_$timestamp"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "📂 Using temporary directory: $tempDir" -ForegroundColor Green

# Step 1: Export local database
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "1️⃣  Exporting Local Database" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$dbDumpFile = Join-Path $tempDir "database_dump.sql"
Write-Host "📤 Exporting database: $LocalDbName..." -ForegroundColor Yellow

if ([string]::IsNullOrEmpty($LocalDbPass)) {
    mysqldump -u $LocalDbUser $LocalDbName > $dbDumpFile
} else {
    mysqldump -u $LocalDbUser -p"$LocalDbPass" $LocalDbName > $dbDumpFile
}

$dbSize = (Get-Item $dbDumpFile).Length / 1MB
Write-Host "✅ Database exported: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Green

# Step 2: Create archive of files
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "2️⃣  Creating Archive of Local Files" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$archiveFile = Join-Path $tempDir "project_files.zip"
Write-Host "📦 Creating archive (this may take a few minutes)..." -ForegroundColor Yellow

# Change to project directory
Push-Location $LocalProjectDir

# Exclude patterns
$excludePatterns = @(
    "node_modules",
    ".next",
    ".git",
    ".env.local",
    "coverage",
    "*.log",
    ".DS_Store",
    "Thumbs.db"
)

# Get all files except excluded
$filesToArchive = Get-ChildItem -Recurse -File | Where-Object {
    $file = $_
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($file.FullName -like "*$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
}

# Create zip archive
Compress-Archive -Path $filesToArchive.FullName -DestinationPath $archiveFile -Force

Pop-Location

$archiveSize = (Get-Item $archiveFile).Length / 1MB
Write-Host "✅ Archive created: $([math]::Round($archiveSize, 2)) MB" -ForegroundColor Green

# Step 3: Upload files to production
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "3️⃣  Uploading Files to Production" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Write-Host "📤 Uploading database dump..." -ForegroundColor Yellow
scp -P $ProdPort $dbDumpFile "${ProdUser}@${ProdServer}:/tmp/database_import.sql"

Write-Host "📤 Uploading project archive..." -ForegroundColor Yellow
scp -P $ProdPort $archiveFile "${ProdUser}@${ProdServer}:/tmp/project_files.zip"

Write-Host "✅ Files uploaded to production server" -ForegroundColor Green

# Step 4: Execute deployment on production
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "4️⃣  Deploying on Production Server" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$deployScript = @"
set -e

echo "🔧 Starting deployment on production server..."

# Backup current production
BACKUP_DIR="/www/backups/dromkok_backup_`$(date +%Y%m%d_%H%M%S)"
mkdir -p "`$BACKUP_DIR"

if [ -d "$ProdTargetDir" ]; then
  echo "💾 Backing up current production..."
  cp -r "$ProdTargetDir" "`$BACKUP_DIR/web"
  mysqldump -u "$ProdDbUser" -p"$ProdDbPass" "$ProdDbName" > "`$BACKUP_DIR/database_backup.sql" 2>/dev/null || true
fi

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all || true

# Extract files
echo "📦 Extracting files..."
cd "$ProdTargetDir"
rm -rf .next node_modules || true
unzip -o /tmp/project_files.zip

# Import database
echo "📥 Importing database..."
mysql -u "$ProdDbUser" -p"$ProdDbPass" "$ProdDbName" < /tmp/database_import.sql

# Setup environment
if [ ! -f ".env" ]; then
  echo "📝 Creating production .env..."
  cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL="postgresql://$ProdDbUser:$ProdDbPass@localhost:5432/$ProdDbName?schema=public"
JWT_SECRET="`$(openssl rand -base64 64 | tr -d '\n')"
NEXT_PUBLIC_API_URL="https://www.dromkok.com"
NEXT_PUBLIC_SITE_URL="https://www.dromkok.com"
EOF
fi

# Install & build
echo "📦 Installing dependencies..."
npm install --production=false

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🏗️  Building Next.js..."
npm run build

# Set permissions
chown -R www-data:www-data "$ProdTargetDir" 2>/dev/null || chown -R `$USER:`$USER "$ProdTargetDir"

# Start PM2
echo "🚀 Starting PM2..."
pm2 restart all || pm2 start npm --name "dromkok-web" -- run start
pm2 save

# Reload Nginx
nginx -t && systemctl reload nginx || true

# Cleanup
rm -f /tmp/database_import.sql /tmp/project_files.zip

echo "✅ Deployment complete!"
echo "📍 Backup: `$BACKUP_DIR"
"@

ssh -p $ProdPort "${ProdUser}@${ProdServer}" $deployScript

# Step 5: Verify
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "5️⃣  Verifying Deployment" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 5

Write-Host "🔍 Testing production site..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://www.dromkok.com" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Site is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Site may still be starting up" -ForegroundColor Yellow
}

try {
    $health = Invoke-WebRequest -Uri "https://www.dromkok.com/api/health" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ API health check passed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API health check failed" -ForegroundColor Yellow
}

# Cleanup
Write-Host ""
Write-Host "🧹 Cleaning up local temporary files..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Next Steps:"
Write-Host "   1. Visit: https://www.dromkok.com"
Write-Host "   2. Test all functionality"
Write-Host "   3. Update .env on production if needed"
Write-Host "   4. Review logs: ssh $ProdUser@$ProdServer 'pm2 logs'"
Write-Host ""
