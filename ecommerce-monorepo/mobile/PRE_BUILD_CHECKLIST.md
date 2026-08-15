# Pre-Build Checklist

## ✅ Configuration Verification

Before building your APK, verify these settings:

### 1. API Configuration

**File**: `src/config/api.config.ts`

```typescript
export const API_CONFIG = {
  PRODUCTION_URL: 'https://www.dromkok.com', // ✅ Correct
  ENVIRONMENT: 'production',                  // ✅ Must be 'production'
}
```

- [x] `ENVIRONMENT` set to `'production'`
- [x] `PRODUCTION_URL` points to `https://www.dromkok.com`

---

### 2. App Identity

**File**: `app.json`

```json
{
  "expo": {
    "name": "DROMKOK",                    // ✅ App display name
    "slug": "dromkok-app",                // ✅ Expo project slug
    "version": "1.0.0",                   // ⚠️ Increment for updates
    "android": {
      "package": "com.dromkok.app",       // ✅ Unique package ID
      "versionCode": 1                    // ⚠️ Increment for updates
    }
  }
}
```

- [x] App name: **DROMKOK**
- [x] Package: **com.dromkok.app**
- [ ] Version numbers updated (for new builds)

---

### 3. Build Configuration

**File**: `eas.json`

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"              // ✅ Builds APK (not AAB)
      }
    }
  }
}
```

- [x] Preview profile builds APK
- [x] Production profile configured

---

### 4. Dependencies

**File**: `package.json`

All dependencies should be installed:

```cmd
npm install
```

Check for outdated packages:
```cmd
npm outdated
```

- [ ] Dependencies installed
- [ ] No critical vulnerabilities (`npm audit`)

---

### 5. Assets

Required assets (these should exist):

- [ ] `assets/icon.png` (App icon)
- [ ] `assets/splash.png` (Splash screen)
- [ ] `assets/adaptive-icon.png` (Android adaptive icon)
- [ ] `assets/favicon.png` (Web favicon)

**Check assets:**
```cmd
dir assets
```

---

### 6. Backend Verification

Verify production API is accessible:

**Test URL**: https://www.dromkok.com/api

Test endpoints:
- [ ] https://www.dromkok.com/api/products
- [ ] https://www.dromkok.com/api/categories
- [ ] https://www.dromkok.com/api/settings

**Quick test:**
```cmd
curl https://www.dromkok.com/api/settings
```

Or open in browser to verify response.

---

### 7. Expo Account

- [ ] Expo account created (https://expo.dev/signup)
- [ ] Email verified
- [ ] Free tier has remaining builds (30/month)

**Check account:**
```cmd
eas whoami
```

---

### 8. System Requirements

- [x] Node.js installed (v18+)
- [x] npm installed
- [ ] Internet connection (required for EAS build)
- [ ] ~500MB free disk space (for build artifacts)

**Verify versions:**
```cmd
node --version
npm --version
```

---

### 9. Build Tools

- [ ] EAS CLI installed globally

**Install if missing:**
```cmd
npm install -g eas-cli
```

**Verify:**
```cmd
eas --version
```

---

### 10. Environment Variables

**Check if `.env` exists in mobile directory:**

```cmd
dir .env
```

If exists, verify it doesn't override production settings.

**For APK build, these should NOT be set:**
- ❌ `API_URL` (should use config file)
- ❌ Development-specific variables

---

## 🚀 Ready to Build?

If all items are checked, you're ready to build:

### Quick Start
```cmd
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
build-apk.bat
```

### Or Manual
```cmd
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
eas build --platform android --profile preview
```

---

## 📋 Post-Build Verification

After build completes:

1. [ ] Download APK from Expo dashboard
2. [ ] Install on test device
3. [ ] Verify app launches correctly
4. [ ] Test login functionality
5. [ ] Verify products load from production API
6. [ ] Test cart and checkout flow
7. [ ] Verify images load correctly
8. [ ] Test navigation between screens

---

## 🐛 Common Issues

### Issue: "Not logged in"
**Solution:**
```cmd
eas login
```

### Issue: "Project not configured"
**Solution:**
```cmd
eas build:configure
```

### Issue: "Build failed - missing dependencies"
**Solution:**
```cmd
npm install
eas build --platform android --profile preview
```

### Issue: "API not responding in app"
**Check:**
1. API URL in `api.config.ts`
2. Environment set to `'production'`
3. Backend server is running at https://www.dromkok.com

---

## 📞 Need Help?

- **Build Guide**: See `BUILD_APK_GUIDE.md`
- **Quick Commands**: See `BUILD_COMMANDS.md`
- **Expo Docs**: https://docs.expo.dev/build/introduction/

---

**All green? Time to build! 🚀**
