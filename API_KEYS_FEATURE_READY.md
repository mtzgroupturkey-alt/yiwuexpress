# ✅ AI API Keys Management Feature - READY TO DEPLOY

## What's Done

I've implemented a complete **AI API Keys Management** feature for your admin panel!

### ✅ Completed:

1. **Database Schema** - Added 5 API key fields to `SystemSettings`:
   - `openrouterApiKey`
   - `geminiApiKey`
   - `deepseekApiKey`  
   - `qwenApiKey`
   - `kimiApiKey`

2. **Admin UI** - Beautiful management page at `/admin/settings/system`:
   - Password-style inputs with show/hide toggle
   - Links to get API keys from each provider
   - Save/Reset functionality
   - Responsive design

3. **API Route** - `/api/admin/settings/system`:
   - GET: Fetch system settings
   - PUT/POST: Update system settings

4. **Helper Library** - `lib/api-keys.ts`:
   - `getApiKeys()` function
   - Reads from database first
   - Falls back to `.env` if database empty

5. **Translation Service Updated** - `app/api/admin/translate/route.ts`:
   - Now uses `getApiKeys()` instead of `process.env`
   - All 5 providers updated (OpenRouter, Gemini, DeepSeek, Qwen, Kimi)
   - Cascading failover still works

6. **Local Database Updated**:
   - Schema pushed to local PostgreSQL
   - Ready for production deployment

---

## 🚀 To Deploy to Production:

### Option 1: Run the deployment script (Easiest!)

```powershell
.\deploy-api-keys-feature.ps1
```

This will:
- Update production database schema
- Commit changes to Git
- Push to production branch  
- Deploy to server
- Rebuild and restart app

### Option 2: Manual deployment

```bash
# SSH to server
ssh djdn@39.175.57.2 -p 22

# Navigate to project
cd /www/wwwroot/www.dromkok.com/web

# Pull latest code
git pull origin production

# Update database schema
npm run db:push

# Build app
npm run build

# Restart PM2
pm2 restart ecommerce-monorepo
```

---

## 📝 After Deployment:

1. **Go to System Settings:**
   ```
   https://dromkok.com/admin/settings/system
   ```

2. **Enter your OpenRouter API Key:**
   ```
   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
   ```

3. **Click "Save Settings"**

4. **Test translation:**
   - Go to Products or Categories
   - Try the auto-translate feature
   - Should work immediately! ✅

---

## ✨ How It Works:

### Priority Order:

1. **Database first** - Checks `SystemSettings` table
2. **Environment fallback** - Uses `.env` if database empty

### API Provider Cascade:

When you click translate, it tries:
1. OpenRouter (your key)
2. Gemini (if OpenRouter fails)
3. DeepSeek (if Gemini fails)
4. Qwen (if DeepSeek fails)
5. Kimi (if Qwen fails)

You only need **ONE** API key for it to work!

---

## 🎯 Benefits:

✅ **No more .env editing** - Manage keys from browser  
✅ **Database-first** - Keys synced across all instances  
✅ **Live updates** - No server restart needed  
✅ **Secure** - Keys hidden by default with show/hide toggle  
✅ **Multi-provider** - Support for 5 AI services  
✅ **Fallback support** - Works with `.env` if database empty  

---

## 📖 Full Documentation:

- `DEPLOY_API_KEYS_FEATURE.md` - Complete deployment guide
- `deploy-api-keys-feature.ps1` - Automated deployment script

---

## ⚠️ IMPORTANT:

After deployment, **translation will NOT work** until you:
1. Go to `https://dromkok.com/admin/settings/system`
2. Enter your OpenRouter API key
3. Click "Save"

The key from your local `.env.local` is NOT deployed to production (it's in `.gitignore`).

---

## 🎉 Ready to Deploy!

Just run:
```powershell
.\deploy-api-keys-feature.ps1
```

Then go to admin panel and add your API key!
