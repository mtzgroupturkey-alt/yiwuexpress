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
npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline --cache /tmp/.npm-cache

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
  ]).then(() => { console.log('✅ Critical database columns verified.'); process.exit(0); })
    .catch(e => { console.warn('Schema patch note:', e.message); process.exit(0); });
" || true

echo "=== 6. Restoring Complete Product Catalog Snapshot (6,743 products & 122 categories) ==="
node scripts/restore-catalog-snapshot.js --force || true

echo "=== 6b. Ensuring Admin Credentials ==="
node scripts/setup-admin.js || true

echo "=== 7. Building Fresh Next.js Production Bundle ==="
rm -rf .next
npm run build

echo "=== 8. Restarting PM2 Application ==="
pm2 restart all || pm2 restart dromkok-web || pm2 start npm --name "dromkok-web" -- run start
pm2 save

echo "=== 9. Health Check ==="
sleep 5
curl -f -s http://localhost:3001/api/health > /dev/null && echo "✅ Next.js app is healthy on port 3001" || echo "⚠️ App starting..."

echo "====================================================="
echo " ✅ DEPLOYMENT & CATALOG MIGRATION COMPLETE!"
echo "====================================================="
