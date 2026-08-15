# 🔑 Deploy AI API Keys Management Feature

## What This Does

Adds a UI in the admin panel to manage AI translation API keys instead of editing `.env` files manually.

## Files Changed/Created

### 1. ✅ Database Schema Updated
**File:** `ecommerce-monorepo/web/prisma/schema.prisma`
- Added 5 new fields to `SystemSettings` model:
  - `openrouterApiKey`
  - `geminiApiKey`
  - `deepseekApiKey`
  - `qwenApiKey`
  - `kimiApiKey`

### 2. ✅ API Route Created
**File:** `ecommerce-monorepo/web/app/api/admin/settings/system/route.ts`
- GET: Fetch system settings
- PUT/POST: Update system settings

### 3. ✅ Helper Library Created
**File:** `ecommerce-monorepo/web/lib/api-keys.ts`
- `getApiKeys()` function
- Reads from database first, falls back to `.env`

### 4. ✅ Admin Page Updated
**File:** `ecommerce-monorepo/web/app/admin/settings/system/page.tsx`
- Full UI for managing API keys
- Password-style inputs with show/hide toggle
- Links to get API keys from each provider
- Save/Reset functionality

### 5. ⏳ Translation Route (NEEDS UPDATE)
**File:** `ecommerce-monorepo/web/app/api/admin/translate/route.ts`
- Needs to import and use `getApiKeys()` function

## Deployment Steps

### Step 1: Push Database Schema Changes
```bash
cd ecommerce-monorepo/web
npm run db:push
```

This will add the new API key columns to your database.

### Step 2: Update Translation Route

In `ecommerce-monorepo/web/app/api/admin/translate/route.ts`, add at the top:
```typescript
import { getApiKeys } from '@/lib/api-keys'
```

Then in the `POST` handler (around line 480), replace:
```typescript
const apiKey = process.env.OPENROUTER_API_KEY
if (!apiKey) {
  return NextResponse.json(
    { success: false, error: 'Translation service is not configured (missing OPENROUTER_API_KEY).' },
    { status: 200 }
  )
}
```

With:
```typescript
const apiKeys = await getApiKeys()
const apiKey = apiKeys.openrouterApiKey
if (!apiKey) {
  return NextResponse.json(
    { success: false, error: 'Translation service is not configured (missing OPENROUTER_API_KEY in System Settings).' },
    { status: 200 }
  )
}
```

Also update each provider function (callOpenRouter, callGemini, callDeepSeek, etc.) to accept apiKeys parameter and use them.

### Step 3: Commit and Push to GitHub
```bash
git add .
git commit -m "feat: Add AI API keys management in admin panel"
git push origin production
```

### Step 4: Deploy to Production Server
```powershell
cd C:\wamp64\www\yiwuexpress
.\deploy-ssl-and-fix.ps1
```

Or manually:
```bash
ssh djdn@39.175.57.2 -p 22
cd /www/wwwroot/www.dromkok.com/web
git pull origin production
npm run db:push
npm run build
pm2 restart ecommerce-monorepo
```

## How to Use

### After Deployment:

1. **Go to Admin Panel:**
   ```
   https://dromkok.com/admin/settings/system
   ```

2. **Enter Your API Keys:**
   - OpenRouter API Key: `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`
   - Or get new keys from:
     - OpenRouter: https://openrouter.ai
     - Google Gemini: https://makersuite.google.com/app/apikey
     - DeepSeek: https://platform.deepseek.com
     - Qwen: https://dashscope.aliyun.com
     - Kimi: https://platform.moonshot.cn

3. **Click "Save Settings"**

4. **Test Translation:**
   - Go to Products or Categories
   - Try auto-translate feature
   - Should work without error!

## Benefits

✅ **No more .env editing** - Manage keys from UI
✅ **Database-first** - Keys stored in database, synced across all instances
✅ **Fallback support** - If database empty, uses `.env` values
✅ **Security** - Keys hidden by default, show/hide toggle
✅ **Multi-provider** - Support for 5 different AI translation services
✅ **Easy updates** - Change keys anytime without server restart

## Priority Order

The translation service tries API keys in this order:
1. **OpenRouter** (Primary - free tier)
2. **Gemini** (Tier 1 - free tier)
3. **DeepSeek** (Tier 2 - failover)
4. **Qwen** (Tier 3 - failover)
5. **Kimi** (Tier 4 - failover)

You only need ONE API key for translations to work!

## Security Notes

- API keys are stored in database with controlled access
- Only admin users can access System Settings page
- Keys are displayed as password fields (hidden by default)
- Never commit API keys to Git
- Use different keys for development and production

## Troubleshooting

### If translation still doesn't work:

1. **Check keys are saved:**
   ```bash
   ssh djdn@39.175.57.2 -p 22
   psql -d ecommerce -c "SELECT openrouterApiKey FROM \"SystemSettings\";"
   ```

2. **Check PM2 logs:**
   ```bash
   pm2 logs ecommerce-monorepo --lines 50
   ```

3. **Check browser console:**
   - Open F12 → Console
   - Look for API errors

4. **Verify database schema updated:**
   ```bash
   cd /www/wwwroot/www.dromkok.com/web
   npm run db:push
   ```

5. **Clear Next.js cache:**
   ```bash
   cd /www/wwwroot/www.dromkok.com/web
   rm -rf .next
   npm run build
   pm2 restart ecommerce-monorepo
   ```

## Quick Deploy Script

Want a one-click deploy? Run:
```powershell
cd C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run db:push
git add .
git commit -m "feat: AI API keys management"
git push origin production
```

Then on server:
```bash
ssh djdn@39.175.57.2 -p 22 "cd /www/wwwroot/www.dromkok.com/web && git pull && npm run db:push && npm run build && pm2 restart ecommerce-monorepo"
```

## Summary

This feature moves AI API key management from `.env` files to the database, making it easy to update keys through the admin panel UI without touching server files or restarting services.

**Next:** Test it at `https://dromkok.com/admin/settings/system`!
