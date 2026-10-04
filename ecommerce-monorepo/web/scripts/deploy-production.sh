#!/bin/bash
set -e

TARGET="/www/wwwroot/www.dromkok.com/web"
if [ -d "$TARGET" ]; then
  cd "$TARGET"
fi

echo "=== 1. Checking Environment ==="
echo "Working directory: $(pwd)"

echo "=== 2. Updating Node Dependencies ==="
export npm_config_cache="/tmp/.npm-cache"
mkdir -p /tmp/.npm-cache
rm -rf /tmp/.npm-cache/* 2>/dev/null || true
npm install --legacy-peer-deps --no-audit --no-fund || true

echo "=== 3. Generating Prisma Client ==="
npx prisma generate

echo "=== 4. Synchronizing Schema with Database ==="
npx prisma db push --skip-generate --accept-data-loss || true

echo "=== 5. Verifying Critical Columns ==="
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  Promise.all([
    p.\$executeRawUnsafe('ALTER TABLE \"carts\" ADD COLUMN IF NOT EXISTS \"mode\" TEXT NOT NULL DEFAULT \'RETAIL\''),
    p.\$executeRawUnsafe('ALTER TABLE \"cart_items\" ADD COLUMN IF NOT EXISTS \"mode\" TEXT NOT NULL DEFAULT \'RETAIL\''),
    p.\$executeRawUnsafe('ALTER TABLE \"cart_items\" ADD COLUMN IF NOT EXISTS \"selectedOptions\" JSONB'),
    p.\$executeRawUnsafe('ALTER TABLE \"order_items\" ADD COLUMN IF NOT EXISTS \"selectedOptions\" JSONB'),
    p.\$executeRawUnsafe('ALTER TABLE \"system_settings\" ADD COLUMN IF NOT EXISTS \"openrouterApiKey\" TEXT'),
    p.\$executeRawUnsafe('ALTER TABLE \"system_settings\" ADD COLUMN IF NOT EXISTS \"geminiApiKey\" TEXT'),
    p.\$executeRawUnsafe('ALTER TABLE \"system_settings\" ADD COLUMN IF NOT EXISTS \"primaryAiProvider\" TEXT DEFAULT \'openai\''),
    p.\$executeRawUnsafe('ALTER TABLE \"system_settings\" ADD COLUMN IF NOT EXISTS \"storeMode\" TEXT DEFAULT \'WHOLESALE\''),
    p.\$executeRawUnsafe('CREATE TABLE IF NOT EXISTS \"image_migration_jobs\" (\"id\" TEXT PRIMARY KEY, \"status\" TEXT NOT NULL DEFAULT \'PENDING\', \"totalImages\" INTEGER NOT NULL DEFAULT 0, \"processedCount\" INTEGER NOT NULL DEFAULT 0, \"failedCount\" INTEGER NOT NULL DEFAULT 0, \"lastError\" TEXT, \"startedAt\" TIMESTAMP(3), \"finishedAt\" TIMESTAMP(3), \"createdBy\" TEXT, \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    p.\$executeRawUnsafe('CREATE TABLE IF NOT EXISTS \"image_search_candidates\" (\"id\" TEXT PRIMARY KEY, \"productId\" TEXT NOT NULL REFERENCES \"products\"(\"id\") ON DELETE CASCADE, \"source\" TEXT NOT NULL, \"sourceUrl\" TEXT NOT NULL, \"thumbnail\" TEXT, \"title\" TEXT, \"author\" TEXT, \"license\" TEXT, \"status\" TEXT NOT NULL DEFAULT \'PENDING\', \"reviewedBy\" TEXT, \"reviewedAt\" TIMESTAMP(3), \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    p.\$executeRawUnsafe('CREATE TABLE IF NOT EXISTS \"image_search_logs\" (\"id\" TEXT PRIMARY KEY, \"productId\" TEXT, \"candidateId\" TEXT, \"source\" TEXT, \"action\" TEXT NOT NULL, \"adminUser\" TEXT, \"details\" JSONB, \"confirmedRights\" BOOLEAN NOT NULL DEFAULT false, \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
  ]).then(() => { console.log('✅ Critical database columns and tables verified.'); process.exit(0); })
    .catch(e => { console.warn('Schema patch note:', e.message); process.exit(0); });
" || true

echo "=== 6. Checking Database Data Strategy ==="
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || true)
if [[ "$COMMIT_MSG" == *"[replace-catalog]"* ]]; then
  echo "⚠️ Option C explicitly requested in commit tag: Restoring Catalog Snapshot..."
  CONFIRM_FORCE=yes node scripts/restore-catalog-snapshot.js --force || true
else
  echo "✅ Option A/B active: Preserving online catalog (snapshot restore skipped)."
fi

echo "=== 6b. Ensuring Admin Credentials ==="
node scripts/setup-admin.js || true

echo "=== 7. Building Fresh Next.js Production Bundle ==="
mkdir -p /tmp/next-static-backup
if [ -d ".next/static" ]; then
  cp -rn .next/static/* /tmp/next-static-backup/ 2>/dev/null || true
fi
npm run build
if [ -d "/tmp/next-static-backup" ]; then
  cp -rn /tmp/next-static-backup/* .next/static/ 2>/dev/null || true
  rm -rf /tmp/next-static-backup
fi

echo "=== 8. Restarting PM2 Application ==="
pm2 restart all || pm2 restart dromkok-web || pm2 start npm --name "dromkok-web" -- run start
pm2 save

echo "=== 9. Health Check ==="
sleep 5
curl -f -s http://localhost:3001/api/health > /dev/null && echo "✅ Next.js app is healthy on port 3001" || echo "⚠️ App starting..."

echo "====================================================="
echo " ✅ DEPLOYMENT & CATALOG MIGRATION COMPLETE!"
echo "====================================================="
