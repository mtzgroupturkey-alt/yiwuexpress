#!/bin/bash
set -e

echo "================================================="
echo "🚀 Complete Localhost to Production Migration"
echo "================================================="
echo ""
echo "⚠️  WARNING: This will OVERWRITE production data!"
echo "    - All files will be replaced"
echo "    - Database will be replaced"
echo "    - Uploads will be replaced"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 1
fi

# Configuration - UPDATE THESE
PROD_SERVER="your-server-ip-or-domain"
PROD_USER="root"
PROD_PORT="22"
PROD_TARGET_DIR="/www/wwwroot/www.dromkok.com/web"
LOCAL_PROJECT_DIR="c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web"
LOCAL_DB_NAME="yiwuexpress"
LOCAL_DB_USER="root"
LOCAL_DB_PASS=""
PROD_DB_NAME="dromkok"
PROD_DB_USER="dromkok_user"
PROD_DB_PASS="your_production_db_password"

echo ""
echo "📋 Migration Configuration:"
echo "   Local:  $LOCAL_PROJECT_DIR"
echo "   Remote: $PROD_USER@$PROD_SERVER:$PROD_TARGET_DIR"
echo "   Local DB: $LOCAL_DB_NAME"
echo "   Remote DB: $PROD_DB_NAME"
echo ""
read -p "Is this correct? (yes/no): " config_confirm

if [ "$config_confirm" != "yes" ]; then
  echo "❌ Please update the script configuration first"
  exit 1
fi

# Create temporary directory
TEMP_DIR="/tmp/migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"
echo "📂 Using temporary directory: $TEMP_DIR"

# Step 1: Export local database
echo ""
echo "================================================="
echo "1️⃣  Exporting Local Database"
echo "================================================="

DB_DUMP_FILE="$TEMP_DIR/database_dump.sql"

if command -v mysqldump > /dev/null 2>&1; then
  echo "📤 Exporting database: $LOCAL_DB_NAME..."
  
  if [ -z "$LOCAL_DB_PASS" ]; then
    mysqldump -u "$LOCAL_DB_USER" "$LOCAL_DB_NAME" > "$DB_DUMP_FILE"
  else
    mysqldump -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASS" "$LOCAL_DB_NAME" > "$DB_DUMP_FILE"
  fi
  
  echo "✅ Database exported: $(du -h $DB_DUMP_FILE | cut -f1)"
else
  echo "❌ mysqldump not found. Please install MySQL client tools."
  exit 1
fi

# Step 2: Create archive of files
echo ""
echo "================================================="
echo "2️⃣  Creating Archive of Local Files"
echo "================================================="

cd "$LOCAL_PROJECT_DIR"
ARCHIVE_FILE="$TEMP_DIR/project_files.tar.gz"

echo "📦 Creating archive (this may take a few minutes)..."
tar -czf "$ARCHIVE_FILE" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='coverage' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  .

echo "✅ Archive created: $(du -h $ARCHIVE_FILE | cut -f1)"

# Step 3: Copy production .env for reference
echo ""
echo "================================================="
echo "3️⃣  Backing Up Production Environment"
echo "================================================="

echo "📥 Downloading production .env..."
scp -P "$PROD_PORT" "$PROD_USER@$PROD_SERVER:$PROD_TARGET_DIR/.env" "$TEMP_DIR/.env.production.backup" 2>/dev/null || echo "⚠️  No production .env found (will use .env.example)"

# Step 4: Upload files to production
echo ""
echo "================================================="
echo "4️⃣  Uploading Files to Production"
echo "================================================="

echo "📤 Uploading database dump..."
scp -P "$PROD_PORT" "$DB_DUMP_FILE" "$PROD_USER@$PROD_SERVER:/tmp/database_import.sql"

echo "📤 Uploading project archive..."
scp -P "$PROD_PORT" "$ARCHIVE_FILE" "$PROD_USER@$PROD_SERVER:/tmp/project_files.tar.gz"

echo "✅ Files uploaded to production server"

# Step 5: Execute deployment on production
echo ""
echo "================================================="
echo "5️⃣  Deploying on Production Server"
echo "================================================="

ssh -p "$PROD_PORT" "$PROD_USER@$PROD_SERVER" bash << ENDSSH
set -e

echo "🔧 Starting deployment on production server..."

# Backup current production
BACKUP_DIR="/www/backups/dromkok_backup_\$(date +%Y%m%d_%H%M%S)"
mkdir -p "\$BACKUP_DIR"

if [ -d "$PROD_TARGET_DIR" ]; then
  echo "💾 Backing up current production to \$BACKUP_DIR..."
  cp -r "$PROD_TARGET_DIR" "\$BACKUP_DIR/web"
  
  # Backup production database
  echo "💾 Backing up production database..."
  mysqldump -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" > "\$BACKUP_DIR/database_backup.sql" 2>/dev/null || echo "⚠️  Database backup failed (may not exist yet)"
fi

# Stop PM2 processes
echo "🛑 Stopping PM2 processes..."
pm2 stop all || true

# Extract new files
echo "📦 Extracting project files..."
cd "$PROD_TARGET_DIR"
rm -rf .next node_modules || true
tar -xzf /tmp/project_files.tar.gz

# Restore/setup environment
echo "⚙️  Setting up environment..."
if [ -f "/tmp/migration_env/.env.production.backup" ]; then
  echo "📋 Using previous production .env as reference"
  cp "/tmp/migration_env/.env.production.backup" .env.reference
fi

# Create production .env if it doesn't exist
if [ ! -f ".env" ]; then
  echo "📝 Creating production .env..."
  cat > .env << 'ENVEOF'
NODE_ENV=production
DATABASE_URL="postgresql://$PROD_DB_USER:$PROD_DB_PASS@localhost:5432/$PROD_DB_NAME?schema=public"
JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
NEXT_PUBLIC_API_URL="https://www.dromkok.com"
NEXT_PUBLIC_SITE_URL="https://www.dromkok.com"
ENVEOF
  echo "⚠️  Please update .env with correct values!"
fi

# Import database
echo "📥 Importing database..."
mysql -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" < /tmp/database_import.sql

echo "✅ Database imported successfully"

# Install dependencies
echo "📦 Installing production dependencies..."
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
npm install --production=false --cache /tmp/.npm-cache

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build Next.js
echo "🏗️  Building Next.js application..."
npm run build

# Set proper permissions
echo "🔒 Setting file permissions..."
chown -R www-data:www-data "$PROD_TARGET_DIR" 2>/dev/null || chown -R \$USER:\$USER "$PROD_TARGET_DIR"
find "$PROD_TARGET_DIR/public/uploads" -type d -exec chmod 755 {} \; 2>/dev/null || true
find "$PROD_TARGET_DIR/public/uploads" -type f -exec chmod 644 {} \; 2>/dev/null || true

# Start PM2
echo "🚀 Starting PM2 processes..."
pm2 restart all || pm2 start npm --name "dromkok-web" -- run start
pm2 save

# Reload Nginx
echo "🔄 Reloading Nginx..."
nginx -t && systemctl reload nginx || true

# Cleanup
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/database_import.sql /tmp/project_files.tar.gz

echo ""
echo "================================================="
echo "✅ Production Deployment Complete!"
echo "================================================="
echo ""
echo "📍 Backup location: \$BACKUP_DIR"
echo "🌐 Site: https://www.dromkok.com"
echo ""
echo "⚠️  IMPORTANT: Review and update .env if needed!"
echo ""

ENDSSH

# Step 6: Verify deployment
echo ""
echo "================================================="
echo "6️⃣  Verifying Deployment"
echo "================================================="

sleep 5

echo "🔍 Testing production site..."
if curl -f -s "https://www.dromkok.com" > /dev/null 2>&1; then
  echo "✅ Site is responding"
else
  echo "⚠️  Site may still be starting up"
fi

if curl -f -s "https://www.dromkok.com/api/health" > /dev/null 2>&1; then
  echo "✅ API health check passed"
else
  echo "⚠️  API health check failed"
fi

# Cleanup local temp
echo ""
echo "🧹 Cleaning up local temporary files..."
rm -rf "$TEMP_DIR"

echo ""
echo "================================================="
echo "✅ Migration Complete!"
echo "================================================="
echo ""
echo "📊 Next Steps:"
echo "   1. Visit: https://www.dromkok.com"
echo "   2. Test all functionality"
echo "   3. Update .env on production if needed"
echo "   4. Review PM2 logs: ssh $PROD_USER@$PROD_SERVER 'pm2 logs'"
echo ""
echo "💾 Production backup saved on server at:"
echo "   /www/backups/dromkok_backup_TIMESTAMP/"
echo ""
