#!/bin/bash
# ==============================================================================
# Auto-Pilot Zero-Downtime Production Deployment Script
# Target: Ubuntu 24.04 LTS (Linux, LF endings, bash)
# Host App: Yiwu Express Next.js 14 App
# ==============================================================================

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "=========================================================="
echo "🚀 Starting Auto-Pilot Production Deployment Pipeline"
echo "Directory: $APP_DIR"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=========================================================="

# 1. PRE-FLIGHT ENVIRONMENT & TOOL CHECKS
echo "🔍 [1/6] Checking runtime dependencies..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "❌ PM2 is required but not installed."; exit 1; }

NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "⚠️ Warning: Node.js version is $NODE_MAJOR. Recommended: v24 LTS."
fi
echo "✅ Runtime dependencies verified."

# 2. RUN TEST SUITE VERIFICATION
echo "🧪 [2/6] Running automated test verification..."
npm run test:autopilot || {
  echo "❌ Auto-Pilot test suite failed. Aborting deployment."
  exit 1
}
echo "✅ All tests passed cleanly."

# 3. DATABASE MIGRATION & PRISMA CLIENT GENERATION
echo "🗄️ [3/6] Applying database migrations & generating Prisma client..."
npx prisma generate
npx prisma db push --skip-generate
echo "✅ Database schema synchronized."

# 4. BUILD PRODUCTION ARTIFACTS
echo "📦 [4/6] Building Next.js production bundle..."
npm run build || {
  echo "❌ Production build failed. Aborting deployment."
  exit 1
}
echo "✅ Production bundle built successfully."

# 5. ZERO-DOWNTIME PM2 RESTART
echo "🔄 [5/6] Reloading PM2 processes with zero downtime..."
if pm2 describe yiwuexpress-web >/dev/null 2>&1; then
  pm2 reload yiwuexpress-web --update-env
else
  pm2 start npm --name "yiwuexpress-web" -- start -- -p 3001
  pm2 save
fi
echo "✅ PM2 cluster reloaded."

# 6. POST-DEPLOYMENT HEALTH VERIFICATION
echo "🏥 [6/6] Verifying system health and secrets..."
sleep 3
HEALTH_RESPONSE=$(curl -sf http://localhost:3001/api/autopilot/health || echo '{"status":"failed"}')

if [[ "$HEALTH_RESPONSE" == *"\"status\":\"ok\""* ]]; then
  echo "=========================================================="
  echo "🎉 AUTO-PILOT DEPLOYMENT COMPLETED SUCCESSFULLY!"
  echo "Health Check: $HEALTH_RESPONSE"
  echo "=========================================================="
  exit 0
else
  echo "❌ Health check verification failed: $HEALTH_RESPONSE"
  echo "Review logs: pm2 logs yiwuexpress-web --lines 50"
  exit 1
fi
