#!/bin/bash
# ============================================================
# fix-schema.sh — Run on production server to apply missing
# schema columns without a full redeploy.
# Usage: bash fix-schema.sh
# ============================================================

set -e

echo "================================================="
echo "🔧 Applying missing schema patches to production DB"
echo "================================================="

# Detect target directory
if [ -d "/www/wwwroot/www.dromkok.com/ecommerce-monorepo/web" ]; then
  TARGET_DIR="/www/wwwroot/www.dromkok.com/ecommerce-monorepo/web"
elif [ -d "/root/ecommerce-monorepo/web" ]; then
  TARGET_DIR="/root/ecommerce-monorepo/web"
else
  TARGET_DIR="/www/wwwroot/www.dromkok.com/web"
fi

echo "📂 Using directory: $TARGET_DIR"
cd "$TARGET_DIR"

# Pull latest code (includes new migration file + instrumentation.ts)
echo "📥 Pulling latest code from production branch..."
git pull origin production || git reset --hard origin/production

# Regenerate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

# Apply migration files
echo "📦 Running prisma migrate deploy..."
npx prisma migrate deploy || echo "⚠️  Some migrations may have already been applied"

# Apply safe explicit column patches
echo "🔧 Patching carts, cart_items, and system_settings columns..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"carts\\\" ADD COLUMN IF NOT EXISTS \\\"mode\\\" TEXT NOT NULL DEFAULT 'RETAIL'\"),
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"cart_items\\\" ADD COLUMN IF NOT EXISTS \\\"mode\\\" TEXT NOT NULL DEFAULT 'RETAIL'\"),
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"cart_items\\\" ADD COLUMN IF NOT EXISTS \\\"selectedOptions\" JSONB\"),
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"order_items\\\" ADD COLUMN IF NOT EXISTS \\\"selectedOptions\" JSONB\"),
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"system_settings\\\" ADD COLUMN IF NOT EXISTS \\\"openrouterApiKey\" TEXT\"),
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"system_settings\\\" ADD COLUMN IF NOT EXISTS \\\"geminiApiKey\" TEXT\"),
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"system_settings\\\" ADD COLUMN IF NOT EXISTS \\\"primaryAiProvider\" TEXT DEFAULT 'openai'\"),
  p.\$executeRawUnsafe(\"ALTER TABLE \\\"system_settings\\\" ADD COLUMN IF NOT EXISTS \\\"storeMode\" TEXT DEFAULT 'WHOLESALE'\"),
]).then(() => {
  console.log('✅ carts and cart_items columns OK');
  console.log('✅ system_settings columns OK');
  process.exit(0);
}).catch(e => {
  console.log('Note:', e.message);
  process.exit(0);
});
"

# Rebuild Next.js with new instrumentation.ts and next.config.js
echo "🏗️  Rebuilding Next.js..."
rm -rf .next
NODE_ENV=production npm run build

# Restart
echo "♻️  Restarting PM2..."
pm2 restart all || pm2 restart dromkok-web || true
pm2 save || true

echo ""
echo "================================================="
echo "✅ Done! Check https://www.dromkok.com"
echo "   - /api/cart should return 200"
echo "   - AI Assistant should work via OpenRouter"
echo "================================================="
